<?php

use App\Http\Controllers\StaffController;
use Illuminate\Support\Facades\Route;

Route::get('/staff', [StaffController::class, 'index'])->name('staff.index');
Route::post('/staff', [StaffController::class, 'store'])->name('staff.store');
Route::put('/staff/{staff}', [StaffController::class, 'update'])->name('staff.update');
Route::delete('/staff/{staff}', [StaffController::class, 'destroy'])->name('staff.destroy');
