<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Model;

class FeePayment extends Model
{
    use CamelCasesAttributes;

    protected $table = 'fee_payments';

    protected $guarded = [];

    protected $casts = [
        'amount' => 'float',
    ];

    public function scopeForSchool($query, $schoolId)
    {
        return $query->where('school_id', $schoolId);
    }
}
