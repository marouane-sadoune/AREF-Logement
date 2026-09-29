<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DirectionProvinciale extends Model
{
    use HasFactory;

    protected $table = 'directions_provinciales';
    protected $guarded = ['id'];
    public $timestamps = false;
}
