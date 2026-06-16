<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ForgetTenantDomainParameter
{
    /**
     * Remove the subdomain route parameter so it is not injected into controllers.
     *
     * Domain routes capture {schoolSlug} for matching only; tenancy is resolved from the host.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->route()?->hasParameter('schoolSlug')) {
            $request->route()->forgetParameter('schoolSlug');
        }

        return $next($request);
    }
}
