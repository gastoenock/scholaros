<?php

use App\Http\Controllers\MessageController;
use Illuminate\Support\Facades\Route;

Route::get('/messages', [MessageController::class, 'index'])->name('messages.index');
Route::post('/messages', [MessageController::class, 'store'])->name('messages.store');
Route::patch('/messages/{message}/read', [MessageController::class, 'markRead'])->name('messages.read');
Route::delete('/messages/{message}', [MessageController::class, 'destroy'])->name('messages.destroy');
