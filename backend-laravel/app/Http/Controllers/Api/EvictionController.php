<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EvictionProcedure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EvictionController extends Controller
{
    public function index(): JsonResponse
    {
        $procedures = EvictionProcedure::with('demande.candidat')
            ->orderByDesc('id')
            ->get();

        return response()->json(['data' => $procedures]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'numero_dossier' => 'required|string|max:50|exists:demandes_logement,numero_dossier',
            'case_type' => 'required|in:cessation_travail,retraite,fin_mission,occupation_non_personnelle,logement_personnel',
            'trigger_date' => 'required|date',
            'deadline_extended' => 'sometimes|boolean',
            'status' => 'sometimes|in:notified,vacated,refused,rent_applied,disciplinary,judicial',
            'notice_sent_date' => 'nullable|date',
            'vacate_date' => 'nullable|date',
            'rent_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        // الأجل (deadline_months / deadline_date) يحتسب تلقائيا في خطاف saving بالنموذج.
        $procedure = EvictionProcedure::create($validated);

        return response()->json([
            'message' => 'تم فتح مسطرة الإفراغ بنجاح',
            'data' => $procedure->load('demande.candidat'),
        ], 201);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $procedure = EvictionProcedure::findOrFail($id);

        $validated = $request->validate([
            'case_type' => 'sometimes|in:cessation_travail,retraite,fin_mission,occupation_non_personnelle,logement_personnel',
            'trigger_date' => 'sometimes|date',
            'deadline_extended' => 'sometimes|boolean',
            'status' => 'sometimes|in:notified,vacated,refused,rent_applied,disciplinary,judicial',
            'notice_sent_date' => 'nullable|date',
            'vacate_date' => 'nullable|date',
            'rent_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $procedure->update($validated);

        return response()->json([
            'message' => 'تم تحديث مسطرة الإفراغ',
            'data' => $procedure->fresh()->load('demande.candidat'),
        ]);
    }

    public function destroy($id): JsonResponse
    {
        EvictionProcedure::findOrFail($id)->delete();

        return response()->json(['message' => 'تم حذف مسطرة الإفراغ']);
    }
}
