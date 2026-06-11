<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Model;

class Exam extends Model
{
    use CamelCasesAttributes;

    protected $table = 'exams';

    protected $guarded = [];

    protected $casts = [
        'max_score' => 'float',
        'passing_score' => 'float',
    ];

    public function scopeForSchool($query, $schoolId)
    {
        return $query->where('school_id', $schoolId);
    }
}
