<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class OnlineClass extends Model
{
    use CamelCasesAttributes;
    use SoftDeletes;

    protected $table = 'online_classes';

    protected $guarded = [];

    protected $casts = [
        'recurring_days' => 'array',
        'is_recurring' => 'boolean',
        'duration_minutes' => 'integer',
    ];

    public function scopeForSchool($query, $schoolId)
    {
        return $query->where('school_id', $schoolId);
    }
}
