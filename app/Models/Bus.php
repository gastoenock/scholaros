<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Bus extends Model
{
    use CamelCasesAttributes;
    use SoftDeletes;

    protected $table = 'buses';

    protected $guarded = [];

    protected $casts = [
        'capacity' => 'integer',
        'current_lat' => 'float',
        'current_lng' => 'float',
    ];

    public function scopeForSchool($query, $schoolId)
    {
        return $query->where('school_id', $schoolId);
    }
}
