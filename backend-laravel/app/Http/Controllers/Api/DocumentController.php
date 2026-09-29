<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DemandeLogement;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Response;

class DocumentController extends Controller
{
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
