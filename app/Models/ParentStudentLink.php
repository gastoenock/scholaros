<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ParentStudentLink extends Model
{
    use CamelCasesAttributes;
    use SoftDeletes;

    protected $table = 'parent_student_links';

    protected $guarded = [];

    protected $casts = [
        'is_primary' => 'boolean',
    ];

    public function scopeForSchool($query, $schoolId)
    {
        return $query->where('school_id', $schoolId);
    }
}
