<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CampusController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('dashboard/campus/page', [
            'school' => $this->school(),
        ]);
    }

    /**
     * Update the current user's school details and/or branches.
     */
    public function update(Request $request): RedirectResponse
    {
        $school = $this->school();
        abort_unless($school, 403);

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'state' => ['nullable', 'string', 'max:255'],
            'zip' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'string', 'max:255'],
            'website' => ['nullable', 'string', 'max:255'],
            'logo' => ['nullable', 'string'],
            'branches' => ['sometimes', 'array'],
            'branches.*.id' => ['required', 'string'],
            'branches.*.name' => ['required', 'string'],
            'branches.*.address' => ['nullable', 'string'],
            'branches.*.phone' => ['nullable', 'string'],
            'branches.*.principalName' => ['nullable', 'string'],
        ]);

        $school->update($this->snakeKeys($validated));

        return back()->with('success', 'School updated!');
    }
}
