<?php

use App\Http\Controllers\DormitoryController;
use Illuminate\Support\Facades\Route;

Route::get('/dormitory', [DormitoryController::class, 'index'])->name('dormitory.index');

Route::post('/dormitory/rooms', [DormitoryController::class, 'storeRoom'])->name('dormitory.rooms.store');
Route::put('/dormitory/rooms/{dormRoom}', [DormitoryController::class, 'updateRoomStatus'])->name('dormitory.rooms.update');
Route::delete('/dormitory/rooms/{dormRoom}', [DormitoryController::class, 'destroyRoom'])->name('dormitory.rooms.destroy');

Route::post('/dormitory/allocations', [DormitoryController::class, 'storeAllocation'])->name('dormitory.allocations.store');
Route::put('/dormitory/allocations/{dormAllocation}/checkout', [DormitoryController::class, 'checkOutAllocation'])->name('dormitory.allocations.checkout');
