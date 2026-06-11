<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Model;

class ExamResult extends Model
{
    use CamelCasesAttributes;

    protected $table = 'exam_results';

    protected $guarded = [];

    protected $casts = [
        'score' => 'float',
    ];

    public function scopeForSchool($query, $schoolId)
    {
        return $query->where('school_id', $schoolId);
    }
}
