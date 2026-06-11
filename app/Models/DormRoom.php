<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Model;

class DormRoom extends Model
{
    use CamelCasesAttributes;

    protected $table = 'dorm_rooms';

    protected $guarded = [];

    protected $casts = [
        'amenities' => 'array',
        'capacity' => 'integer',
        'occupied_count' => 'integer',
        'floor' => 'integer',
        'monthly_fee' => 'float',
    ];

    public function scopeForSchool($query, $schoolId)
    {
        return $query->where('school_id', $schoolId);
    }
}
