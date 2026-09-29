<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditHistorique;
use App\Models\BaremeDetail;
use App\Models\Candidat;
use App\Models\DemandeLogement;
use App\Models\DocumentFourni;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AssignmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = DemandeLogement::with(['candidat', 'bareme', 'documents', 'historique']);

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('statut_dossier', $request->status);
        }

        if ($request->filled('direction_provinciale')) {
            $query->whereHas('candidat', fn($candidateQuery) =>
                $candidateQuery->where('direction_provinciale', $request->direction_provinciale)
            );
        }

        $demandes = $query->orderByDesc('date_creation')->orderByDesc('id')->paginate(15);

        return response()->json($demandes);
    }

