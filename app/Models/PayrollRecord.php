<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Model;

class PayrollRecord extends Model
{
    use CamelCasesAttributes;

    protected $table = 'payroll_records';

    protected $guarded = [];

    protected $casts = [
        'month' => 'integer',
        'year' => 'integer',
        'basic_salary' => 'float',
        'allowances' => 'float',
        'deductions' => 'float',
        'net_salary' => 'float',
    ];

    public function scopeForSchool($query, $schoolId)
    {
        return $query->where('school_id', $schoolId);
    }
}
