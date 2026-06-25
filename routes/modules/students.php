<?php

use App\Http\Controllers\StudentController;
use Illuminate\Support\Facades\Route;

Route::middleware('role:admin,teacher')->group(function () {
    Route::get('/students', [StudentController::class, 'index'])->name('students.index');
    Route::get('/students/{student:uuid}', [StudentController::class, 'show'])->name('students.show');
});

Route::middleware('role:admin')->group(function () {
    Route::post('/students', [StudentController::class, 'store'])->name('students.store');
    Route::put('/students/{student:uuid}', [StudentController::class, 'update'])->name('students.update');
    Route::delete('/students/{student:uuid}', [StudentController::class, 'destroy'])->name('students.destroy');
});
