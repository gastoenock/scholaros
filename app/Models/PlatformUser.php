<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use App\Models\Concerns\HasScholarOSRoles;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Hidden(['password', 'remember_token'])]
class PlatformUser extends Authenticatable
{
    use CamelCasesAttributes, HasFactory, HasScholarOSRoles, Notifiable, SoftDeletes;

    protected $connection = 'central';

    protected $table = 'platform_users';

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }
}
