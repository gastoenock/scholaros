<?php

namespace App\Http\Controllers;

use App\Models\School;
use App\Models\SchoolApplication;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AdminController extends Controller
{
    public function index(): Response
    {
        abort_unless(auth()->user()?->isSuperadmin(), 403);

        $applications = SchoolApplication::orderByDesc('created_at')->get();
        $users = User::orderByDesc('created_at')->get(['id', 'name', 'email', 'role', 'school_id', 'is_active', 'created_at']);

        return Inertia::render('dashboard/admin/page', [
            'applications' => $applications,
            'users' => $users,
        ]);
    }

    public function approveApplication(SchoolApplication $application): RedirectResponse
    {
        abort_unless(auth()->user()?->isSuperadmin(), 403);

        if ($application->status !== 'pending') {
            return back()->with('error', 'Application is not pending.');
        }

        $slug = Str::slug($application->school_name);
        $baseSlug = $slug;
        $counter = 1;
        while (School::where('slug', $slug)->exists()) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        $adminUser = User::firstOrNew(['email' => $application->admin_email]);
        $adminUser->fill([
            'name' => $application->admin_name,
            'password' => 'password',
            'role' => 'admin',
            'is_active' => true,
        ]);
        $adminUser->save();

        $school = School::create([
            'name' => $application->school_name,
            'slug' => $slug,
            'email' => $application->admin_email,
            'phone' => $application->admin_phone,
            'address' => $application->address,
            'city' => $application->city,
            'state' => $application->state,
            'zip' => $application->zip,
            'is_active' => true,
            'plan' => 'trial',
            'admin_id' => $adminUser->id,
        ]);

        $adminUser->update(['school_id' => $school->id]);

        $application->update(['status' => 'approved']);

        return back()->with('success', "{$application->school_name} has been approved!");
    }

    public function rejectApplication(SchoolApplication $application): RedirectResponse
    {
        abort_unless(auth()->user()?->isSuperadmin(), 403);

        if ($application->status !== 'pending') {
            return back()->with('error', 'Application is not pending.');
        }

        $application->update(['status' => 'rejected']);

        return back()->with('success', 'Application rejected.');
    }

    public function updateUserRole(Request $request, User $user): RedirectResponse
    {
        abort_unless(auth()->user()?->isSuperadmin(), 403);

        $validated = $request->validate([
            'role' => ['required', 'in:superadmin,admin,teacher,student,parent'],
            'schoolId' => ['nullable', 'integer', 'exists:schools,id'],
        ]);

        $user->update([
            'role' => $validated['role'],
            'school_id' => $validated['schoolId'] ?? null,
        ]);

        return back()->with('success', 'User role updated.');
    }
}
