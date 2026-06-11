<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Model;

class MaintenanceRequest extends Model
{
    use CamelCasesAttributes;

    protected $table = 'maintenance_requests';

    protected $guarded = [];

    protected $casts = [];

    public function scopeForSchool($query, $schoolId)
    {
        return $query->where('school_id', $schoolId);
    }
}
