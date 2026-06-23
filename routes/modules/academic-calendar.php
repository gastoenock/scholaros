<?php

use App\Http\Controllers\AcademicCalendarController;
use Illuminate\Support\Facades\Route;

Route::get('/academic-calendar', [AcademicCalendarController::class, 'index'])->name('academic-calendar.index');

Route::post('/academic-calendar/years', [AcademicCalendarController::class, 'storeYear'])->name('academic-calendar.years.store');
Route::put('/academic-calendar/years/{year}', [AcademicCalendarController::class, 'updateYear'])->name('academic-calendar.years.update');
Route::delete('/academic-calendar/years/{year}', [AcademicCalendarController::class, 'destroyYear'])->name('academic-calendar.years.destroy');
Route::post('/academic-calendar/years/{year}/current', [AcademicCalendarController::class, 'setCurrentYear'])->name('academic-calendar.years.current');

Route::post('/academic-calendar/years/{year}/semesters', [AcademicCalendarController::class, 'storeSemester'])->name('academic-calendar.semesters.store');
Route::put('/academic-calendar/semesters/{semester}', [AcademicCalendarController::class, 'updateSemester'])->name('academic-calendar.semesters.update');
Route::delete('/academic-calendar/semesters/{semester}', [AcademicCalendarController::class, 'destroySemester'])->name('academic-calendar.semesters.destroy');
Route::post('/academic-calendar/semesters/{semester}/current', [AcademicCalendarController::class, 'setCurrentSemester'])->name('academic-calendar.semesters.current');

Route::post('/academic-calendar/semesters/{semester}/terms', [AcademicCalendarController::class, 'storeTerm'])->name('academic-calendar.terms.store');
Route::put('/academic-calendar/terms/{term}', [AcademicCalendarController::class, 'updateTerm'])->name('academic-calendar.terms.update');
Route::delete('/academic-calendar/terms/{term}', [AcademicCalendarController::class, 'destroyTerm'])->name('academic-calendar.terms.destroy');
Route::post('/academic-calendar/terms/{term}/current', [AcademicCalendarController::class, 'setCurrentTerm'])->name('academic-calendar.terms.current');

// https://docs.daily.co/reference/rest-api/rooms/create-room
