<?php

use App\Http\Controllers\RoomController;
use Illuminate\Support\Facades\Route;

Route::get('/rooms', [RoomController::class, 'index'])->name('rooms.index');
Route::post('/rooms/classrooms', [RoomController::class, 'storeClassRoom'])->name('rooms.classrooms.store');
Route::put('/rooms/classrooms/{classRoom}', [RoomController::class, 'updateClassRoom'])->name('rooms.classrooms.update');
Route::put('/rooms/classrooms/{classRoom}/assign-class', [RoomController::class, 'assignClass'])->name('rooms.classrooms.assign-class');
Route::delete('/rooms/classrooms/{classRoom}', [RoomController::class, 'destroyClassRoom'])->name('rooms.classrooms.destroy');
