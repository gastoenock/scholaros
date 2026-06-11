<?php

use App\Http\Controllers\AnalyticsController;
use Illuminate\Support\Facades\Route;

Route::get('/analytics', [AnalyticsController::class, 'index'])->name('analytics.index');
