<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Model;

class TimetableSlot extends Model
{
    use CamelCasesAttributes;

    protected $table = 'timetable_slots';

    protected $guarded = [];

    protected $casts = [
        'period' => 'integer',
    ];

    public function scopeForSchool($query, $schoolId)
    {
        return $query->where('school_id', $schoolId);
    }
}
