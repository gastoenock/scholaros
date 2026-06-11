<?php

use App\Http\Controllers\AttendanceController;
use Illuminate\Support\Facades\Route;

Route::get('/attendance', [AttendanceController::class, 'index'])->name('attendance.index');
Route::post('/attendance', [AttendanceController::class, 'store'])->name('attendance.store');
