<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Model;

class Admission extends Model
{
    use CamelCasesAttributes;

    protected $table = 'admissions';

    protected $guarded = [];

    protected $casts = [
        'documents' => 'array',
    ];

    public function scopeForSchool($query, $schoolId)
    {
        return $query->where('school_id', $schoolId);
    }
}
