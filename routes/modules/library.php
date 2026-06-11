<?php

use App\Http\Controllers\LibraryController;
use Illuminate\Support\Facades\Route;

Route::get('/library', [LibraryController::class, 'index'])->name('library.index');

Route::post('/library/books', [LibraryController::class, 'storeBook'])->name('library.books.store');
Route::delete('/library/books/{book}', [LibraryController::class, 'destroyBook'])->name('library.books.destroy');

Route::post('/library/issuances', [LibraryController::class, 'issue'])->name('library.issuances.store');
Route::post('/library/issuances/{issuance}/return', [LibraryController::class, 'returnBook'])->name('library.issuances.return');
