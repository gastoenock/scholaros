<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Model;

class Submission extends Model
{
    use CamelCasesAttributes;

    protected $table = 'submissions';

    protected $guarded = [];

    protected $casts = [
        'score' => 'float',
    ];

    public function scopeForSchool($query, $schoolId)
    {
        return $query->where('school_id', $schoolId);
    }
}
