<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lodging extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    public function directionProvinciale(): BelongsTo
    {
        return $this->belongsTo(DirectionProvinciale::class);
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(Assignment::class);
    }

    public function currentAssignment()
    {
        return $this->hasOne(Assignment::class)->where('status', 'approved')->latest();
    }
}
