<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** @var list<string> */
    private array $defaultSemesters = ['Semester 1', 'Semester 2'];

    /** @var array<string, list<string>> */
    private array $defaultTermsBySemester = [
        'Semester 1' => ['Term 1', 'Term 2'],
        'Semester 2' => ['Term 3', 'Term 4'],
    ];

    public function up(): void
    {
        Schema::create('academic_terms', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('school_id')->index();
            $table->foreignId('academic_year_id')->constrained('academic_years')->cascadeOnDelete();
            $table->foreignId('academic_semester_id')->constrained('academic_semesters')->cascadeOnDelete();
            $table->string('name');
            $table->string('start_date')->nullable();
            $table->string('end_date')->nullable();
            $table->boolean('is_current')->default(false);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['academic_semester_id', 'name']);
        });

        foreach (['exams', 'assignments', 'attendance_records', 'timetable_slots'] as $tableName) {
            if (! Schema::hasTable($tableName)) {
                continue;
            }

            Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                if (! Schema::hasColumn($tableName, 'academic_term_id')) {
                    $table->foreignId('academic_term_id')->nullable()->constrained('academic_terms')->nullOnDelete();
                }
            });
        }

        $this->restructureCalendar();
        $this->backfillTermForeignKeys();
    }

    public function down(): void
    {
        foreach (['exams', 'assignments', 'attendance_records', 'timetable_slots'] as $tableName) {
            if (! Schema::hasTable($tableName) || ! Schema::hasColumn($tableName, 'academic_term_id')) {
                continue;
            }

            Schema::table($tableName, function (Blueprint $table) {
                $table->dropConstrainedForeignId('academic_term_id');
            });
        }

        Schema::dropIfExists('academic_terms');
    }

    private function restructureCalendar(): void
    {
        $schoolIds = DB::table('academic_years')->distinct()->pluck('school_id');

        foreach ($schoolIds as $schoolId) {
            $years = DB::table('academic_years')
                ->where('school_id', $schoolId)
                ->orderBy('sort_order')
                ->get();

            foreach ($years as $year) {
                $legacyTerms = DB::table('academic_semesters')
                    ->where('school_id', $schoolId)
                    ->where('academic_year_id', $year->id)
                    ->whereIn('name', ['Term 1', 'Term 2', 'Term 3', 'Term 4'])
                    ->get()
                    ->keyBy('name');

                $hasProperSemesters = DB::table('academic_semesters')
                    ->where('school_id', $schoolId)
                    ->where('academic_year_id', $year->id)
                    ->whereIn('name', $this->defaultSemesters)
                    ->exists();

                if (! $hasProperSemesters) {
                    DB::table('academic_semesters')
                        ->where('school_id', $schoolId)
                        ->where('academic_year_id', $year->id)
                        ->whereIn('name', ['Term 1', 'Term 2', 'Term 3', 'Term 4'])
                        ->delete();
                }

                $semesterIds = [];
                foreach ($this->defaultSemesters as $index => $semesterName) {
                    $existing = DB::table('academic_semesters')
                        ->where('school_id', $schoolId)
                        ->where('academic_year_id', $year->id)
                        ->where('name', $semesterName)
                        ->first();

                    if ($existing) {
                        $semesterIds[$semesterName] = (int) $existing->id;

                        continue;
                    }

                    $semesterIds[$semesterName] = (int) DB::table('academic_semesters')->insertGetId([
                        'school_id' => $schoolId,
                        'academic_year_id' => $year->id,
                        'name' => $semesterName,
                        'is_current' => (bool) $year->is_current && $index === 0,
                        'sort_order' => $index + 1,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                $termMap = [];
                foreach ($this->defaultTermsBySemester as $semesterName => $termNames) {
                    $semesterId = $semesterIds[$semesterName];

                    foreach ($termNames as $termIndex => $termName) {
                        $existingTerm = DB::table('academic_terms')
                            ->where('school_id', $schoolId)
                            ->where('academic_semester_id', $semesterId)
                            ->where('name', $termName)
                            ->first();

                        if ($existingTerm) {
                            $termMap[$termName] = (int) $existingTerm->id;

                            continue;
                        }

                        $legacy = $legacyTerms->get($termName);
                        $isCurrent = $legacy
                            ? (bool) $legacy->is_current
                            : ((bool) $year->is_current && $termName === 'Term 1');

                        $termMap[$termName] = (int) DB::table('academic_terms')->insertGetId([
                            'school_id' => $schoolId,
                            'academic_year_id' => $year->id,
                            'academic_semester_id' => $semesterId,
                            'name' => $termName,
                            'is_current' => $isCurrent,
                            'sort_order' => $termIndex + 1,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                }

                if (Schema::hasTable('exams')) {
                    DB::table('exams')
                        ->where('school_id', $schoolId)
                        ->where('academic_year_id', $year->id)
                        ->orderBy('id')
                        ->chunk(200, function ($rows) use ($termMap, $semesterIds) {
                            foreach ($rows as $row) {
                                $termName = $this->resolveLegacyTermName($row->term, $row->academic_semester_id);
                                $termId = $termMap[$termName] ?? $termMap['Term 1'] ?? null;
                                $semesterId = $this->semesterIdForTerm($termName, $semesterIds);

                                if (! $termId) {
                                    continue;
                                }

                                DB::table('exams')->where('id', $row->id)->update([
                                    'academic_term_id' => $termId,
                                    'academic_semester_id' => $semesterId,
                                    'term' => $termName,
                                ]);
                            }
                        });
                }
            }
        }
    }

    private function backfillTermForeignKeys(): void
    {
        foreach (['assignments', 'attendance_records', 'timetable_slots'] as $tableName) {
            if (! Schema::hasTable($tableName)) {
                continue;
            }

            DB::table($tableName)->orderBy('id')->chunk(200, function ($rows) use ($tableName) {
                foreach ($rows as $row) {
                    if ($row->academic_term_id ?? null) {
                        continue;
                    }

                    $termId = null;

                    if ($row->academic_semester_id ?? null) {
                        $termId = DB::table('academic_terms')
                            ->where('academic_semester_id', $row->academic_semester_id)
                            ->orderBy('sort_order')
                            ->value('id');
                    }

                    if (! $termId && ($row->academic_year_id ?? null)) {
                        $termId = DB::table('academic_terms')
                            ->where('academic_year_id', $row->academic_year_id)
                            ->where('is_current', true)
                            ->value('id')
                            ?? DB::table('academic_terms')
                                ->where('academic_year_id', $row->academic_year_id)
                                ->orderBy('sort_order')
                                ->value('id');
                    }

                    if ($termId) {
                        DB::table($tableName)->where('id', $row->id)->update(['academic_term_id' => $termId]);
                    }
                }
            });
        }
    }

    private function resolveLegacyTermName(?string $term, ?int $legacySemesterId): string
    {
        if ($term && in_array($term, ['Term 1', 'Term 2', 'Term 3', 'Term 4'], true)) {
            return $term;
        }

        if ($legacySemesterId) {
            $legacyName = DB::table('academic_semesters')->where('id', $legacySemesterId)->value('name');
            if ($legacyName && in_array($legacyName, ['Term 1', 'Term 2', 'Term 3', 'Term 4'], true)) {
                return $legacyName;
            }
        }

        return 'Term 1';
    }

    /**
     * @param  array<string, int>  $semesterIds
     */
    private function semesterIdForTerm(string $termName, array $semesterIds): ?int
    {
        return in_array($termName, ['Term 1', 'Term 2'], true)
            ? ($semesterIds['Semester 1'] ?? null)
            : ($semesterIds['Semester 2'] ?? null);
    }
};
