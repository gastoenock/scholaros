<?php

use App\Http\Controllers\AdmissionController;
use Illuminate\Support\Facades\Route;

Route::get('/admissions', [AdmissionController::class, 'index'])->name('admissions.index');
Route::post('/admissions', [AdmissionController::class, 'store'])->name('admissions.store');
Route::post('/admissions/{admission}/status', [AdmissionController::class, 'updateStatus'])->name('admissions.status');
Route::post('/admissions/{admission}/enroll', [AdmissionController::class, 'enroll'])->name('admissions.enroll');
