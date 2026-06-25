<?php

namespace Database\Seeders\Concerns;

use App\Models\Exam;
use App\Models\ExamResult;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Subject;
use App\Services\AcademicCalendarService;
use App\Services\ExamResultService;
use Illuminate\Support\Collection;

trait SeedsExaminationResults
{
    /**
     * @return array{exams: int, results: int, classes: int, subjects: int}
     */
    protected function seedExaminationResults(
        int $schoolId,
        ?int $yearId = null,
        ?int $semesterId = null,
        ?int $termId = null,
    ): array {
        $calendar = app(AcademicCalendarService::class);
        $grades = app(ExamResultService::class);

        $year = $calendar->resolveYear($schoolId, $yearId);
        $year->load(['semesters.terms']);
        $semesterId ??= $year->semesters->first()?->id;
        $termId ??= $year->semesters->flatMap->terms->first()?->id;

        $classes = SchoolClass::forSchool($schoolId)->with('assignedRoom')->get();
        $allSubjects = Subject::forSchool($schoolId)->get();

        $examCount = 0;
        $resultCount = 0;

        foreach ($classes as $class) {
            $subjects = $this->subjectsForClassSeeding($class, $allSubjects);

            if ($subjects->isEmpty()) {
                continue;
            }

            $students = $this->studentsForClassSeeding($schoolId, $class);

            foreach ($subjects as $index => $subject) {
                $exam = Exam::updateOrCreate(
                    [
                        'school_id' => $schoolId,
                        'class_id' => $class->id,
                        'subject_id' => $subject->id,
                        'academic_year_id' => $year->id,
                        'academic_term_id' => $termId,
                    ],
                    [
                        'title' => "{$subject->name} Mid-Term Examination",
                        'exam_date' => sprintf('2026-06-%02d', min(28, 10 + $index)),
                        'start_time' => '09:00',
                        'end_time' => '11:00',
                        'max_score' => 100,
                        'passing_score' => 50,
                        'term' => $year->semesters->flatMap->terms->firstWhere('id', $termId)?->name ?? 'Term 1',
                        'academic_year' => $year->name,
                        'academic_semester_id' => $semesterId,
                        'venue' => $class->assignedRoom?->display_name ?? $class->room ?? 'Exam Hall',
                    ],
                );

                if ($exam->wasRecentlyCreated) {
                    $examCount++;
                }

                foreach ($students as $student) {
                    $score = $this->seedScoreForStudent($student->id, $subject->id, $class->id);
                    $result = ExamResult::firstOrCreate(
                        [
                            'exam_id' => $exam->id,
                            'student_id' => $student->id,
                        ],
                        [
                            'school_id' => $schoolId,
                            'score' => $score,
                            'grade' => $grades->letterGrade($score, 100),
                            'remarks' => $score >= 50 ? null : 'Needs improvement',
                        ],
                    );

                    if ($result->wasRecentlyCreated) {
                        $resultCount++;
                    }
                }
            }
        }

        return [
            'exams' => $examCount,
            'results' => $resultCount,
            'classes' => $classes->count(),
            'subjects' => $allSubjects->count(),
        ];
    }

    /**
     * Every class undertakes the full subject catalog; each student in the
     * class receives results for every available subject.
     *
     * @param  Collection<int, Subject>  $allSubjects
     * @return Collection<int, Subject>
     */
    private function subjectsForClassSeeding(SchoolClass $class, Collection $allSubjects): Collection
    {
        if ($allSubjects->isEmpty()) {
            return collect();
        }

        $class->subjects()->sync($allSubjects->pluck('id'));

        return $allSubjects->values();
    }

    private function studentsForClassSeeding(int $schoolId, SchoolClass $class): Collection
    {
        return Student::forSchool($schoolId)
            ->where('class_id', $class->id)
            ->where('status', 'active')
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get();
    }

    private function seedScoreForStudent(int $studentId, int $subjectId, int $classId): float
    {
        $hash = crc32("{$studentId}:{$subjectId}:{$classId}");

        return 45 + ($hash % 51);
    }
}
