<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Envelope extends Model
{
    protected $fillable = ['title', 'category', 'content'];
}
