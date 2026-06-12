<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class FeeStructure extends Model
{
    use CamelCasesAttributes;
    use SoftDeletes;

    protected $table = 'fee_structures';

    protected $guarded = [];

    protected $casts = [
        'items' => 'array',
        'total_amount' => 'float',
    ];

    public function scopeForSchool($query, $schoolId)
    {
        return $query->where('school_id', $schoolId);
    }
}
