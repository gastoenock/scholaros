<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Model;

class PlatformSetting extends Model
{
    use CamelCasesAttributes;

    protected $connection = 'central';

    protected $table = 'platform_settings';

    protected $guarded = [];

    protected $casts = [
        'value' => 'json',
    ];
}
