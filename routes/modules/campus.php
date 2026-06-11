<?php

use App\Http\Controllers\CampusController;
use Illuminate\Support\Facades\Route;

Route::get('/campus', [CampusController::class, 'index'])->name('campus.index');
Route::put('/campus/school', [CampusController::class, 'update'])->name('campus.update');
