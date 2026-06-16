<?php

use App\Http\Controllers\LandlordController;
use Illuminate\Support\Facades\Route;

Route::post('/landlord/tenants/{school}/enter', [LandlordController::class, 'enter'])->name('landlord.tenants.enter');
Route::post('/landlord/tenants/leave', [LandlordController::class, 'leave'])->name('landlord.tenants.leave');
