<?php

namespace App\Http\Controllers;

use App\Models\School;
use Illuminate\Support\Str;

abstract class Controller
{
    /**
     * The current user's school id (multi-tenant scope).
     */
    protected function schoolId(): ?int
    {
        return auth()->user()?->school_id;
    }

    protected function school(): ?School
    {
        $id = $this->schoolId();

        return $id ? School::with('branches')->find($id) : null;
    }

    /**
     * Convert camelCase request payload keys to snake_case column names.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    protected function snakeKeys(array $data): array
    {
        $result = [];
        foreach ($data as $key => $value) {
            $result[Str::snake($key)] = $value;
        }

        return $result;
    }
}
