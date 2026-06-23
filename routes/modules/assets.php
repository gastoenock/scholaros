<?php

use App\Http\Controllers\AssetController;
use App\Http\Controllers\VendorController;
use Illuminate\Support\Facades\Route;

Route::get('/assets', [AssetController::class, 'index'])->name('assets.index');
Route::get('/assets/{asset}', [AssetController::class, 'show'])->name('assets.show');
Route::post('/assets', [AssetController::class, 'store'])->name('assets.store');
Route::put('/assets/{asset}', [AssetController::class, 'update'])->name('assets.update');
Route::delete('/assets/{asset}', [AssetController::class, 'destroy'])->name('assets.destroy');
Route::post('/assets/{asset}/restore', [AssetController::class, 'restore'])->name('assets.restore');

Route::post('/assets/vendors', [VendorController::class, 'store'])->name('assets.vendors.store');
Route::delete('/assets/vendors/{vendor}', [VendorController::class, 'destroy'])->name('assets.vendors.destroy');
