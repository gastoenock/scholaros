<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Model;

class DormAllocation extends Model
{
    use CamelCasesAttributes;

    protected $table = 'dorm_allocations';

    protected $guarded = [];

    protected $casts = [];

    public function scopeForSchool($query, $schoolId)
    {
        return $query->where('school_id', $schoolId);
    }
}
