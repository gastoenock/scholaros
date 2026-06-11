<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Model;

class SchoolApplication extends Model
{
    use CamelCasesAttributes;

    protected $table = 'school_applications';

    protected $guarded = [];

    protected $casts = [];
}
