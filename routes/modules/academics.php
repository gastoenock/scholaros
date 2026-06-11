<?php

use App\Http\Controllers\AcademicsController;
use Illuminate\Support\Facades\Route;

Route::get('/academics', [AcademicsController::class, 'index'])->name('academics.index');

Route::post('/academics/subjects', [AcademicsController::class, 'storeSubject'])->name('academics.subjects.store');
Route::put('/academics/subjects/{subject}', [AcademicsController::class, 'updateSubject'])->name('academics.subjects.update');
Route::delete('/academics/subjects/{subject}', [AcademicsController::class, 'destroySubject'])->name('academics.subjects.destroy');

Route::post('/academics/assignments', [AcademicsController::class, 'storeAssignment'])->name('academics.assignments.store');
Route::put('/academics/assignments/{assignment}', [AcademicsController::class, 'updateAssignment'])->name('academics.assignments.update');
Route::delete('/academics/assignments/{assignment}', [AcademicsController::class, 'destroyAssignment'])->name('academics.assignments.destroy');
Route::put('/academics/submissions/{submission}', [AcademicsController::class, 'gradeSubmission'])->name('academics.submissions.grade');

Route::post('/academics/exams', [AcademicsController::class, 'storeExam'])->name('academics.exams.store');
Route::put('/academics/exams/{exam}', [AcademicsController::class, 'updateExam'])->name('academics.exams.update');
Route::delete('/academics/exams/{exam}', [AcademicsController::class, 'destroyExam'])->name('academics.exams.destroy');
Route::post('/academics/exams/{exam}/results', [AcademicsController::class, 'bulkSaveExamResults'])->name('academics.exams.results');

Route::post('/academics/online-classes', [AcademicsController::class, 'storeOnlineClass'])->name('academics.online-classes.store');
Route::put('/academics/online-classes/{onlineClass}', [AcademicsController::class, 'updateOnlineClass'])->name('academics.online-classes.update');
Route::delete('/academics/online-classes/{onlineClass}', [AcademicsController::class, 'destroyOnlineClass'])->name('academics.online-classes.destroy');
