<?php

use App\Http\Controllers\ClassController;
use Illuminate\Support\Facades\Route;

Route::middleware('role:admin,teacher')->group(function () {
    Route::get('/classes', [ClassController::class, 'index'])->name('classes.index');
    Route::get('/classes/{class:uuid}', [ClassController::class, 'show'])->name('classes.show');
    Route::put('/classes/{class:uuid}', [ClassController::class, 'update'])->name('classes.update');
    Route::post('/classes/{class:uuid}/students', [ClassController::class, 'assignStudents'])->name('classes.students.assign');
    Route::delete('/classes/{class:uuid}/students/{student:uuid}', [ClassController::class, 'removeStudent'])->name('classes.students.remove');
});

Route::middleware('role:admin')->group(function () {
    Route::post('/classes', [ClassController::class, 'store'])->name('classes.store');
    Route::delete('/classes/{class:uuid}', [ClassController::class, 'destroy'])->name('classes.destroy');
});
