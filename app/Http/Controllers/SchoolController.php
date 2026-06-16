<?php

namespace App\Http\Controllers;

use App\Models\School;
use App\Support\TenancyUrl;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SchoolController extends Controller
{
    public function index(): Response
    {
        abort_unless(auth()->user()?->isPlatformAdmin(), 403);

        $schools = School::orderByDesc('created_at')->get();

        return Inertia::render('dashboard/schools/page', [
            'schools' => $schools->map(fn (School $school) => [
                ...$school->toArray(),
                'tenantUrl' => TenancyUrl::tenantUrlForSchool($school, '/dashboard'),
                'loginUrl' => TenancyUrl::tenantUrlForSchool($school, '/login'),
            ]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless(auth()->user()?->isPlatformAdmin(), 403);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'regex:/^[a-z0-9-]+$/', Rule::unique(School::class, 'slug')],
            'address' => ['nullable', 'string'],
            'city' => ['nullable', 'string'],
            'state' => ['nullable', 'string'],
            'zip' => ['nullable', 'string'],
            'phone' => ['nullable', 'string'],
            'email' => ['nullable', 'email'],
            'website' => ['nullable', 'string'],
        ]);

        School::create([
            ...$this->snakeKeys($validated),
            'is_active' => true,
            'plan' => 'trial',
        ]);

        return back()->with('success', 'School created successfully!');
    }

    public function update(Request $request, School $school): RedirectResponse
    {
        abort_unless(auth()->user()?->isPlatformAdmin(), 403);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'address' => ['nullable', 'string'],
            'city' => ['nullable', 'string'],
            'state' => ['nullable', 'string'],
            'zip' => ['nullable', 'string'],
            'phone' => ['nullable', 'string'],
            'email' => ['nullable', 'email'],
            'website' => ['nullable', 'string'],
            'logo' => ['nullable', 'string'],
        ]);

        $school->update($this->snakeKeys($validated));

        return back()->with('success', 'School updated');
    }
}
