<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditHistorique;
use App\Models\BaremeDetail;
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

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'candidat_ppr' => 'required|exists:candidats,ppr',
            'type_logement' => 'required|in:fonction,administratif',
            'etablissement_cible' => 'required|string|max:150',
            'categorie_logement' => 'nullable|string|max:100',
            'adresse_logement' => 'nullable|string',
            'numero_logement' => 'nullable|string|max:50',
            'statut_logement' => 'nullable|in:vacant,occupe_a_evacuer,en_maintenance',
            'statut_dossier' => 'sometimes|in:draft,submitted_dp,under_review_dp,transmitted_aref,approved,rejected',
            'date_creation' => 'nullable|date',
            'reasons' => 'nullable|string',
            'acteur' => 'nullable|string|max:100',
            'commentaire' => 'nullable|string',
            'pts_anciennete_generale' => 'sometimes|integer|min:0',
            'pts_anciennete_etablissement' => 'sometimes|integer|min:0',
            'pts_echelle' => 'sometimes|integer|min:0',
            'pts_situation_familiale' => 'sometimes|integer|min:0',
            'pts_enfants' => 'sometimes|integer|min:0',
            'bonus_responsabilite' => 'sometimes|integer|min:0',
        ]);

        $scoreFields = [
            'pts_anciennete_generale',
            'pts_anciennete_etablissement',
            'pts_echelle',
            'pts_situation_familiale',
            'pts_enfants',
            'bonus_responsabilite',
        ];
        $scores = collect($scoreFields)->mapWithKeys(fn(string $field) => [
            $field => $validated[$field] ?? 0,
        ])->all();
        $numeroDossier = 'DOS-' . now()->format('Y') . '-' . Str::upper(Str::random(8));

        $demande = DB::transaction(function () use ($validated, $scores, $numeroDossier) {
            $demande = DemandeLogement::create([
                'numero_dossier' => $numeroDossier,
                'candidat_ppr' => $validated['candidat_ppr'],
                'type_logement' => $validated['type_logement'],
                'etablissement_cible' => $validated['etablissement_cible'],
                'categorie_logement' => $validated['categorie_logement'] ?? null,
                'adresse_logement' => $validated['adresse_logement'] ?? null,
                'numero_logement' => $validated['numero_logement'] ?? null,
                'statut_logement' => $validated['statut_logement'] ?? 'vacant',
                'statut_dossier' => $validated['statut_dossier'] ?? 'draft',
                'date_creation' => $validated['date_creation'] ?? now()->toDateString(),
                'total_bareme' => array_sum($scores),
                'reasons' => $validated['reasons'] ?? null,
            ]);

            BaremeDetail::create([
                'numero_dossier' => $numeroDossier,
                ...$scores,
                'total_points' => array_sum($scores),
            ]);
            DocumentFourni::create(['numero_dossier' => $numeroDossier]);
            AuditHistorique::create([
                'numero_dossier' => $numeroDossier,
                'date_action' => now()->toDateTimeString(),
                'acteur' => $validated['acteur'] ?? 'API',
                'decision' => 'Création du dossier',
                'commentaire' => $validated['commentaire'] ?? null,
            ]);

            return $demande;
        });

        return response()->json([
            'message' => 'تم إنشاء طلب الاستفادة بنجاح',
            'data' => $demande->load(['candidat', 'bareme', 'documents', 'historique']),
        ], 201);
    }

    public function show($id): JsonResponse
    {
        $demande = DemandeLogement::with(['candidat', 'bareme', 'documents', 'historique'])->findOrFail($id);

        return response()->json($demande);
    }

    public function updateStatus(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'sometimes|in:draft,submitted_dp,under_review_dp,transmitted_aref,approved,rejected',
            'statut_dossier' => 'sometimes|in:draft,submitted_dp,under_review_dp,transmitted_aref,approved,rejected',
            'numero_bordereau_dp' => 'nullable|string|max:50',
            'date_transmission_aref' => 'nullable|date',
            'numero_decision_aref' => 'nullable|string|max:50',
            'date_commission_aref' => 'nullable|date',
            'reasons' => 'nullable|string',
            'acteur' => 'nullable|string|max:100',
            'commentaire' => 'nullable|string',
        ]);

        $demande = DemandeLogement::findOrFail($id);
        $status = $validated['statut_dossier'] ?? $validated['status'] ?? null;
        $changes = collect($validated)->only([
            'numero_bordereau_dp',
            'date_transmission_aref',
            'numero_decision_aref',
            'date_commission_aref',
            'reasons',
        ])->all();

        DB::transaction(function () use ($demande, $status, $changes, $validated) {
            if ($status !== null) {
                $changes['statut_dossier'] = $status;
            }
            $demande->update($changes);

            if ($status !== null || $changes !== []) {
                AuditHistorique::create([
                    'numero_dossier' => $demande->numero_dossier,
                    'date_action' => now()->toDateTimeString(),
                    'acteur' => $validated['acteur'] ?? 'API',
                    'decision' => $status === null ? 'Mise à jour du dossier' : 'Statut: ' . $status,
                    'commentaire' => $validated['commentaire'] ?? null,
                ]);
            }
        });

        return response()->json([
            'message' => 'تم تحديث وضعية الملف بنجاح',
            'data' => $demande->fresh()->load(['candidat', 'bareme', 'documents', 'historique']),
        ]);
    }
}
