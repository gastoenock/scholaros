<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** @var list<string> */
    private array $defaultTerms = ['Term 1', 'Term 2', 'Term 3'];

    public function up(): void
    {
        $this->addForeignKeyColumns();
        $this->seedCalendarFromExistingData();
        $this->backfillForeignKeys();
    }

    public function down(): void
    {
        $tables = [
            'students' => ['academic_year_id'],
            'classes' => ['academic_year_id'],
            'subjects' => ['academic_year_id', 'academic_semester_id'],
            'exams' => ['academic_year_id', 'academic_semester_id'],
            'timetable_slots' => ['academic_year_id', 'academic_semester_id'],
            'attendance_records' => ['academic_year_id', 'academic_semester_id'],
            'admissions' => ['academic_year_id', 'academic_semester_id'],
            'assignments' => ['academic_year_id', 'academic_semester_id'],
        ];

        foreach ($tables as $table => $columns) {
            if (! Schema::hasTable($table)) {
                continue;
            }

            Schema::table($table, function (Blueprint $blueprint) use ($columns) {
                foreach ($columns as $column) {
                    if (Schema::hasColumn($blueprint->getTable(), $column)) {
                        $blueprint->dropConstrainedForeignId($column);
                    }
                }
            });
        }
    }

    private function addForeignKeyColumns(): void
    {
        Schema::table('classes', function (Blueprint $table) {
            if (! Schema::hasColumn('classes', 'academic_year_id')) {
                $table->foreignId('academic_year_id')->nullable()->after('academic_year')->constrained('academic_years')->nullOnDelete();
            }
        });

        Schema::table('students', function (Blueprint $table) {
            if (! Schema::hasColumn('students', 'academic_year_id')) {
                $table->foreignId('academic_year_id')->nullable()->after('academic_year')->constrained('academic_years')->nullOnDelete();
            }
        });

        Schema::table('subjects', function (Blueprint $table) {
            if (! Schema::hasColumn('subjects', 'academic_year_id')) {
                $table->foreignId('academic_year_id')->nullable()->after('school_id')->constrained('academic_years')->nullOnDelete();
            }
            if (! Schema::hasColumn('subjects', 'academic_semester_id')) {
                $table->foreignId('academic_semester_id')->nullable()->after('academic_year_id')->constrained('academic_semesters')->nullOnDelete();
            }
        });

        Schema::table('exams', function (Blueprint $table) {
            if (! Schema::hasColumn('exams', 'academic_year_id')) {
                $table->foreignId('academic_year_id')->nullable()->after('academic_year')->constrained('academic_years')->nullOnDelete();
            }
            if (! Schema::hasColumn('exams', 'academic_semester_id')) {
                $table->foreignId('academic_semester_id')->nullable()->after('academic_year_id')->constrained('academic_semesters')->nullOnDelete();
            }
        });

        Schema::table('timetable_slots', function (Blueprint $table) {
            if (! Schema::hasColumn('timetable_slots', 'academic_year_id')) {
                $table->foreignId('academic_year_id')->nullable()->after('academic_year')->constrained('academic_years')->nullOnDelete();
            }
            if (! Schema::hasColumn('timetable_slots', 'academic_semester_id')) {
                $table->foreignId('academic_semester_id')->nullable()->after('academic_year_id')->constrained('academic_semesters')->nullOnDelete();
            }
        });

        Schema::table('attendance_records', function (Blueprint $table) {
            if (! Schema::hasColumn('attendance_records', 'academic_year_id')) {
                $table->foreignId('academic_year_id')->nullable()->after('date')->constrained('academic_years')->nullOnDelete();
            }
            if (! Schema::hasColumn('attendance_records', 'academic_semester_id')) {
                $table->foreignId('academic_semester_id')->nullable()->after('academic_year_id')->constrained('academic_semesters')->nullOnDelete();
            }
        });

        Schema::table('admissions', function (Blueprint $table) {
            if (! Schema::hasColumn('admissions', 'academic_year_id')) {
                $table->foreignId('academic_year_id')->nullable()->after('academic_year')->constrained('academic_years')->nullOnDelete();
            }
            if (! Schema::hasColumn('admissions', 'academic_semester_id')) {
                $table->foreignId('academic_semester_id')->nullable()->after('academic_year_id')->constrained('academic_semesters')->nullOnDelete();
            }
        });

        Schema::table('assignments', function (Blueprint $table) {
            if (! Schema::hasColumn('assignments', 'academic_year_id')) {
                $table->foreignId('academic_year_id')->nullable()->after('school_id')->constrained('academic_years')->nullOnDelete();
            }
            if (! Schema::hasColumn('assignments', 'academic_semester_id')) {
                $table->foreignId('academic_semester_id')->nullable()->after('academic_year_id')->constrained('academic_semesters')->nullOnDelete();
            }
        });
    }

    private function seedCalendarFromExistingData(): void
    {
        $schoolIds = collect();

        foreach (['classes', 'students', 'exams', 'timetable_slots', 'admissions'] as $table) {
            if (! Schema::hasTable($table)) {
                continue;
            }

            $schoolIds = $schoolIds->merge(
                DB::table($table)->distinct()->pluck('school_id')
            );
        }

        foreach ($schoolIds->filter()->unique() as $schoolId) {
            $yearNames = collect();

            foreach (['classes', 'students', 'exams', 'timetable_slots', 'admissions'] as $table) {
                if (! Schema::hasTable($table) || ! Schema::hasColumn($table, 'academic_year')) {
                    continue;
                }

                $yearNames = $yearNames->merge(
                    DB::table($table)
                        ->where('school_id', $schoolId)
                        ->whereNotNull('academic_year')
                        ->where('academic_year', '!=', '')
                        ->distinct()
                        ->pluck('academic_year')
                );
            }

            if ($yearNames->isEmpty()) {
                $year = (int) date('Y');
                $yearNames->push($year.'-'.($year + 1));
            }

            foreach ($yearNames->filter()->unique()->sort()->values() as $index => $name) {
                $existingYearId = DB::table('academic_years')
                    ->where('school_id', $schoolId)
                    ->where('name', $name)
                    ->value('id');

                if ($existingYearId) {
                    $yearId = (int) $existingYearId;
                } else {
                    $yearId = (int) DB::table('academic_years')->insertGetId([
                        'school_id' => $schoolId,
                        'name' => $name,
                        'is_current' => $index === $yearNames->count() - 1,
                        'sort_order' => $index + 1,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                foreach ($this->defaultTerms as $termIndex => $termName) {
                    $exists = DB::table('academic_semesters')
                        ->where('school_id', $schoolId)
                        ->where('academic_year_id', $yearId)
                        ->where('name', $termName)
                        ->exists();

                    if ($exists) {
                        continue;
                    }

                    DB::table('academic_semesters')->insert([
                        'school_id' => $schoolId,
                        'academic_year_id' => $yearId,
                        'name' => $termName,
                        'is_current' => $termIndex === 0 && $index === $yearNames->count() - 1,
                        'sort_order' => $termIndex + 1,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }
    }

    private function backfillForeignKeys(): void
    {
        if (Schema::hasTable('classes')) {
            DB::table('classes')->orderBy('id')->chunk(200, function ($rows) {
                foreach ($rows as $row) {
                    $yearId = $this->resolveYearId((int) $row->school_id, $row->academic_year);
                    if ($yearId) {
                        DB::table('classes')->where('id', $row->id)->update(['academic_year_id' => $yearId]);
                    }
                }
            });
        }

        if (Schema::hasTable('students')) {
            DB::table('students')->orderBy('id')->chunk(200, function ($rows) {
                foreach ($rows as $row) {
                    if (! $row->academic_year) {
                        continue;
                    }

                    $yearId = $this->resolveYearId((int) $row->school_id, $row->academic_year);
                    if ($yearId) {
                        DB::table('students')->where('id', $row->id)->update(['academic_year_id' => $yearId]);
                    }
                }
            });
        }

        if (Schema::hasTable('subjects')) {
            DB::table('subjects')->orderBy('id')->chunk(200, function ($rows) {
                foreach ($rows as $row) {
                    $yearId = $this->resolveYearId((int) $row->school_id, $this->defaultYearName((int) $row->school_id));
                    if ($yearId) {
                        DB::table('subjects')->where('id', $row->id)->update(['academic_year_id' => $yearId]);
                    }
                }
            });
        }

        if (Schema::hasTable('exams')) {
            DB::table('exams')->orderBy('id')->chunk(200, function ($rows) {
                foreach ($rows as $row) {
                    $yearId = $this->resolveYearId((int) $row->school_id, $row->academic_year);
                    $semesterId = $yearId
                        ? $this->resolveSemesterId((int) $row->school_id, $yearId, $row->term ?? 'Term 1')
                        : null;

                    if ($yearId) {
                        DB::table('exams')->where('id', $row->id)->update([
                            'academic_year_id' => $yearId,
                            'academic_semester_id' => $semesterId,
                        ]);
                    }
                }
            });
        }

        if (Schema::hasTable('timetable_slots')) {
            DB::table('timetable_slots')->orderBy('id')->chunk(200, function ($rows) {
                foreach ($rows as $row) {
                    $yearId = $this->resolveYearId((int) $row->school_id, $row->academic_year);
                    $semesterId = $yearId
                        ? $this->resolveSemesterId((int) $row->school_id, $yearId, 'Term 1')
                        : null;

                    if ($yearId) {
                        DB::table('timetable_slots')->where('id', $row->id)->update([
                            'academic_year_id' => $yearId,
                            'academic_semester_id' => $semesterId,
                        ]);
                    }
                }
            });
        }

        if (Schema::hasTable('admissions')) {
            DB::table('admissions')->orderBy('id')->chunk(200, function ($rows) {
                foreach ($rows as $row) {
                    $yearId = $this->resolveYearId((int) $row->school_id, $row->academic_year);

                    if ($yearId) {
                        DB::table('admissions')->where('id', $row->id)->update(['academic_year_id' => $yearId]);
                    }
                }
            });
        }

        if (Schema::hasTable('assignments')) {
            DB::table('assignments')->orderBy('id')->chunk(200, function ($rows) {
                foreach ($rows as $row) {
                    $yearId = $this->resolveYearId((int) $row->school_id, $this->defaultYearName((int) $row->school_id));
                    $semesterId = $yearId
                        ? $this->resolveSemesterId((int) $row->school_id, $yearId, 'Term 1')
                        : null;

                    if ($yearId) {
                        DB::table('assignments')->where('id', $row->id)->update([
                            'academic_year_id' => $yearId,
                            'academic_semester_id' => $semesterId,
                        ]);
                    }
                }
            });
        }

        if (Schema::hasTable('attendance_records')) {
            DB::table('attendance_records')->orderBy('id')->chunk(200, function ($rows) {
                foreach ($rows as $row) {
                    $yearId = $this->resolveYearId((int) $row->school_id, $this->defaultYearName((int) $row->school_id));
                    $semesterId = $yearId
                        ? $this->resolveSemesterId((int) $row->school_id, $yearId, 'Term 1')
                        : null;

                    if ($yearId) {
                        DB::table('attendance_records')->where('id', $row->id)->update([
                            'academic_year_id' => $yearId,
                            'academic_semester_id' => $semesterId,
                        ]);
                    }
                }
            });
        }
    }

    private function resolveYearId(int $schoolId, ?string $name): ?int
    {
        if (! $name) {
            $name = $this->defaultYearName($schoolId);
        }

        $id = DB::table('academic_years')
            ->where('school_id', $schoolId)
            ->where('name', $name)
            ->value('id');

        return $id ? (int) $id : null;
    }

    private function resolveSemesterId(int $schoolId, int $yearId, ?string $name): ?int
    {
        $name = $name ?: 'Term 1';

        $id = DB::table('academic_semesters')
            ->where('school_id', $schoolId)
            ->where('academic_year_id', $yearId)
            ->where('name', $name)
            ->value('id');

        if (! $id) {
            $id = DB::table('academic_semesters')
                ->where('school_id', $schoolId)
                ->where('academic_year_id', $yearId)
                ->orderBy('sort_order')
                ->value('id');
        }

        return $id ? (int) $id : null;
    }

    private function defaultYearName(int $schoolId): string
    {
        $current = DB::table('academic_years')
            ->where('school_id', $schoolId)
            ->where('is_current', true)
            ->value('name');

        if ($current) {
            return (string) $current;
        }

        $latest = DB::table('academic_years')
            ->where('school_id', $schoolId)
            ->orderByDesc('sort_order')
            ->value('name');

        if ($latest) {
            return (string) $latest;
        }

        $year = (int) date('Y');

        return $year.'-'.($year + 1);
    }
};
