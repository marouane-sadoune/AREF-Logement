<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use App\Models\Employee;
use App\Models\Lodging;
use App\Services\Note40ScoreCalculator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AssignmentController extends Controller
{
    protected Note40ScoreCalculator $calculator;

    public function __construct(Note40ScoreCalculator $calculator)
    {
        $this->calculator = $calculator;
    }

    public function index(Request $request): JsonResponse
    {
        $query = Assignment::with(['employee.directionProvinciale', 'lodging.directionProvinciale']);

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('dp_id')) {
            $query->whereHas('employee', fn($q) => $q->where('direction_provinciale_id', $request->dp_id));
        }

        $assignments = $query->latest()->paginate(15);

        return response()->json($assignments);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'lodging_id' => 'required|exists:lodgings,id',
            'seniority_etablissement_years' => 'integer|min:0',
        ]);

        $employee = Employee::findOrFail($validated['employee_id']);
        $scores = $this->calculator->calculate($employee, $validated['seniority_etablissement_years'] ?? 0);

        $refNumber = 'DOS-' . date('Y') . '-' . strtoupper(substr(uniqid(), -5));

        $assignment = Assignment::create([
            'reference_number' => $refNumber,
            'employee_id' => $employee->id,
            'lodging_id' => $validated['lodging_id'],
            'status' => 'submitted',
            'seniority_general_points' => $scores['seniority_general_points'],
            'seniority_etablissement_points' => $scores['seniority_etablissement_points'],
            'grade_points' => $scores['grade_points'],
            'marital_points' => $scores['family_points'],
            'total_score' => $scores['total_score'],
        ]);

        return response()->json([
            'message' => 'تم إنشاء طلب الاستفادة بنجاح',
            'data' => $assignment->load(['employee', 'lodging'])
        ], 201);
    }

    public function show($id): JsonResponse
    {
        $assignment = Assignment::with(['employee.directionProvinciale', 'lodging'])->findOrFail($id);
        return response()->json($assignment);
    }

    public function updateStatus(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:submitted,dp_validated,aref_pv_published,approved,rejected',
            'incoming_mail_num' => 'nullable|string',
            'incoming_mail_date' => 'nullable|date',
            'decision_number' => 'nullable|string',
            'decision_date' => 'nullable|date',
            'rejection_reason' => 'nullable|string',
        ]);

        $assignment = Assignment::findOrFail($id);
        $assignment->update($validated);

        // إذا تمت المصادقة، تحديث وضعية السكن
        if ($validated['status'] === 'approved') {
            $assignment->lodging->update(['occupancy_status' => 'occupied']);
        }

        return response()->json([
            'message' => 'تم تحديث وضعية الملف بنجاح',
            'data' => $assignment
        ]);
    }
}
