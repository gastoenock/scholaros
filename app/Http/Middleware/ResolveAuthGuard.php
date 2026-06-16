<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class ResolveAuthGuard
{
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::guard('platform')->check()) {
            Auth::shouldUse('platform');
        } elseif (Auth::guard('web')->check()) {
            Auth::shouldUse('web');
        }

        return $next($request);
    }
}
