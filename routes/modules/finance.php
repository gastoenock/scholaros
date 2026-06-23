<?php

use App\Http\Controllers\FinanceController;
use Illuminate\Support\Facades\Route;

Route::get('/finance', [FinanceController::class, 'index'])->name('finance.index');
Route::get('/finance/fee-balance-preview', [FinanceController::class, 'feeBalancePreview'])->name('finance.fee-balance-preview');

Route::post('/finance/fee-structures', [FinanceController::class, 'storeFeeStructure'])->name('finance.fee-structures.store');
Route::delete('/finance/fee-structures/{feeStructure}', [FinanceController::class, 'destroyFeeStructure'])->name('finance.fee-structures.destroy');

Route::post('/finance/payments', [FinanceController::class, 'storePayment'])->name('finance.payments.store');
Route::delete('/finance/payments/{feePayment}', [FinanceController::class, 'destroyPayment'])->name('finance.payments.destroy');

Route::post('/finance/expenses', [FinanceController::class, 'storeExpense'])->name('finance.expenses.store');
Route::patch('/finance/expenses/{expense}/status', [FinanceController::class, 'updateExpenseStatus'])->name('finance.expenses.status');
Route::delete('/finance/expenses/{expense}', [FinanceController::class, 'destroyExpense'])->name('finance.expenses.destroy');
