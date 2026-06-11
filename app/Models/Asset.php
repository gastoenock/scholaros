<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Model;

class Asset extends Model
{
    use CamelCasesAttributes;

    protected $table = 'assets';

    protected $guarded = [];

    protected $casts = [
        'purchase_cost' => 'float',
        'current_value' => 'float',
        'quantity' => 'integer',
    ];

    public function scopeForSchool($query, $schoolId)
    {
        return $query->where('school_id', $schoolId);
    }
}
