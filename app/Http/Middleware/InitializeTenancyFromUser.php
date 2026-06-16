<?php

namespace App\Http\Middleware;

use App\Models\School;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class InitializeTenancyFromUser
{
    public function handle(Request $request, Closure $next): Response
    {
        if (tenancy()->initialized) {
            return $next($request);
        }

        $user = $request->user();
        if (! $user) {
            return $next($request);
        }

        $tenantId = $user->isPlatformAdmin()
            ? $request->session()->get('manage_tenant_id')
            : $request->session()->get('tenant_id');

        if (! $tenantId) {
            return $next($request);
        }

        $tenant = School::find($tenantId);

        if (! $tenant) {
            if ($user->isPlatformAdmin()) {
                $request->session()->forget('manage_tenant_id');
            } else {
                $request->session()->forget('tenant_id');
            }

            return $next($request);
        }

        tenancy()->initialize($tenant);

        return $next($request);
    }
}
