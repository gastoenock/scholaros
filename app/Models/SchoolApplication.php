<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class SchoolApplication extends Model
{
    use CamelCasesAttributes;
    use SoftDeletes;

    protected $connection = 'central';

    protected $table = 'school_applications';

    protected $guarded = [];

    protected $casts = [];
}
