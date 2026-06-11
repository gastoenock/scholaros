<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    use CamelCasesAttributes;

    protected $table = 'messages';

    protected $guarded = [];

    protected $casts = [
        'is_read' => 'boolean',
    ];

    public function scopeForSchool($query, $schoolId)
    {
        return $query->where('school_id', $schoolId);
    }
}
