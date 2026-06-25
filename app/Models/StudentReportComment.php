<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentReportComment extends Model
{
    use CamelCasesAttributes;

    protected $guarded = [];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function classTeacher(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'class_teacher_id');
    }
}
