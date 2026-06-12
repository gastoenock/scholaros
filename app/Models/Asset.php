<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Asset extends Model
{
    use CamelCasesAttributes;
    use SoftDeletes;

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
