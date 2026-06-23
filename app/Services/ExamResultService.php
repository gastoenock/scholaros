<?php

namespace App\Services;

use App\Models\Exam;
use App\Models\ExamResult;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Support\SimpleXlsx;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExamResultService
{
    public const HEADERS = ['student_id', 'student_name', 'score', 'grade', 'remarks'];

    public function canManageResults(?Authenticatable $user): bool
    {
        if (! $user) {
            return false;
        }

        if (method_exists($user, 'isPlatformAdmin') && $user->isPlatformAdmin()) {
            return true;
        }

        if (! ($user->is_active ?? true)) {
            return false;
        }

        return in_array($user->role ?? null, ['admin', 'teacher', 'admin_staff'], true);
    }

    public function assertCanManageResults(?Authenticatable $user): void
    {
        abort_unless($this->canManageResults($user), 403, 'You are not allowed to upload exam results.');
    }

    public function studentsForExam(Exam $exam): Collection
    {
        $class = SchoolClass::query()->find($exam->class_id);

        if (! $class) {
            return collect();
        }

        return Student::query()
            ->where('school_id', $exam->school_id)
            ->when($class->school_branch_id, fn ($query) => $query->where('school_branch_id', $class->school_branch_id))
            ->where('grade_level', $class->grade_level)
            ->when($class->section, fn ($query) => $query->where('class_section', $class->section))
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get();
    }

    public function studentsWithoutResultsForExam(Exam $exam): Collection
    {
        $uploadedStudentIds = ExamResult::query()
            ->where('exam_id', $exam->id)
            ->pluck('student_id');

        return $this->studentsForExam($exam)
            ->reject(fn (Student $student) => $uploadedStudentIds->contains($student->id))
            ->values();
    }

    public function downloadTemplate(Exam $exam): StreamedResponse
    {
        $rows = [self::HEADERS];

        foreach ($this->studentsWithoutResultsForExam($exam) as $student) {
            $rows[] = [
                $student->student_id,
                trim("{$student->first_name} {$student->last_name}"),
                '',
                '',
                '',
            ];
        }

        $filename = str($exam->title)->slug().'-results-template.xlsx';

        return response()->streamDownload(function () use ($rows) {
            echo SimpleXlsx::write($rows);
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    /**
     * @param  array{studentId?: int, studentNumber?: string, score: float|int, grade?: ?string, remarks?: ?string}  $payload
     */
    public function saveSingle(Exam $exam, array $payload): ExamResult
    {
        $student = $this->resolveStudent($exam, $payload);

        return $this->upsertResult(
            $exam,
            $student,
            (float) $payload['score'],
            $payload['grade'] ?? null,
            $payload['remarks'] ?? null,
        );
    }

    /**
     * @return array{imported: int, skipped: int}
     */
    public function importSpreadsheet(Exam $exam, UploadedFile $file): array
    {
        $rows = SimpleXlsx::read($file->getRealPath());

        if ($rows === []) {
            throw ValidationException::withMessages([
                'file' => 'The uploaded file is empty or could not be read.',
            ]);
        }

        $headerRow = array_map(fn ($value) => strtolower(trim((string) $value)), $rows[0]);
        $columnMap = $this->mapColumns($headerRow);

        $imported = 0;
        $skipped = 0;

        foreach (array_slice($rows, 1) as $index => $row) {
            $studentNumber = trim((string) ($row[$columnMap['student_id']] ?? ''));
            $scoreRaw = trim((string) ($row[$columnMap['score']] ?? ''));

            if ($studentNumber === '' && $scoreRaw === '') {
                $skipped++;

                continue;
            }

            if ($studentNumber === '' || $scoreRaw === '') {
                throw ValidationException::withMessages([
                    'file' => 'Row '.($index + 2).' is missing student_id or score.',
                ]);
            }

            if (! is_numeric($scoreRaw)) {
                throw ValidationException::withMessages([
                    'file' => 'Row '.($index + 2).' has an invalid score.',
                ]);
            }

            $score = (float) $scoreRaw;

            if ($score < 0 || $score > (float) $exam->max_score) {
                throw ValidationException::withMessages([
                    'file' => 'Row '.($index + 2).' score must be between 0 and '.$exam->max_score.'.',
                ]);
            }

            $student = Student::query()
                ->where('school_id', $exam->school_id)
                ->where('student_id', $studentNumber)
                ->first();

            if (! $student) {
                throw ValidationException::withMessages([
                    'file' => 'Row '.($index + 2).' references unknown student ID "'.$studentNumber.'".',
                ]);
            }

            $grade = trim((string) ($row[$columnMap['grade']] ?? ''));
            $remarks = trim((string) ($row[$columnMap['remarks']] ?? ''));

            $this->upsertResult(
                $exam,
                $student,
                $score,
                $grade !== '' ? $grade : null,
                $remarks !== '' ? $remarks : null,
            );

            $imported++;
        }

        return compact('imported', 'skipped');
    }

    /**
     * @param  array<int, array{studentId: int, score: float|int, grade?: ?string, remarks?: ?string}>  $rows
     */
    public function saveBulk(Exam $exam, array $rows): int
    {
        $saved = 0;

        foreach ($rows as $row) {
            $student = Student::query()
                ->where('school_id', $exam->school_id)
                ->where('id', $row['studentId'])
                ->first();

            if (! $student) {
                continue;
            }

            $this->upsertResult(
                $exam,
                $student,
                (float) $row['score'],
                $row['grade'] ?? null,
                $row['remarks'] ?? null,
            );

            $saved++;
        }

        return $saved;
    }

    public function upsertResult(Exam $exam, Student $student, float $score, ?string $grade, ?string $remarks): ExamResult
    {
        if ($score < 0 || $score > (float) $exam->max_score) {
            throw ValidationException::withMessages([
                'score' => 'Score must be between 0 and '.$exam->max_score.'.',
            ]);
        }

        return ExamResult::updateOrCreate(
            [
                'exam_id' => $exam->id,
                'student_id' => $student->id,
            ],
            [
                'school_id' => $exam->school_id,
                'score' => $score,
                'grade' => $grade ?: $this->letterGrade($score, (float) $exam->max_score),
                'remarks' => $remarks,
            ]
        );
    }

    public function letterGrade(float $score, float $maxScore): string
    {
        if ($maxScore <= 0) {
            return 'F';
        }

        $pct = ($score / $maxScore) * 100;

        return match (true) {
            $pct >= 90 => 'A+',
            $pct >= 80 => 'A',
            $pct >= 70 => 'B',
            $pct >= 60 => 'C',
            $pct >= 50 => 'D',
            default => 'F',
        };
    }

    /**
     * @param  array{studentId?: int, studentNumber?: string, score: float|int, grade?: ?string, remarks?: ?string}  $payload
     */
    private function resolveStudent(Exam $exam, array $payload): Student
    {
        $query = Student::query()->where('school_id', $exam->school_id);

        if (! empty($payload['studentId'])) {
            $student = (clone $query)->where('id', $payload['studentId'])->first();
        } else {
            $student = (clone $query)->where('student_id', $payload['studentNumber'] ?? '')->first();
        }

        if (! $student) {
            throw ValidationException::withMessages([
                'studentId' => 'Student not found for this school.',
            ]);
        }

        return $student;
    }

    /**
     * @param  array<int, string>  $headerRow
     * @return array{student_id: int, score: int, grade: int, remarks: int}
     */
    private function mapColumns(array $headerRow): array
    {
        $map = [
            'student_id' => array_search('student_id', $headerRow, true),
            'score' => array_search('score', $headerRow, true),
            'grade' => array_search('grade', $headerRow, true),
            'remarks' => array_search('remarks', $headerRow, true),
        ];

        if ($map['student_id'] === false || $map['score'] === false) {
            throw ValidationException::withMessages([
                'file' => 'Template must include student_id and score columns.',
            ]);
        }

        if ($map['grade'] === false) {
            $map['grade'] = 3;
        }

        if ($map['remarks'] === false) {
            $map['remarks'] = 4;
        }

        return $map;
    }
}
