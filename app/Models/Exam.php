<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Exam extends Model
{
    use CamelCasesAttributes;
    use SoftDeletes;

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
