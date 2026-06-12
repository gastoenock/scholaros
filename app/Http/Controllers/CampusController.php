<?php

namespace App\Http\Controllers;

use App\Models\SchoolBranch;
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
        ]);

        $school->update($this->snakeKeys($validated));

        return back()->with('success', 'School updated!');
    }

    public function storeBranch(Request $request): RedirectResponse
    {
        $school = $this->school();
        abort_unless($school, 403);

        $validated = $request->validate([
            'code' => ['nullable', 'string', 'max:50'],
            'name' => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:255'],
            'principalName' => ['nullable', 'string', 'max:255'],
        ]);

        $school->branches()->create($this->snakeKeys($validated));

        return back()->with('success', 'Branch added!');
    }

    public function updateBranch(Request $request, SchoolBranch $branch): RedirectResponse
    {
        abort_unless($branch->school_id === $this->schoolId(), 403);

        $validated = $request->validate([
            'code' => ['nullable', 'string', 'max:50'],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:255'],
            'principalName' => ['nullable', 'string', 'max:255'],
            'isActive' => ['sometimes', 'boolean'],
        ]);

        $branch->update($this->snakeKeys($validated));

        return back()->with('success', 'Branch updated!');
    }

    public function destroyBranch(SchoolBranch $branch): RedirectResponse
    {
        abort_unless($branch->school_id === $this->schoolId(), 403);

        $branch->delete();

        return back()->with('success', 'Branch removed');
    }
}
