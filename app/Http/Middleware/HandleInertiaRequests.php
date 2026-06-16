<?php

namespace App\Http\Middleware;

use App\Models\School;
use App\Support\TenancyUrl;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Inertia\Support\Header;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        if (file_exists(public_path('hot'))) {
            return $request->header(Header::VERSION, '');
        }

        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $user = $request->user();
        $isCentral = TenancyUrl::isCentralHost($request->getHost());
        $tenantSlug = TenancyUrl::tenantSlugFromHost($request->getHost());
        $managedTenantId = $user?->isPlatformAdmin()
            ? $request->session()->get('manage_tenant_id')
            : null;
        $managedTenant = $managedTenantId ? School::find($managedTenantId) : null;
        $tenantId = tenancy()->initialized
            ? (int) tenant('id')
            : ($managedTenantId ? (int) $managedTenantId : null);
        $managingTenant = $user?->isPlatformAdmin() && ($isCentral ? (bool) $managedTenantId : tenancy()->initialized);

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'accountType' => $user->isPlatformAdmin() ? 'platform' : 'tenant',
                    'schoolId' => $tenantId,
                    'avatar' => $user->avatar ?? null,
                    'phone' => $user->phone ?? null,
                ] : null,
            ],
            'platform' => [
                'isPlatformAdmin' => $user?->isPlatformAdmin() ?? false,
                'manageTenantId' => $managingTenant ? $tenantId : null,
                'manageTenantName' => $managingTenant
                    ? (tenancy()->initialized && tenant() instanceof School ? tenant()->name : $managedTenant?->name)
                    : null,
                'tenants' => $user?->isPlatformAdmin()
                    ? School::query()->orderBy('name')->get(['id', 'name', 'slug', 'is_active', 'plan'])
                    : [],
            ],
            'tenancyHost' => [
                'isCentral' => $isCentral,
                'isTenant' => ! $isCentral && $tenantSlug !== null,
                'centralDomain' => TenancyUrl::centralDomain(),
                'centralUrl' => TenancyUrl::centralUrl('/'),
                'tenantSlug' => $tenantSlug,
                'tenantName' => tenancy()->initialized && tenant() instanceof School ? tenant()->name : null,
            ],
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
        ];
    }
}
