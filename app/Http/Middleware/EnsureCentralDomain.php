<?php

namespace App\Http\Middleware;

use App\Support\TenancyUrl;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureCentralDomain
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! TenancyUrl::isCentralHost($request->getHost())) {
            abort(404);
        }

        return $next($request);
    }
}
