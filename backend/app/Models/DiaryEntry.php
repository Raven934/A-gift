<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DiaryEntry extends Model
{
    protected $fillable = [
        'title',
        'tag',
        'date',
        'content',
        'image_url',
        'spotify_playlist_url',
        'likes',
        'is_favorite',
    ];
}
