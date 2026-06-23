<?php

namespace App\Providers;

use App\Models\School;
use App\Support\TenancyUrl;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(\App\Services\SettingsService::class);
    }

    public function boot(): void
    {
        School::created(function (School $school): void {
            TenancyUrl::syncSchoolDomain($school);
        });

        School::updated(function (School $school): void {
            if ($school->wasChanged('slug')) {
                $school->domains()
                    ->where('domain', $school->getOriginal('slug'))
                    ->update(['domain' => $school->slug]);
            }
        });
    }
}
