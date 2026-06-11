<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Model;

class Assignment extends Model
{
    use CamelCasesAttributes;

    protected $table = 'assignments';

    protected $guarded = [];

    protected $casts = [
        'max_score' => 'float',
    ];

    public function scopeForSchool($query, $schoolId)
    {
        return $query->where('school_id', $schoolId);
    }
}
