<?php

namespace App\Http\Controllers;

use App\Models\PlatformUser;
use App\Models\School;
use App\Models\SchoolApplication;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AdminController extends Controller
{
    public function index(): Response
    {
        abort_unless(auth()->user()?->isPlatformAdmin(), 403);

        $applications = SchoolApplication::orderByDesc('created_at')->get();
        $users = PlatformUser::orderByDesc('created_at')->get(['id', 'name', 'email', 'role', 'is_active', 'created_at']);

        return Inertia::render('dashboard/admin/page', [
            'applications' => $applications,
            'users' => $users,
        ]);
    }

    public function approveApplication(SchoolApplication $application): RedirectResponse
    {
        abort_unless(auth()->user()?->isPlatformAdmin(), 403);

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
        ]);

        $adminId = null;

        $school->run(function () use ($application, $school, &$adminId) {
            $schoolId = (int) tenant('id');

            $adminUser = User::firstOrNew(['email' => $application->admin_email]);
            if (! $adminUser->exists) {
                $adminUser->password = 'password';
            }
            $adminUser->fill([
                'name' => $application->admin_name,
                'role' => 'admin',
                'school_id' => $schoolId,
                'is_active' => true,
            ]);
            $adminUser->save();

            $adminId = $adminUser->id;
        });

        $school->update(['admin_id' => $adminId]);
        $application->update(['status' => 'approved']);

        return back()->with('success', "{$application->school_name} has been approved!");
    }

    public function rejectApplication(SchoolApplication $application): RedirectResponse
    {
        abort_unless(auth()->user()?->isPlatformAdmin(), 403);

        if ($application->status !== 'pending') {
            return back()->with('error', 'Application is not pending.');
        }

        $application->update(['status' => 'rejected']);

        return back()->with('success', 'Application rejected.');
    }

    public function updateUserRole(Request $request, PlatformUser $platformUser): RedirectResponse
    {
        abort_unless(auth()->user()?->isPlatformAdmin(), 403);

        $validated = $request->validate([
            'role' => ['required', 'in:superadmin,landlord'],
        ]);

        $platformUser->update([
            'role' => $validated['role'],
        ]);

        return back()->with('success', 'Platform user role updated.');
    }
}
