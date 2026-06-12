<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Student extends Model
{
    use CamelCasesAttributes;
    use SoftDeletes;

    protected $table = 'students';

    protected $guarded = [];

    protected $casts = [
        'guardians' => 'array',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(SchoolBranch::class, 'school_branch_id');
    }

    public function scopeForSchool($query, $schoolId)
    {
        return $query->where('school_id', $schoolId);
    }
}
