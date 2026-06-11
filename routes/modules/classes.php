<?php

use App\Http\Controllers\ClassController;
use Illuminate\Support\Facades\Route;

Route::get('/classes', [ClassController::class, 'index'])->name('classes.index');
Route::post('/classes', [ClassController::class, 'store'])->name('classes.store');
Route::put('/classes/{class}', [ClassController::class, 'update'])->name('classes.update');
Route::delete('/classes/{class}', [ClassController::class, 'destroy'])->name('classes.destroy');
