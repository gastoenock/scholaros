<?php

use App\Models\School;
use App\Support\TenancyUrl;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use App\Support\TenantDatabaseCleaner;

Artisan::command('tenancy:drop-databases', function () {
    $count = TenantDatabaseCleaner::dropAll();
    $this->info("Dropped {$count} tenant database(s).");
})->purpose('Drop all tenant databases (use before db:seed if seeding fails)');

Artisan::command('tenancy:local-setup', function () {
    $central = TenancyUrl::centralDomain();
    $port = parse_url((string) config('app.url'), PHP_URL_PORT) ?: '8000';

    $this->info('ScholarOS local subdomain setup');
    $this->newLine();

    $this->line('Add these lines to /etc/hosts (requires your Mac password):');
    $this->newLine();

    $lines = ["127.0.0.1 {$central}"];
    foreach (School::query()->orderBy('slug')->pluck('slug') as $slug) {
        $lines[] = "127.0.0.1 {$slug}.{$central}";
    }

    foreach ($lines as $line) {
        $this->line("  {$line}");
    }

    $this->newLine();
    $this->line('Then run:');
    $this->line("  php artisan serve --host=0.0.0.0 --port={$port}");
    $this->newLine();
    $this->line('URLs:');
    $this->line('  Platform: http://'.$central.':'.$port.'/login/platform');
    $this->line('  Schools:  http://'.$central.':'.$port.'/login');

    $school = School::query()->first();
    if ($school) {
        $this->line('  Demo:     http://'.$school->slug.'.'.$central.':'.$port.'/login');
    }

    $this->newLine();
    $this->comment('Until /etc/hosts is updated, platform login also works at:');
    $this->line("  http://127.0.0.1:{$port}/login/platform");
})->purpose('Show /etc/hosts entries needed for local tenant subdomains');

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');
