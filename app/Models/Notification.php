<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use CamelCasesAttributes;

    protected $table = 'notifications';

    protected $guarded = [];

    protected $casts = [
        'is_read' => 'boolean',
    ];

    public function scopeForSchool($query, $schoolId)
    {
        return $query->where('school_id', $schoolId);
    }
}
