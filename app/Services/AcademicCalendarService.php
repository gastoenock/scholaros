<?php

namespace App\Services;

use App\Models\AcademicSemester;
use App\Models\AcademicTerm;
use App\Models\AcademicYear;
use App\Support\SettingsRegistry;
use Illuminate\Validation\ValidationException;

class AcademicCalendarService
{
    /** @var list<string> */
    private array $defaultSemesters = ['Semester 1', 'Semester 2'];

    /** @var array<string, list<string>> */
    private array $defaultTermsBySemester = [
        'Semester 1' => ['Term 1', 'Term 2'],
        'Semester 2' => ['Term 3', 'Term 4'],
    ];

    public function ensureDefaults(int $schoolId): void
    {
        if (AcademicYear::forSchool($schoolId)->exists()) {
            return;
        }

        $name = settings('general.academic_year')
            ?? SettingsRegistry::defaultAcademicYear(SettingsRegistry::tenantDefinitions());

        $this->createYearWithStructure($schoolId, $name, true);
    }

    public function createYearWithStructure(int $schoolId, string $name, bool $markCurrent = false): AcademicYear
    {
        $sortOrder = (int) AcademicYear::forSchool($schoolId)->max('sort_order') + 1;

        $year = AcademicYear::create([
            'school_id' => $schoolId,
            'name' => $name,
            'is_current' => $markCurrent,
            'sort_order' => $sortOrder,
        ]);

        if ($markCurrent) {
            $this->clearCurrentFlags($schoolId, $year->id);
        }

        foreach ($this->defaultSemesters as $semesterIndex => $semesterName) {
            $semester = AcademicSemester::create([
                'school_id' => $schoolId,
                'academic_year_id' => $year->id,
                'name' => $semesterName,
                'sort_order' => $semesterIndex + 1,
                'is_current' => $markCurrent && $semesterIndex === 0,
            ]);

            foreach ($this->defaultTermsBySemester[$semesterName] as $termIndex => $termName) {
                AcademicTerm::create([
                    'school_id' => $schoolId,
                    'academic_year_id' => $year->id,
                    'academic_semester_id' => $semester->id,
                    'name' => $termName,
                    'sort_order' => $termIndex + 1,
                    'is_current' => $markCurrent && $semesterIndex === 0 && $termIndex === 0,
                ]);
            }
        }

        return $year->load(['semesters.terms']);
    }

    public function currentYear(int $schoolId): AcademicYear
    {
        $this->ensureDefaults($schoolId);

        $year = AcademicYear::forSchool($schoolId)->where('is_current', true)->first();

        if (! $year) {
            $settingName = settings('general.academic_year');
            if ($settingName) {
                $year = AcademicYear::forSchool($schoolId)->where('name', $settingName)->first();
            }
        }

        if (! $year) {
            $year = AcademicYear::forSchool($schoolId)->orderByDesc('sort_order')->first();
        }

        abort_unless($year, 500, 'Academic year is not configured for this school.');

        return $year;
    }

    public function currentSemester(int $schoolId): AcademicSemester
    {
        $year = $this->currentYear($schoolId);

        $semester = AcademicSemester::forSchool($schoolId)
            ->where('academic_year_id', $year->id)
            ->where('is_current', true)
            ->first();

        if (! $semester) {
            $semester = AcademicSemester::forSchool($schoolId)
                ->where('academic_year_id', $year->id)
                ->orderBy('sort_order')
                ->first();
        }

        abort_unless($semester, 500, 'Academic semester is not configured for this school.');

        return $semester;
    }

    public function currentTerm(int $schoolId): AcademicTerm
    {
        $year = $this->currentYear($schoolId);

        $term = AcademicTerm::forSchool($schoolId)
            ->where('academic_year_id', $year->id)
            ->where('is_current', true)
            ->first();

        if (! $term) {
            $termName = settings('academics.default_term', 'Term 1');
            $term = $this->resolveTerm($schoolId, $year, null, null, $termName);
        }

        return $term;
    }

    public function resolveYear(int $schoolId, ?int $yearId = null, ?string $yearName = null): AcademicYear
    {
        $this->ensureDefaults($schoolId);

        if ($yearId) {
            $year = AcademicYear::forSchool($schoolId)->find($yearId);
            abort_unless($year, 422, 'Invalid academic year selected.');

            return $year;
        }

        if ($yearName) {
            return AcademicYear::firstOrCreate(
                ['school_id' => $schoolId, 'name' => $yearName],
                ['sort_order' => (int) AcademicYear::forSchool($schoolId)->max('sort_order') + 1],
            );
        }

        return $this->currentYear($schoolId);
    }

    public function resolveSemester(
        int $schoolId,
        AcademicYear $year,
        ?int $semesterId = null,
        ?string $semesterName = null,
    ): AcademicSemester {
        if ($semesterId) {
            $semester = AcademicSemester::forSchool($schoolId)
                ->where('academic_year_id', $year->id)
                ->find($semesterId);

            abort_unless($semester, 422, 'Invalid academic semester selected.');

            return $semester;
        }

        if ($semesterName) {
            return AcademicSemester::firstOrCreate(
                [
                    'school_id' => $schoolId,
                    'academic_year_id' => $year->id,
                    'name' => $semesterName,
                ],
                [
                    'sort_order' => (int) AcademicSemester::forSchool($schoolId)
                        ->where('academic_year_id', $year->id)
                        ->max('sort_order') + 1,
                ],
            );
        }

        return $this->currentSemester($schoolId);
    }

    public function resolveTerm(
        int $schoolId,
        AcademicYear $year,
        ?int $termId = null,
        ?int $semesterId = null,
        ?string $termName = null,
    ): AcademicTerm {
        if ($termId) {
            $term = AcademicTerm::forSchool($schoolId)
                ->where('academic_year_id', $year->id)
                ->find($termId);

            abort_unless($term, 422, 'Invalid academic term selected.');

            return $term;
        }

        $semester = $semesterId
            ? AcademicSemester::forSchool($schoolId)->where('academic_year_id', $year->id)->findOrFail($semesterId)
            : ($termName ? $this->semesterForTermName($schoolId, $year, $termName) : $this->currentSemester($schoolId));

        $name = $termName ?: settings('academics.default_term', 'Term 1');

        return AcademicTerm::firstOrCreate(
            [
                'school_id' => $schoolId,
                'academic_semester_id' => $semester->id,
                'name' => $name,
            ],
            [
                'academic_year_id' => $year->id,
                'sort_order' => (int) AcademicTerm::forSchool($schoolId)
                    ->where('academic_semester_id', $semester->id)
                    ->max('sort_order') + 1,
            ],
        );
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array<string, mixed>
     */
    public function applyYear(int $schoolId, array $validated): array
    {
        $year = $this->resolveYear(
            $schoolId,
            isset($validated['academicYearId']) ? (int) $validated['academicYearId'] : null,
            $validated['academicYear'] ?? null,
        );

        return [
            'academic_year_id' => $year->id,
            'academic_year' => $year->name,
        ];
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array<string, mixed>
     */
    public function applyYearAndSemester(int $schoolId, array $validated, bool $semesterRequired = true): array
    {
        $year = $this->resolveYear(
            $schoolId,
            isset($validated['academicYearId']) ? (int) $validated['academicYearId'] : null,
            $validated['academicYear'] ?? null,
        );

        $result = [
            'academic_year_id' => $year->id,
            'academic_year' => $year->name,
        ];

        $hasSemesterInput = ! empty($validated['academicSemesterId'])
            || ! empty($validated['academicSemester']);

        if ($semesterRequired || $hasSemesterInput) {
            $semester = $this->resolveSemester(
                $schoolId,
                $year,
                isset($validated['academicSemesterId']) ? (int) $validated['academicSemesterId'] : null,
                $validated['academicSemester'] ?? null,
            );

            $result['academic_semester_id'] = $semester->id;
        } elseif (! $semesterRequired) {
            $result['academic_semester_id'] = $this->currentSemester($schoolId)->id;
        }

        return $result;
    }

    /**
     * @param  array<string, mixed>  $validated
     * @param  list<'academic_year'|'term'>  $legacyColumns
     * @return array<string, mixed>
     */
    public function applyCalendar(int $schoolId, array $validated, bool $termRequired = true, array $legacyColumns = []): array
    {
        if (
            $termRequired
            && empty($validated['academicTermId'])
            && empty($validated['term'])
            && empty($validated['academicSemesterId'])
            && empty($validated['academicYearId'])
        ) {
            throw ValidationException::withMessages([
                'academicTermId' => 'Academic term is required.',
            ]);
        }

        $year = $this->resolveYear(
            $schoolId,
            isset($validated['academicYearId']) ? (int) $validated['academicYearId'] : null,
            $validated['academicYear'] ?? null,
        );

        $term = $this->resolveTerm(
            $schoolId,
            $year,
            isset($validated['academicTermId']) ? (int) $validated['academicTermId'] : null,
            isset($validated['academicSemesterId']) ? (int) $validated['academicSemesterId'] : null,
            $validated['term'] ?? null,
        );

        $term->loadMissing('academicSemester');

        $result = [
            'academic_year_id' => $year->id,
            'academic_semester_id' => $term->academicSemester?->id,
            'academic_term_id' => $term->id,
        ];

        if (in_array('academic_year', $legacyColumns, true)) {
            $result['academic_year'] = $year->name;
        }

        if (in_array('term', $legacyColumns, true)) {
            $result['term'] = $term->name;
        }

        return $result;
    }

    public function setCurrentYear(int $schoolId, AcademicYear $year): void
    {
        $this->clearCurrentFlags($schoolId, $year->id);
        $year->update(['is_current' => true]);

        $firstSemester = $year->semesters()->orderBy('sort_order')->first();
        if ($firstSemester) {
            $this->setCurrentSemester($schoolId, $firstSemester);
        }
    }

    public function setCurrentSemester(int $schoolId, AcademicSemester $semester): void
    {
        AcademicSemester::forSchool($schoolId)
            ->where('academic_year_id', $semester->academic_year_id)
            ->update(['is_current' => false]);

        $semester->update(['is_current' => true]);

        $firstTerm = $semester->terms()->orderBy('sort_order')->first();
        if ($firstTerm) {
            $this->setCurrentTerm($schoolId, $firstTerm);
        }
    }

    public function setCurrentTerm(int $schoolId, AcademicTerm $term): void
    {
        AcademicTerm::forSchool($schoolId)
            ->where('academic_year_id', $term->academic_year_id)
            ->update(['is_current' => false]);

        $term->update(['is_current' => true]);

        AcademicSemester::forSchool($schoolId)
            ->where('academic_year_id', $term->academic_year_id)
            ->update(['is_current' => false]);

        AcademicSemester::forSchool($schoolId)
            ->where('id', $term->academic_semester_id)
            ->update(['is_current' => true]);
    }

    /**
     * @return array<string, mixed>
     */
    public function managementPayload(int $schoolId): array
    {
        $this->ensureDefaults($schoolId);

        $years = AcademicYear::forSchool($schoolId)
            ->with(['semesters.terms' => fn ($query) => $query->orderBy('sort_order')])
            ->orderByDesc('sort_order')
            ->get();

        return [
            'years' => $years->map(fn (AcademicYear $year) => $this->mapYear($year))->values(),
            'currentYearId' => $this->currentYear($schoolId)->id,
            'currentSemesterId' => $this->currentSemester($schoolId)->id,
            'currentTermId' => $this->currentTerm($schoolId)->id,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function uiPayload(int $schoolId): array
    {
        return $this->managementPayload($schoolId);
    }

    /**
     * @return array<string, mixed>
     */
    private function mapYear(AcademicYear $year): array
    {
        return [
            'id' => $year->id,
            'name' => $year->name,
            'startDate' => $year->start_date,
            'endDate' => $year->end_date,
            'isCurrent' => (bool) $year->is_current,
            'sortOrder' => $year->sort_order,
            'semesters' => $year->semesters->map(fn (AcademicSemester $semester) => [
                'id' => $semester->id,
                'name' => $semester->name,
                'startDate' => $semester->start_date,
                'endDate' => $semester->end_date,
                'isCurrent' => (bool) $semester->is_current,
                'sortOrder' => $semester->sort_order,
                'terms' => $semester->terms->map(fn (AcademicTerm $term) => [
                    'id' => $term->id,
                    'name' => $term->name,
                    'startDate' => $term->start_date,
                    'endDate' => $term->end_date,
                    'isCurrent' => (bool) $term->is_current,
                    'sortOrder' => $term->sort_order,
                ])->values(),
            ])->values(),
        ];
    }

    private function clearCurrentFlags(int $schoolId, int $yearId): void
    {
        AcademicYear::forSchool($schoolId)->where('id', '!=', $yearId)->update(['is_current' => false]);
        AcademicSemester::forSchool($schoolId)->update(['is_current' => false]);
        AcademicTerm::forSchool($schoolId)->update(['is_current' => false]);
    }

    private function semesterForTermName(int $schoolId, AcademicYear $year, string $termName): AcademicSemester
    {
        $semesterName = in_array($termName, ['Term 1', 'Term 2'], true) ? 'Semester 1' : 'Semester 2';

        return $this->resolveSemester($schoolId, $year, null, $semesterName);
    }

    /** @deprecated Use createYearWithStructure */
    public function createYearWithSemesters(int $schoolId, string $name, bool $markCurrent = false): AcademicYear
    {
        return $this->createYearWithStructure($schoolId, $name, $markCurrent);
    }
}
