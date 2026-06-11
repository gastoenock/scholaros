<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Model;

class TransportAssignment extends Model
{
    use CamelCasesAttributes;

    protected $table = 'transport_assignments';

    protected $guarded = [];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function scopeForSchool($query, $schoolId)
    {
        return $query->where('school_id', $schoolId);
    }
}
