<?php

namespace App\Http\Controllers;

use App\Services\SettingsService;
use App\Support\SettingsRegistry;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function __construct(
        protected SettingsService $settings,
    ) {}

    public function show(): Response
    {
        $user = auth()->user();
        abort_unless($user, 403);

        $preferences = $this->settings->resolveUserPreferences($user->preferences ?? null);

        return Inertia::render('dashboard/profile/page', [
            'profile' => [
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'accountType' => $user->isPlatformAdmin() ? 'platform' : 'tenant',
            ],
            'preferences' => $preferences,
            'preferenceFields' => collect(SettingsRegistry::userPreferenceDefinitions())
                ->map(fn (array $definition, string $key) => [
                    'key' => $key,
                    'label' => $definition['label'],
                    'type' => $definition['type'],
                    'options' => $definition['options'] ?? null,
                    'value' => $preferences[$key] ?? $definition['default'] ?? null,
                ])
                ->values()
                ->all(),
        ]);
    }

    public function updateProfile(Request $request): RedirectResponse
    {
        $user = auth()->user();
        abort_unless($user, 403);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:255'],
            'password' => ['nullable', 'confirmed', Password::defaults()],
        ]);

        $user->update([
            'name' => $validated['name'],
            'phone' => $validated['phone'] ?? null,
            ...(! empty($validated['password']) ? ['password' => Hash::make($validated['password'])] : []),
        ]);

        return back()->with('success', 'Profile updated');
    }

    public function updatePreferences(Request $request): RedirectResponse
    {
        $user = auth()->user();
        abort_unless($user, 403);

        $definitions = SettingsRegistry::userPreferenceDefinitions();
        $rules = [];

        foreach ($definitions as $key => $definition) {
            $rules["preferences.{$key}"] = match ($definition['type']) {
                'boolean' => ['nullable', 'boolean'],
                'select' => ['nullable', 'in:'.implode(',', $definition['options'] ?? [])],
                default => ['nullable', 'string', 'max:255'],
            };
        }

        $validated = $request->validate($rules);

        $user->update([
            'preferences' => $this->settings->resolveUserPreferences([
                ...($user->preferences ?? []),
                ...($validated['preferences'] ?? []),
            ]),
        ]);

        return back()->with('success', 'Preferences saved');
    }
}
