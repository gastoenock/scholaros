<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class FeePayment extends Model
{
    use CamelCasesAttributes;
    use SoftDeletes;

    protected $table = 'fee_payments';

    protected $guarded = [];

    protected $casts = [
        'amount' => 'float',
        'fees_due' => 'float',
        'paid_total_before' => 'float',
        'paid_total_after' => 'float',
        'balance_before' => 'float',
        'balance_after' => 'float',
    ];

    public function scopeForSchool($query, $schoolId)
    {
        return $query->where('school_id', $schoolId);
    }
}
