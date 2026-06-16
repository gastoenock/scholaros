<?php

namespace App\Http\Middleware;

use App\Support\TenancyUrl;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenancy
{
    public function handle(Request $request, Closure $next): Response
    {
        if (tenancy()->initialized) {
            return $next($request);
        }

        $user = $request->user();

        if ($user?->isPlatformAdmin()) {
            return redirect()
                ->away(\App\Support\TenancyUrl::centralUrl('/dashboard'))
                ->with('error', 'Select a school from Schools and click Manage to access this module.');
        }

        $loginUrl = TenancyUrl::tenantSlugFromHost($request->getHost())
            ? TenancyUrl::tenantRoute('tenant.login')
            : TenancyUrl::centralUrl('/login');

        return redirect()
            ->away($loginUrl)
            ->with('error', 'Could not identify your school from this domain.');
    }
}
