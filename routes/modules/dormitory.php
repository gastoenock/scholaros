<?php

use App\Http\Controllers\DormitoryController;
use Illuminate\Support\Facades\Route;

Route::get('/dormitory', [DormitoryController::class, 'index'])->name('dormitory.index');

Route::post('/dormitory/rooms', [DormitoryController::class, 'storeRoom'])->name('dormitory.rooms.store');
Route::put('/dormitory/rooms/{dormRoom}', [DormitoryController::class, 'updateRoom'])->name('dormitory.rooms.update');
Route::delete('/dormitory/rooms/{dormRoom}', [DormitoryController::class, 'destroyRoom'])->name('dormitory.rooms.destroy');

Route::post('/dormitory/allocations', [DormitoryController::class, 'storeAllocation'])->name('dormitory.allocations.store');
Route::put('/dormitory/allocations/{dormAllocation}/checkout', [DormitoryController::class, 'checkOutAllocation'])->name('dormitory.allocations.checkout');

Route::post('/dormitory/maintenance', [DormitoryController::class, 'storeMaintenance'])->name('dormitory.maintenance.store');
Route::put('/dormitory/maintenance/{maintenanceRequest}', [DormitoryController::class, 'updateMaintenance'])->name('dormitory.maintenance.update');
Route::delete('/dormitory/maintenance/{maintenanceRequest}', [DormitoryController::class, 'destroyMaintenance'])->name('dormitory.maintenance.destroy');

Route::post('/dormitory/security-logs', [DormitoryController::class, 'storeSecurityLog'])->name('dormitory.security-logs.store');
Route::put('/dormitory/security-logs/{securityLog}/checkout', [DormitoryController::class, 'checkOutSecurityLog'])->name('dormitory.security-logs.checkout');
