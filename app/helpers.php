<?php

use App\Services\SettingsService;

if (! function_exists('settings')) {
    /**
     * Retrieve the settings service or a single setting value.
     */
    function settings(?string $key = null, mixed $default = null): mixed
    {
        /** @var SettingsService $service */
        $service = app(SettingsService::class);

        if ($key === null) {
            return $service;
        }

        return $service->get($key, $default);
    }
}
