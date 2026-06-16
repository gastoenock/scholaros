<?php

namespace App\Http\Controllers;

use App\Models\PlatformUser;
use App\Models\School;
use App\Models\User;
use App\Support\TenancyUrl;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AuthController extends Controller
{
    public function showSchoolPortal(): Response
    {
        return Inertia::render('auth/school-portal', [
            'schools' => School::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'slug'])
                ->map(fn (School $school) => [
                    'id' => $school->id,
                    'name' => $school->name,
                    'slug' => $school->slug,
                    'loginUrl' => TenancyUrl::tenantUrl($school->slug, '/login'),
                ]),
            'platformLoginUrl' => route('login.platform'),
            'centralDomain' => TenancyUrl::centralDomain(),
        ]);
    }

    public function showPlatformLogin(): Response
    {
        return Inertia::render('auth/platform-login', [
            'schoolPortalUrl' => TenancyUrl::centralUrl('/login'),
            'centralDomain' => TenancyUrl::centralDomain(),
        ]);
    }

    public function showTenantLogin(): Response
    {
        $school = tenant();

        return Inertia::render('auth/login', [
            'school' => $school ? [
                'name' => $school->name,
                'slug' => $school->slug,
            ] : null,
            'platformLoginUrl' => TenancyUrl::centralUrl('/login/platform'),
            'centralDomain' => TenancyUrl::centralDomain(),
        ]);
    }

    public function showTenantSignup(): Response
    {
        $school = tenant();

        return Inertia::render('auth/signup', [
            'school' => $school ? [
                'name' => $school->name,
                'slug' => $school->slug,
            ] : null,
            'loginUrl' => TenancyUrl::tenantRoute('tenant.login'),
        ]);
    }

    public function tenantLogin(Request $request): RedirectResponse
    {
        abort_unless(tenancy()->initialized, 404);

        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'remember' => ['sometimes', 'boolean'],
        ]);

        if (! Auth::guard('web')->attempt(
            ['email' => $validated['email'], 'password' => $validated['password']],
            $request->boolean('remember'),
        )) {
            throw ValidationException::withMessages([
                'email' => 'These credentials do not match our records.',
            ]);
        }

        Auth::guard('platform')->logout();
        Auth::shouldUse('web');

        $request->session()->regenerate();
        $request->session()->forget('manage_tenant_id');

        return redirect()->intended(TenancyUrl::tenantRoute('tenant.dashboard.index'));
    }

    public function platformLogin(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'remember' => ['sometimes', 'boolean'],
        ]);

        if (! Auth::guard('platform')->attempt(
            ['email' => $validated['email'], 'password' => $validated['password']],
            $request->boolean('remember'),
        )) {
            throw ValidationException::withMessages([
                'email' => 'These credentials do not match our records.',
            ]);
        }

        Auth::guard('web')->logout();
        Auth::shouldUse('platform');

        if (tenancy()->initialized) {
            tenancy()->end();
        }

        $request->session()->regenerate();
        $request->session()->forget('manage_tenant_id');

        return redirect()->intended(route('dashboard.index'));
    }

    public function tenantSignup(Request $request): RedirectResponse
    {
        abort_unless(tenancy()->initialized, 404);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique(User::class, 'email')],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'parent',
            'school_id' => (int) tenant('id'),
            'is_active' => true,
        ]);

        Auth::guard('platform')->logout();
        Auth::guard('web')->login($user);
        Auth::shouldUse('web');

        $request->session()->regenerate();
        $request->session()->forget('manage_tenant_id');

        return redirect()->to(TenancyUrl::tenantRoute('tenant.dashboard.index'));
    }

    public function tenantLogout(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->to(TenancyUrl::tenantRoute('tenant.login'));
    }

    public function platformLogout(Request $request): RedirectResponse
    {
        Auth::guard('platform')->logout();

        $request->session()->forget('manage_tenant_id');
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('home');
    }
}
