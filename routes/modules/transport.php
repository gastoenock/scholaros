<?php

use App\Http\Controllers\TransportController;
use Illuminate\Support\Facades\Route;

Route::get('/transport', [TransportController::class, 'index'])->name('transport.index');

Route::post('/transport/routes', [TransportController::class, 'storeRoute'])->name('transport.routes.store');
Route::delete('/transport/routes/{busRoute}', [TransportController::class, 'destroyRoute'])->name('transport.routes.destroy');

Route::post('/transport/buses', [TransportController::class, 'storeBus'])->name('transport.buses.store');
Route::put('/transport/buses/{bus}', [TransportController::class, 'updateBus'])->name('transport.buses.update');
Route::delete('/transport/buses/{bus}', [TransportController::class, 'destroyBus'])->name('transport.buses.destroy');

Route::post('/transport/assignments', [TransportController::class, 'storeAssignment'])->name('transport.assignments.store');
Route::post('/transport/assignments/bulk', [TransportController::class, 'bulkStoreAssignments'])->name('transport.assignments.bulk');
Route::put('/transport/assignments/{transportAssignment}', [TransportController::class, 'updateAssignment'])->name('transport.assignments.update');
Route::delete('/transport/assignments/{transportAssignment}', [TransportController::class, 'destroyAssignment'])->name('transport.assignments.destroy');
