<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Model;

class AttendanceRecord extends Model
{
    use CamelCasesAttributes;

    protected $table = 'attendance_records';

    protected $guarded = [];

    protected $casts = [];

    public function scopeForSchool($query, $schoolId)
    {
        return $query->where('school_id', $schoolId);
    }
}
