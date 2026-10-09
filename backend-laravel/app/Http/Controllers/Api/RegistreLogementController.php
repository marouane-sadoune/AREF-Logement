<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RegistreLogement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RegistreLogementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = RegistreLogement::with('occupant')->orderByDesc('updated_at');

        if ($dp = $request->query('dp')) {
            $query->where('direction_provinciale', $dp);
        }
        if ($statut = $request->query('statut')) {
            $query->where('statut', $statut);
        }
        if ($type = $request->query('type')) {
            $query->where('type_logement', $type);
        }
        if ($search = $request->query('q')) {
            $query->where(function ($q) use ($search) {
                $q->where('numero_logement', 'like', "%{$search}%")
                  ->orWhere('etablissement', 'like', "%{$search}%")
                  ->orWhere('adresse', 'like', "%{$search}%");
            });
        }

        return response()->json($query->paginate(50));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'numero_logement' => 'required|string|max:50|unique:registre_logements,numero_logement',
            'etablissement' => 'required|string|max:150',
            'direction_provinciale' => 'required|string|max:150',
            'type_logement' => 'required|in:fonction,administratif',
            'categorie' => 'required|string|max:100',
            'adresse' => 'nullable|string',
            'nombre_pieces' => 'sometimes|integer|min:0',
            'capacite_personnes' => 'sometimes|integer|min:0',
            'statut' => 'sometimes|in:vacant,occupe,en_maintenance,reserve,desaffecte',
            'occupant_ppr' => 'nullable|string|max:20',
            'date_attribution' => 'nullable|date',
            'date_liberation' => 'nullable|date',
            'motif_vacance' => 'nullable|string|max:150',
            'etat_batiment' => 'sometimes|in:bon,moyen,mauvais,ruine',
            'observations' => 'nullable|string',
        ]);

        $logement = RegistreLogement::create($validated);
        $logement->load('occupant');

        return response()->json($logement, 201);
    }

    public function show($id): JsonResponse
    {
        $logement = RegistreLogement::with('occupant')->findOrFail($id);
        return response()->json($logement);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $logement = RegistreLogement::findOrFail($id);

        $validated = $request->validate([
            'numero_logement' => 'sometimes|string|max:50|unique:registre_logements,numero_logement,' . $id,
            'etablissement' => 'sometimes|string|max:150',
            'direction_provinciale' => 'sometimes|string|max:150',
            'type_logement' => 'sometimes|in:fonction,administratif',
            'categorie' => 'sometimes|string|max:100',
            'adresse' => 'nullable|string',
            'nombre_pieces' => 'sometimes|integer|min:0',
            'capacite_personnes' => 'sometimes|integer|min:0',
            'statut' => 'sometimes|in:vacant,occupe,en_maintenance,reserve,desaffecte',
            'occupant_ppr' => 'nullable|string|max:20',
            'date_attribution' => 'nullable|date',
            'date_liberation' => 'nullable|date',
            'motif_vacance' => 'nullable|string|max:150',
            'etat_batiment' => 'sometimes|in:bon,moyen,mauvais,ruine',
            'observations' => 'nullable|string',
        ]);

        $logement->update($validated);
        $logement->load('occupant');

        return response()->json($logement);
    }

    public function destroy($id): JsonResponse
    {
        $logement = RegistreLogement::findOrFail($id);
        $logement->delete();
        return response()->json(['message' => 'تم حذف السكن من السجل بنجاح']);
    }
}
