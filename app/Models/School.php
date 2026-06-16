<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Stancl\Tenancy\Contracts\TenantWithDatabase;
use Stancl\Tenancy\Database\Concerns\HasDatabase;
use Stancl\Tenancy\Database\Concerns\HasDomains;
use Stancl\Tenancy\Database\Models\Tenant as BaseTenant;

class School extends BaseTenant implements TenantWithDatabase
{
    use CamelCasesAttributes;
    use HasDatabase;
    use HasDomains;
    use SoftDeletes;

    protected $table = 'tenants';

    protected $guarded = [];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public static function getCustomColumns(): array
    {
        return [
            'id',
            'name',
            'slug',
            'address',
            'city',
            'state',
            'zip',
            'phone',
            'email',
            'website',
            'logo',
            'admin_id',
            'is_active',
            'plan',
        ];
    }

    public function getIncrementing(): bool
    {
        return true;
    }

    public function branches(): HasMany
    {
        return $this->hasMany(SchoolBranch::class, 'school_id');
    }

    public function students(): HasMany
    {
        return $this->hasMany(Student::class, 'school_id');
    }

    public function staff(): HasMany
    {
        return $this->hasMany(Staff::class, 'school_id');
    }

    public function classes(): HasMany
    {
        return $this->hasMany(SchoolClass::class, 'school_id');
    }

    public function subjects(): HasMany
    {
        return $this->hasMany(Subject::class, 'school_id');
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(Assignment::class, 'school_id');
    }

    public function exams(): HasMany
    {
        return $this->hasMany(Exam::class, 'school_id');
    }

    public function onlineClasses(): HasMany
    {
        return $this->hasMany(OnlineClass::class, 'school_id');
    }
}
