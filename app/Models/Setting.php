<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use CamelCasesAttributes;

    protected $guarded = [];

    protected $casts = [
        'value' => 'json',
    ];

    public function scopeForSchool($query, int $schoolId)
    {
        return $query->where('school_id', $schoolId);
    }
}
