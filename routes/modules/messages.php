<?php

use App\Http\Controllers\CallController;
use App\Http\Controllers\MessageController;
use Illuminate\Support\Facades\Route;

Route::get('/messages', [MessageController::class, 'index'])->name('messages.index');
Route::post('/messages', [MessageController::class, 'store'])->name('messages.store');
Route::post('/messages/read-thread', [MessageController::class, 'markThreadRead'])->name('messages.read-thread');
Route::delete('/messages/{message}', [MessageController::class, 'destroy'])->name('messages.destroy');

Route::post('/calls', [CallController::class, 'store'])->name('calls.store');
Route::post('/calls/{callSession}/join', [CallController::class, 'join'])->name('calls.join');
Route::post('/calls/{callSession}/end', [CallController::class, 'end'])->name('calls.end');
