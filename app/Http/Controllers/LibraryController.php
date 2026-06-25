<?php

namespace App\Http\Controllers;

use App\Models\LibraryBook;
use App\Models\LibraryIssuance;
use App\Models\Staff;
use App\Models\Student;
use App\Support\RoleAccess;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LibraryController extends Controller
{
    public function index(): Response
    {
        $schoolId = $this->schoolId();

        $books = $schoolId
            ? LibraryBook::forSchool($schoolId)->orderBy('title')->get()
            : collect();
        $issuances = $schoolId
            ? LibraryIssuance::forSchool($schoolId)->orderByDesc('id')->get()
            : collect();
        $students = $schoolId
            ? Student::forSchool($schoolId)->orderBy('last_name')->get(['id', 'first_name', 'last_name', 'student_id'])
            : collect();
        $staff = $schoolId
            ? Staff::forSchool($schoolId)->orderBy('last_name')->get(['id', 'first_name', 'last_name', 'staff_id'])
            : collect();

        return Inertia::render('dashboard/library/page', [
            'books' => $books,
            'issuances' => $issuances,
            'students' => $students,
            'staff' => $staff,
            'canManage' => RoleAccess::can(auth()->user(), 'library.manage'),
        ]);
    }

    // ─── Books ───────────────────────────────────────────────────

    public function storeBook(Request $request): RedirectResponse
    {
        abort_unless(RoleAccess::can(auth()->user(), 'library.manage'), 403);
        $schoolId = $this->schoolId();
        abort_unless($schoolId, 403);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'author' => ['required', 'string', 'max:255'],
            'isbn' => ['nullable', 'string'],
            'category' => ['nullable', 'string'],
            'publisher' => ['nullable', 'string'],
            'publishYear' => ['nullable', 'string'],
            'totalCopies' => ['required', 'integer', 'min:1'],
            'shelfLocation' => ['nullable', 'string'],
            'coverUrl' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
        ]);

        LibraryBook::create([
            ...$this->snakeKeys($validated),
            'school_id' => $schoolId,
            'available_copies' => $validated['totalCopies'],
        ]);

        return back()->with('success', 'Book added to catalog');
    }

    public function destroyBook(LibraryBook $book): RedirectResponse
    {
        abort_unless(RoleAccess::can(auth()->user(), 'library.manage'), 403);
        abort_unless($book->school_id === $this->schoolId(), 403);

        $book->delete();

        return back()->with('success', 'Book removed');
    }

    // ─── Issuances ───────────────────────────────────────────────

    public function issue(Request $request): RedirectResponse
    {
        abort_unless(RoleAccess::can(auth()->user(), 'library.manage'), 403);
        $schoolId = $this->schoolId();
        abort_unless($schoolId, 403);

        $validated = $request->validate([
            'bookId' => ['required', 'integer'],
            'borrowerId' => ['required', 'string'],
            'borrowerType' => ['required', 'in:student,staff'],
            'borrowerName' => ['required', 'string'],
            'dueDate' => ['required', 'string'],
        ]);

        $book = LibraryBook::forSchool($schoolId)->findOrFail($validated['bookId']);

        if ($book->available_copies < 1) {
            return back()->withErrors(['bookId' => 'No copies available']);
        }

        $book->decrement('available_copies');

        LibraryIssuance::create([
            'school_id' => $schoolId,
            'book_id' => $book->id,
            'borrower_id' => $validated['borrowerId'],
            'borrower_type' => $validated['borrowerType'],
            'borrower_name' => $validated['borrowerName'],
            'issued_at' => now()->toISOString(),
            'due_date' => $validated['dueDate'],
            'status' => 'issued',
        ]);

        return back()->with('success', 'Book issued successfully');
    }

    public function returnBook(LibraryIssuance $issuance): RedirectResponse
    {
        abort_unless(RoleAccess::can(auth()->user(), 'library.manage'), 403);
        abort_unless($issuance->school_id === $this->schoolId(), 403);

        if ($issuance->status !== 'returned') {
            $issuance->update([
                'status' => 'returned',
                'returned_at' => now()->toISOString(),
            ]);

            LibraryBook::whereKey($issuance->book_id)->increment('available_copies');
        }

        return back()->with('success', 'Book returned');
    }
}
