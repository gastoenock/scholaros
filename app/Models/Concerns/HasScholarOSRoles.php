<?php

namespace App\Models\Concerns;

trait HasScholarOSRoles
{
    public function isSuperadmin(): bool
    {
        return $this->role === 'superadmin';
    }

    public function isLandlord(): bool
    {
        return $this->role === 'landlord';
    }

    public function isPlatformAdmin(): bool
    {
        return in_array($this->role, ['superadmin', 'landlord'], true);
    }

    public function isSchoolAdmin(): bool
    {
        return $this->role === 'admin';
    }
}
