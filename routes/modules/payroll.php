<?php

use App\Http\Controllers\PayrollController;
use Illuminate\Support\Facades\Route;

Route::get('/payroll', [PayrollController::class, 'index'])->name('payroll.index');

Route::post('/payroll/generate', [PayrollController::class, 'generate'])->name('payroll.generate');
Route::put('/payroll/records/{payrollRecord}/status', [PayrollController::class, 'updateStatus'])->name('payroll.records.status');

Route::post('/payroll/leaves', [PayrollController::class, 'storeLeave'])->name('payroll.leaves.store');
Route::post('/payroll/leaves/{leaveRequest}/status', [PayrollController::class, 'updateLeaveStatus'])->name('payroll.leaves.status');
