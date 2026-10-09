<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RegistreLogement extends Model
{
    protected $table = 'registre_logements';

    protected $guarded = ['id'];

    protected $casts = [
        'nombre_pieces' => 'integer',
        'capacite_personnes' => 'integer',
        'date_attribution' => 'date',
        'date_liberation' => 'date',
    ];

    public function occupant(): BelongsTo
    {
        return $this->belongsTo(Candidat::class, 'occupant_ppr', 'ppr');
    }

    public function demandes(): HasMany
    {
        return $this->hasMany(DemandeLogement::class, 'registre_logement_id');
    }
}
