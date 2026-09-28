<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Response;

class DocumentController extends Controller
{
    /**
     * توليد رسالة الموافقة الرسمية بصيغة PDF (A4)
     */
    public function generateApprovalLetter($assignmentId): Response
    {
        $assignment = Assignment::with([
            'employee.directionProvinciale',
            'lodging.directionProvinciale'
        ])->findOrFail($assignmentId);

        $pdf = Pdf::loadView('pdf.lettre_accord_attribution', compact('assignment'))
            ->setPaper('a4', 'portrait')
            ->setOption([
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled' => true,
                'defaultFont' => 'amiri'
            ]);

        $filename = 'Accord_Attribution_' . $assignment->employee->ppr . '.pdf';

        return $pdf->stream($filename);
    }

    /**
     * توليد محضر تسليم السكن والمعاينة (PV de possession)
     */
    public function generatePvPossession($assignmentId): Response
    {
        $assignment = Assignment::with([
            'employee.directionProvinciale',
            'lodging'
        ])->findOrFail($assignmentId);

        $pdf = Pdf::loadView('pdf.pv_possession', compact('assignment'))
            ->setPaper('a4', 'portrait');

        return $pdf->stream('PV_Prise_Possession_' . $assignment->employee->ppr . '.pdf');
    }
}
