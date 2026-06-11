<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Model;

class BusRoute extends Model
{
    use CamelCasesAttributes;

    protected $table = 'bus_routes';

    protected $guarded = [];

    protected $casts = [
        'stops' => 'array',
        'is_active' => 'boolean',
    ];

    public function scopeForSchool($query, $schoolId)
    {
        return $query->where('school_id', $schoolId);
    }
}
