<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditHistorique extends Model
{
    protected $table = 'audit_historique';

    protected $guarded = ['id'];

    public $timestamps = false;

    public function demande(): BelongsTo
    {
        return $this->belongsTo(DemandeLogement::class, 'numero_dossier', 'numero_dossier');
    }
}