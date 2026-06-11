<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Model;

class Meeting extends Model
{
    use CamelCasesAttributes;

    protected $table = 'meetings';

    protected $guarded = [];

    protected $casts = [
        'duration_minutes' => 'integer',
    ];

    public function scopeForSchool($query, $schoolId)
    {
        return $query->where('school_id', $schoolId);
    }
}
