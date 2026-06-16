<?php

namespace App\Support;

use App\Models\School;

class TenancyUrl
{
    public static function centralDomain(): string
    {
        return (string) config('tenancy.central_domain');
    }

    public static function centralUrl(string $path = '/'): string
    {
        if (app()->environment('local') && request()->getHost() && TenancyUrl::isCentralHost(request()->getHost())) {
            return self::scheme().'://'.request()->getHost().self::localPortSuffix().self::path($path);
        }

        return self::scheme().'://'.self::centralDomain().self::localPortSuffix().self::path($path);
    }

    public static function tenantDomain(string $slug): string
    {
        return $slug.'.'.self::centralDomain();
    }

    public static function tenantUrl(string $slug, string $path = '/'): string
    {
        return self::scheme().'://'.self::tenantDomain($slug).self::localPortSuffix().self::path($path);
    }

    public static function tenantUrlForSchool(School $school, string $path = '/'): string
    {
        return self::tenantUrl($school->slug, $path);
    }

    public static function tenantRoute(string $name, array $parameters = [], bool $absolute = true): string
    {
        $parameters['schoolSlug'] ??= tenant('slug') ?? self::tenantSlugFromHost();

        if (empty($parameters['schoolSlug'])) {
            throw new \InvalidArgumentException("Cannot generate tenant route [{$name}] without schoolSlug.");
        }

        return route($name, $parameters, $absolute);
    }

    public static function syncSchoolDomain(School $school): void
    {
        if ($school->domains()->where('domain', $school->slug)->exists()) {
            return;
        }

        $school->createDomain($school->slug);
    }

    public static function tenantSlugFromHost(?string $host = null): ?string
    {
        $host ??= request()->getHost();
        $centralDomain = self::centralDomain();

        if (in_array($host, config('tenancy.central_domains', []), true)) {
            return null;
        }

        if (! str_ends_with($host, '.'.$centralDomain)) {
            return null;
        }

        $slug = substr($host, 0, -(strlen($centralDomain) + 1));

        return $slug !== '' ? $slug : null;
    }

    public static function isCentralHost(?string $host = null): bool
    {
        return in_array($host ?? request()->getHost(), config('tenancy.central_domains', []), true);
    }

    private static function scheme(): string
    {
        $scheme = parse_url((string) config('app.url'), PHP_URL_SCHEME);

        return $scheme ?: 'http';
    }

    private static function path(string $path): string
    {
        return str_starts_with($path, '/') ? $path : '/'.$path;
    }

    /**
     * When using `php artisan serve`, the app runs on a non-standard port (e.g. :8000).
     * Without this suffix, tenant subdomain links hit Apache on port 80 and 404.
     */
    private static function localPortSuffix(): string
    {
        if (! app()->environment('local')) {
            return '';
        }

        $port = request()->getPort();
        if ($port && ! in_array($port, [80, 443], true)) {
            return ':'.$port;
        }

        $appPort = parse_url((string) config('app.url'), PHP_URL_PORT);
        if ($appPort && ! in_array((int) $appPort, [80, 443], true)) {
            return ':'.$appPort;
        }

        return '';
    }
}
