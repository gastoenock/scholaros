<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    use CamelCasesAttributes;

    protected $table = 'students';

    protected $guarded = [];

    protected $casts = [
        'guardians' => 'array',
    ];

    public function scopeForSchool($query, $schoolId)
    {
        return $query->where('school_id', $schoolId);
    }
}
