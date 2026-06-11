<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Model;

class LibraryIssuance extends Model
{
    use CamelCasesAttributes;

    protected $table = 'library_issuances';

    protected $guarded = [];

    protected $casts = [];

    public function scopeForSchool($query, $schoolId)
    {
        return $query->where('school_id', $schoolId);
    }
}
