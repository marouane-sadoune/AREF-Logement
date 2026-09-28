<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DirectionProvinciale extends Model
{
    use HasFactory;

    protected $table = 'directions_provinciales';
    protected $guarded = ['id'];

    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class);
    }

    public function lodgings(): HasMany
    {
        return $this->hasMany(Lodging::class);
    }
}
