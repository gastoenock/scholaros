<?php

namespace App\Facades;

use App\Services\SettingsService;
use Illuminate\Support\Facades\Facade;

/**
 * @method static string scope()
 * @method static mixed get(string $key, mixed $default = null)
 * @method static void set(string $key, mixed $value, ?string $group = null)
 * @method static void setMany(array $values)
 * @method static array group(string $group)
 * @method static array all()
 * @method static array definitions()
 * @method static array groups()
 * @method static array uiPayload()
 * @method static array groupLabels()
 * @method static array userPreferenceDefaults()
 * @method static array resolveUserPreferences(?array $stored)
 *
 * @see SettingsService
 */
class Settings extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return SettingsService::class;
    }
}
