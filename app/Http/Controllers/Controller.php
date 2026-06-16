<?php

namespace App\Http\Controllers;

use App\Models\School;
use Illuminate\Support\Str;

abstract class Controller
{
    /**
     * The current tenant school id. Only available when tenancy is initialized.
     */
    protected function schoolId(): ?int
    {
        if (! tenancy()->initialized) {
            return null;
        }

        return (int) tenant('id');
    }

    protected function school(): ?School
    {
        if (tenancy()->initialized && tenant() instanceof School) {
            return tenant();
        }

        return null;
    }

    protected function requireTenancy(): int
    {
        $schoolId = $this->schoolId();

        abort_unless($schoolId, 403, 'School context is not available.');

        return $schoolId;
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
