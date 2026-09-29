<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class DemandeLogement extends Model
{
    protected $table = 'demandes_logement';

    protected $guarded = ['id'];

    public $timestamps = false;

    protected $casts = [
        'date_creation' => 'date',
        'date_transmission_aref' => 'date',
        'date_commission_aref' => 'date',
        'total_bareme' => 'integer',
    ];

    public function candidat(): BelongsTo
    {
        return $this->belongsTo(Candidat::class, 'candidat_ppr', 'ppr');
    }

    public function bareme(): HasOne
    {
        return $this->hasOne(BaremeDetail::class, 'numero_dossier', 'numero_dossier');
    }

    public function documents(): HasOne
    {
        return $this->hasOne(DocumentFourni::class, 'numero_dossier', 'numero_dossier');
    }

    public function historique(): HasMany
    {
        return $this->hasMany(AuditHistorique::class, 'numero_dossier', 'numero_dossier')
            ->orderBy('id');
    }
}