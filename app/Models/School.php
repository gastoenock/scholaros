<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Model;

class School extends Model
{
    use CamelCasesAttributes;

    protected $table = 'schools';

    protected $guarded = [];

    protected $casts = [
        'branches' => 'array',
        'is_active' => 'boolean',
    ];

    public function scopeForSchool($query, $schoolId)
    {
        return $query->where('school_id', $schoolId);
    }
}
