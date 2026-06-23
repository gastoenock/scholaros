<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class AcademicYear extends Model
{
    use CamelCasesAttributes;
    use SoftDeletes;

    protected $guarded = [];

    protected $casts = [
        'is_current' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function scopeForSchool($query, int $schoolId)
    {
        return $query->where('school_id', $schoolId);
    }

    public function semesters(): HasMany
    {
        return $this->hasMany(AcademicSemester::class)->orderBy('sort_order');
    }

    public function terms(): HasMany
    {
        return $this->hasMany(AcademicTerm::class)->orderBy('sort_order');
    }

    public function exams(): HasMany
    {
        return $this->hasMany(Exam::class);
    }

    public function classes(): HasMany
    {
        return $this->hasMany(SchoolClass::class);
    }

    public function students(): HasMany
    {
        return $this->hasMany(Student::class);
    }
}
