<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Employee extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'birth_date' => 'date',
        'recruitment_date' => 'date',
        'spouse_is_civil_servant' => 'boolean',
        'children_count' => 'integer',
    ];

    public function directionProvinciale(): BelongsTo
    {
        return $this->belongsTo(DirectionProvinciale::class);
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(Assignment::class);
    }

    public function activeAssignment()
    {
        return $this->hasOne(Assignment::class)->where('status', 'approved')->latest();
    }
}
