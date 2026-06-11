<?php

namespace App\Http\Controllers;

use App\Models\SchoolApplication;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class SchoolApplicationController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('register/page');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'schoolName' => ['required', 'string', 'max:255'],
            'adminName' => ['required', 'string', 'max:255'],
            'adminEmail' => ['required', 'email', 'max:255'],
            'adminPhone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'zip' => ['nullable', 'string', 'max:20'],
        ]);

        $pending = SchoolApplication::where('admin_email', $validated['adminEmail'])
            ->where('status', 'pending')
            ->exists();

        if ($pending) {
            throw ValidationException::withMessages([
                'adminEmail' => 'An application with this email is already pending.',
            ]);
        }

        SchoolApplication::create([
            ...$this->snakeKeys($validated),
            'status' => 'pending',
        ]);

        return back()->with('success', 'Application submitted.');
    }
}
