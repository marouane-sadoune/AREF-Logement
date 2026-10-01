<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DemandeLogement;
use App\Models\DocumentFourni;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DocumentController extends Controller
{
    /**
     * The 6 mandatory supporting documents (Note 40), keyed by the column
     * prefix used in `documents_fournis` (both the boolean flag and the
     * `{key}_path` file path share this prefix).
     */
    private const SUPPORTING_DOC_KEYS = [
        'demande_manuscrite',
        'copie_cin',
        'attestation_travail',
        'situation_familiale',
        'engagement_honneur',
        'pv_installation',
    ];

    /**
     * Upload one of the 6 supporting documents for a dossier, so the DP
     * agent can inspect it later (step 4 "Dossier de Demande").
     */
    public function uploadSupportingDocument(Request $request, $dossierId, string $docKey): JsonResponse
    {
        abort_unless(in_array($docKey, self::SUPPORTING_DOC_KEYS, true), 404);

        $request->validate([
            'file' => 'required|file|mimes:pdf,jpg,jpeg,png|max:10240',
        ]);

        $dossier = DemandeLogement::findOrFail($dossierId);
        $document = DocumentFourni::firstOrCreate(['numero_dossier' => $dossier->numero_dossier]);

        $path = $request->file('file')->store("dossiers/{$dossier->numero_dossier}", 'local');

        $document->update([
            "{$docKey}_path" => $path,
            $docKey => true,
        ]);

        return response()->json([
            'message' => 'تم رفع الوثيقة بنجاح',
            'fileName' => basename($path),
        ]);
    }

    /**
     * Stream a previously uploaded supporting document so it can be
     * inspected (viewed/downloaded) by the DP agent.
     */
    public function downloadSupportingDocument($dossierId, string $docKey): StreamedResponse
    {
        abort_unless(in_array($docKey, self::SUPPORTING_DOC_KEYS, true), 404);

        $dossier = DemandeLogement::findOrFail($dossierId);
        $document = DocumentFourni::where('numero_dossier', $dossier->numero_dossier)->firstOrFail();

        $path = $document->{"{$docKey}_path"};
        abort_if(empty($path) || !Storage::disk('local')->exists($path), 404);

        return Storage::disk('local')->download($path);
    }

    /**
     * توليد رسالة الموافقة الرسمية بصيغة PDF (A4)
     */
    public function generateApprovalLetter($dossierId): Response
    {
        $dossier = DemandeLogement::with('candidat')->findOrFail($dossierId);

        $pdf = Pdf::loadView('pdf.lettre_accord_attribution', compact('dossier'))
            ->setPaper('a4', 'portrait')
            ->setOption([
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled' => true,
                'defaultFont' => 'amiri'
            ]);

        $filename = 'Accord_Attribution_' . $dossier->candidat->ppr . '.pdf';

        return $pdf->stream($filename);
    }

    /**
     * توليد محضر تسليم السكن والمعاينة (PV de possession)
     */
    public function generatePvPossession($dossierId): Response
    {
        $dossier = DemandeLogement::with('candidat')->findOrFail($dossierId);

        $pdf = Pdf::loadView('pdf.pv_possession', compact('dossier'))
            ->setPaper('a4', 'portrait');

        return $pdf->stream('PV_Prise_Possession_' . $dossier->candidat->ppr . '.pdf');
    }
}
