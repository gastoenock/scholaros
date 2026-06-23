<?php

namespace App\Http\Controllers;

use App\Models\School;
use App\Services\AcademicCalendarService;
use App\Support\TenancyUrl;
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

    protected function academicCalendar(): AcademicCalendarService
    {
        return app(AcademicCalendarService::class);
    }

    protected function tenantRoute(string $name, array $parameters = []): string
    {
        return TenancyUrl::tenantRoute($name, $parameters);
    }

    /**
     * @return array<string, list<string>>
     */
    protected function academicYearRules(bool $required = false): array
    {
        return [
            'academicYearId' => ['nullable', 'integer', 'exists:academic_years,id'],
            'academicYear' => [$required ? 'required_without:academicYearId' : 'nullable', 'string', 'max:50'],
        ];
    }

    /**
     * @return array<string, list<string>>
     */
    protected function academicSemesterRules(bool $required = false): array
    {
        return [
            'academicSemesterId' => ['nullable', 'integer', 'exists:academic_semesters,id'],
            'academicSemester' => ['nullable', 'string', 'max:50'],
        ];
    }

    /**
     * @return array<string, list<string>>
     */
    protected function academicTermRules(bool $required = false): array
    {
        return [
            'academicTermId' => ['nullable', 'integer', 'exists:academic_terms,id'],
            'term' => [$required ? 'required_without:academicTermId' : 'nullable', 'string', 'max:50'],
        ];
    }
}
