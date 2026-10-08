<?php

use App\Http\Controllers\SanctuaryController;
use Illuminate\Support\Facades\Route;

Route::post('/unlock', [SanctuaryController::class, 'unlock']);
Route::get('/sanctuary', [SanctuaryController::class, 'index']);
Route::post('/sanctuary/ping', [SanctuaryController::class, 'ping']);
Route::post('/sanctuary/posts', [SanctuaryController::class, 'storePost']);
Route::put('/sanctuary/posts/{entry}', [SanctuaryController::class, 'updatePost']);
Route::delete('/sanctuary/posts/{entry}', [SanctuaryController::class, 'destroyPost']);
Route::post('/sanctuary/posts/{entry}/like', [SanctuaryController::class, 'like']);
Route::post('/sanctuary/posts/{entry}/favorite', [SanctuaryController::class, 'favoritePost']);
Route::post('/sanctuary/envelopes', [SanctuaryController::class, 'storeEnvelope']);
Route::put('/sanctuary/envelopes/{envelope}', [SanctuaryController::class, 'updateEnvelope']);
Route::delete('/sanctuary/envelopes/{envelope}', [SanctuaryController::class, 'destroyEnvelope']);
Route::post('/sanctuary/envelopes/{envelope}/favorite', [SanctuaryController::class, 'favoriteEnvelope']);
