<?php

namespace App\Models\Concerns;

use Illuminate\Support\Str;

/**
 * Serializes model attributes/relations with camelCase keys so the React
 * frontend (ported from Convex) can keep its existing field names.
 */
trait CamelCasesAttributes
{
    public function toArray(): array
    {
        $camel = [];

        foreach (parent::toArray() as $key => $value) {
            $camel[Str::camel($key)] = $value;
        }

        return $camel;
    }
}
