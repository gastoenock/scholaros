<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Model;

class LibraryBook extends Model
{
    use CamelCasesAttributes;

    protected $table = 'library_books';

    protected $guarded = [];

    protected $casts = [
        'total_copies' => 'integer',
        'available_copies' => 'integer',
    ];

    public function scopeForSchool($query, $schoolId)
    {
        return $query->where('school_id', $schoolId);
    }
}
