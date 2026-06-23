<?php

namespace App\Services;

use App\Models\PlatformSetting;
use App\Models\Setting;
use App\Support\SettingsRegistry;

class SettingsService
{
    /** @var array<string, mixed> */
    protected array $runtimeCache = [];

    public function scope(): string
    {
        return tenancy()->initialized ? 'tenant' : 'platform';
    }

    public function get(string $key, mixed $default = null): mixed
    {
        if (array_key_exists($key, $this->runtimeCache)) {
            return $this->runtimeCache[$key];
        }

        $definitions = $this->definitions();
        $fallback = $default ?? ($definitions[$key]['default'] ?? null);

        if ($key === 'general.academic_year' && $fallback === null) {
            $fallback = SettingsRegistry::defaultAcademicYear($definitions);
        }

        $record = $this->scope() === 'tenant'
            ? $this->tenantQuery()->where('key', $key)->value('value')
            : PlatformSetting::query()->where('key', $key)->value('value');

        $value = $record ?? $fallback;
        $this->runtimeCache[$key] = $value;

        return $value;
    }

    public function set(string $key, mixed $value, ?string $group = null): void
    {
        $definitions = $this->definitions();
        $group ??= $definitions[$key]['group'] ?? 'general';

        if ($this->scope() === 'tenant') {
            $schoolId = (int) tenant('id');

            Setting::updateOrCreate(
                ['school_id' => $schoolId, 'key' => $key],
                ['value' => $value, 'group' => $group],
            );
        } else {
            PlatformSetting::updateOrCreate(
                ['key' => $key],
                ['value' => $value, 'group' => $group],
            );
        }

        $this->runtimeCache[$key] = $value;
    }

    /**
     * @param  array<string, mixed>  $values
     */
    public function setMany(array $values): void
    {
        foreach ($values as $key => $value) {
            $this->set($key, $value);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function group(string $group): array
    {
        $definitions = $this->definitions();
        $result = [];

        foreach ($definitions as $key => $definition) {
            if (($definition['group'] ?? 'general') === $group) {
                $result[$key] = $this->get($key);
            }
        }

        return $result;
    }

    /**
     * @return array<string, mixed>
     */
    public function all(): array
    {
        $definitions = $this->definitions();
        $result = [];

        foreach (array_keys($definitions) as $key) {
            $result[$key] = $this->get($key);
        }

        return $result;
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    public function definitions(): array
    {
        return $this->scope() === 'tenant'
            ? SettingsRegistry::tenantDefinitions()
            : SettingsRegistry::platformDefinitions();
    }

    /**
     * @return list<string>
     */
    public function groups(): array
    {
        return $this->scope() === 'tenant'
            ? SettingsRegistry::tenantGroups()
            : SettingsRegistry::platformGroups();
    }

    /**
     * Payload for settings UI pages.
     *
     * @return array<string, mixed>
     */
    public function uiPayload(): array
    {
        $definitions = $this->definitions();
        $values = $this->all();

        $groups = collect($this->groups())->mapWithKeys(function (string $group) use ($definitions, $values) {
            $fields = [];

            foreach ($definitions as $key => $definition) {
                if (($definition['group'] ?? 'general') !== $group) {
                    continue;
                }

                $fields[] = [
                    'key' => $key,
                    'label' => $definition['label'],
                    'type' => $definition['type'],
                    'description' => $definition['description'] ?? null,
                    'options' => $definition['options'] ?? null,
                    'value' => $values[$key] ?? $definition['default'] ?? null,
                ];
            }

            return [$group => $fields];
        })->all();

        return [
            'groups' => $this->groups(),
            'groupLabels' => $this->groupLabels(),
            'fieldsByGroup' => $groups,
            'values' => $values,
        ];
    }

    /**
     * @return array<string, string>
     */
    public function groupLabels(): array
    {
        return [
            'general' => 'General',
            'registration' => 'Registration',
            'email' => 'Email',
            'academics' => 'Academics',
            'notifications' => 'Notifications',
            'finance' => 'Finance',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function userPreferenceDefaults(): array
    {
        $defaults = [];

        foreach (SettingsRegistry::userPreferenceDefinitions() as $key => $definition) {
            $defaults[$key] = $definition['default'] ?? null;
        }

        return $defaults;
    }

    /**
     * @param  array<string, mixed>|null  $stored
     * @return array<string, mixed>
     */
    public function resolveUserPreferences(?array $stored): array
    {
        return array_merge($this->userPreferenceDefaults(), $stored ?? []);
    }

    protected function tenantQuery()
    {
        return Setting::forSchool((int) tenant('id'));
    }
}
