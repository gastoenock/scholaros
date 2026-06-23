<?php

namespace App\Http\Controllers;

use App\Facades\Settings;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PlatformSettingsController extends Controller
{
    public function index(): Response
    {
        abort_unless(auth()->user()?->isPlatformAdmin(), 403);
        abort_if(tenancy()->initialized, 403, 'Platform settings are only available on the central domain.');

        return Inertia::render('dashboard/admin/settings/page', Settings::uiPayload());
    }

    public function update(Request $request): RedirectResponse
    {
        abort_unless(auth()->user()?->isPlatformAdmin(), 403);
        abort_if(tenancy()->initialized, 403);

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

        return back()->with('success', 'Platform settings saved');
    }
}
