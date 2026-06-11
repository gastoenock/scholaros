<?php

use App\Http\Controllers\MeetingController;
use Illuminate\Support\Facades\Route;

Route::get('/meetings', [MeetingController::class, 'index'])->name('meetings.index');
Route::post('/meetings', [MeetingController::class, 'store'])->name('meetings.store');
Route::put('/meetings/{meeting}/status', [MeetingController::class, 'updateStatus'])->name('meetings.status');
Route::delete('/meetings/{meeting}', [MeetingController::class, 'destroy'])->name('meetings.destroy');
