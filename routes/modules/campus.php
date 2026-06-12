<?php

use App\Http\Controllers\CampusController;
use Illuminate\Support\Facades\Route;

Route::get('/campus', [CampusController::class, 'index'])->name('campus.index');
Route::put('/campus/school', [CampusController::class, 'update'])->name('campus.update');
Route::post('/campus/branches', [CampusController::class, 'storeBranch'])->name('campus.branches.store');
Route::put('/campus/branches/{branch}', [CampusController::class, 'updateBranch'])->name('campus.branches.update');
Route::delete('/campus/branches/{branch}', [CampusController::class, 'destroyBranch'])->name('campus.branches.destroy');
