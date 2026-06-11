<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    use CamelCasesAttributes;

    protected $table = 'expenses';

    protected $guarded = [];

    protected $casts = [
        'amount' => 'float',
    ];

    public function scopeForSchool($query, $schoolId)
    {
        return $query->where('school_id', $schoolId);
    }
}
