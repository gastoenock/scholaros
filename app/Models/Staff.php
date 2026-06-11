<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Model;

class Staff extends Model
{
    use CamelCasesAttributes;

    protected $table = 'staff';

    protected $guarded = [];

    protected $casts = [
        'subjects' => 'array',
        'emergency_contact' => 'array',
        'salary' => 'float',
    ];

    public function scopeForSchool($query, $schoolId)
    {
        return $query->where('school_id', $schoolId);
    }
}
