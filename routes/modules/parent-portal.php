<?php

use App\Http\Controllers\ParentPortalController;
use Illuminate\Support\Facades\Route;

Route::get('/parent-portal', [ParentPortalController::class, 'index'])->name('parent-portal.index');
Route::get('/parent-portal/student/{student}', [ParentPortalController::class, 'studentSummary'])->name('parent-portal.student');
