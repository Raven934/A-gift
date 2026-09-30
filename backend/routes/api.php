<?php

use App\Http\Controllers\SanctuaryController;
use Illuminate\Support\Facades\Route;

Route::post('/unlock', [SanctuaryController::class, 'unlock']);
Route::get('/sanctuary', [SanctuaryController::class, 'index']);
Route::post('/sanctuary/ping', [SanctuaryController::class, 'ping']);
Route::post('/sanctuary/posts', [SanctuaryController::class, 'storePost']);
Route::post('/sanctuary/posts/{entry}/like', [SanctuaryController::class, 'like']);
Route::post('/sanctuary/envelopes', [SanctuaryController::class, 'storeEnvelope']);
