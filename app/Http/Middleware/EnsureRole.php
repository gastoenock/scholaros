<?php

namespace App\Http\Middleware;

use App\Support\RoleAccess;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    /**
     * @param  string  ...$roles
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();
        $allowedRoles = $roles;

        if (! RoleAccess::canAccess($user, $allowedRoles)) {
            $home = RoleAccess::homePath($user);
            $current = '/'.ltrim($request->path(), '/');

            if ($request->header('X-Inertia') || $request->expectsJson()) {
                if ($home === $current || $home === $request->getRequestUri()) {
                    abort(403, 'You do not have permission to access this resource.');
                }

                return redirect()
                    ->to($home)
                    ->with('error', 'You do not have permission to access that page.');
            }

            abort(403, 'You do not have permission to access this resource.');
        }

        return $next($request);
    }
}
