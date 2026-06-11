<?php

use App\Http\Controllers\TimetableController;
use Illuminate\Support\Facades\Route;

Route::get('/timetable', [TimetableController::class, 'index'])->name('timetable.index');
Route::post('/timetable', [TimetableController::class, 'store'])->name('timetable.store');
Route::put('/timetable/{slot}', [TimetableController::class, 'update'])->name('timetable.update');
Route::delete('/timetable/{slot}', [TimetableController::class, 'destroy'])->name('timetable.destroy');
