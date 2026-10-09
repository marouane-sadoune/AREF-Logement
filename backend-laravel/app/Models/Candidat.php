<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Candidat extends Model
{
    protected $table = 'candidats';

    protected $guarded = ['id'];

    public $timestamps = false;

    protected $casts = [
        'conjoint_fonctionnaire' => 'boolean',
        'milieu_rural' => 'boolean',
        'franchise_rurale' => 'boolean',
    ];

    public function demandesLogement(): HasMany
    {
        return $this->hasMany(DemandeLogement::class, 'candidat_ppr', 'ppr');
    }
}