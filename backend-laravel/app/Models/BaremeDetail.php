<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BaremeDetail extends Model
{
    protected $table = 'baremes_detail';

    protected $guarded = ['id'];

    public $timestamps = false;

    protected $casts = [
        'pts_anciennete_generale' => 'integer',
        'pts_anciennete_etablissement' => 'integer',
        'pts_echelle' => 'integer',
        'pts_situation_familiale' => 'integer',
        'pts_enfants' => 'integer',
        'bonus_responsabilite' => 'integer',
        'total_points' => 'integer',
    ];

    public function demande(): BelongsTo
    {
        return $this->belongsTo(DemandeLogement::class, 'numero_dossier', 'numero_dossier');
    }
}