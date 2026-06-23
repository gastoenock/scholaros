<?php

namespace App\Http\Controllers;

use App\Facades\Settings;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function index(): Response
    {
        $this->assertCanManageSchoolSettings();

        return Inertia::render('dashboard/settings/page', Settings::uiPayload());
    }

    public function update(Request $request): RedirectResponse
    {
        $this->assertCanManageSchoolSettings();

        $validated = $request->validate([
            'settings' => ['required', 'array'],
            'settings.*' => ['nullable'],
        ]);

        $allowedKeys = array_keys(Settings::definitions());

        foreach ($validated['settings'] as $key => $value) {
            if (! in_array($key, $allowedKeys, true)) {
                continue;
            }

            Settings::set($key, $value);
        }

        return back()->with('success', 'School settings saved');
    }

    protected function assertCanManageSchoolSettings(): void
    {
        $this->requireTenancy();

        $user = auth()->user();
        abort_unless(
            $user && ($user->isPlatformAdmin() || $user->isSchoolAdmin()),
            403,
            'Only school administrators can manage settings.',
        );
    }
}
