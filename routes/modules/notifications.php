<?php

use App\Http\Controllers\NotificationController;
use Illuminate\Support\Facades\Route;

Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead'])->name('notifications.read-all');
Route::post('/notifications/broadcast', [NotificationController::class, 'broadcast'])->name('notifications.broadcast');
Route::post('/notifications/{notification}/read', [NotificationController::class, 'markRead'])->name('notifications.read');
