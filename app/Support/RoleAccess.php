<?php

namespace App\Support;

use App\Models\PlatformUser;
use App\Models\User;
use Illuminate\Contracts\Auth\Authenticatable;

class RoleAccess
{
    /**
     * @return list<string>
     */
    public static function tenantRoles(): array
    {
        return config('roles.tenant', []);
    }

    /**
     * @return list<string>
     */
    public static function dashboardRoles(): array
    {
        return config('roles.dashboard', []);
    }

    /**
     * @param  list<string>|null  $allowedRoles
     */
    public static function canAccess(?Authenticatable $user, ?array $allowedRoles): bool
    {
        if (! $user) {
            return false;
        }

        if ($allowedRoles === null) {
            return self::isTenantUser($user) || self::isManagingPlatformAdmin($user);
        }

        if (self::isManagingPlatformAdmin($user)) {
            return true;
        }

        if (! ($user->is_active ?? true)) {
            return false;
        }

        $role = $user->role ?? null;

        return $role && in_array($role, $allowedRoles, true);
    }

    /**
     * @return list<string>
     */
    public static function permissions(?Authenticatable $user): array
    {
        if (! $user) {
            return [];
        }

        if (self::isManagingPlatformAdmin($user)) {
            return config('permissions.platform_admin', ['*']);
        }

        if (! $user instanceof User || ! $user->is_active) {
            return [];
        }

        $role = $user->role ?? null;

        if (! $role) {
            return [];
        }

        return config("permissions.roles.{$role}", []);
    }

    public static function can(?Authenticatable $user, string $permission): bool
    {
        $permissions = self::permissions($user);

        if (in_array('*', $permissions, true)) {
            return true;
        }

        return in_array($permission, $permissions, true);
    }

    public static function isManagingPlatformAdmin(Authenticatable $user): bool
    {
        return $user instanceof PlatformUser
            && $user->isPlatformAdmin()
            && tenancy()->initialized;
    }

    public static function isTenantUser(Authenticatable $user): bool
    {
        return $user instanceof User;
    }

    public static function homePath(?Authenticatable $user): string
    {
        if (! $user) {
            return '/login';
        }

        if ($user instanceof User) {
            return match ($user->role) {
                'parent' => '/dashboard/parent-portal',
                'student' => '/dashboard/student',
                'teacher' => '/dashboard/teacher',
                default => '/dashboard',
            };
        }

        return '/dashboard';
    }
}
