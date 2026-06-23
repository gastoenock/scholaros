<?php

namespace App\Services;

use App\Models\Exam;
use App\Models\ExamResult;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Subject;
use Illuminate\Support\Collection;

class AcademicReportService
{
    public function __construct(
        private AcademicCalendarService $calendar,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function studentReport(int $schoolId, int $studentId, ?int $yearId = null, ?int $semesterId = null, ?int $termId = null): array
    {
        $student = Student::forSchool($schoolId)->findOrFail($studentId);
        $year = $this->calendar->resolveYear($schoolId, $yearId);

        $exams = $this->examQuery($schoolId, $year->id, $semesterId, $termId)
            ->with(['subject', 'schoolClass', 'academicTerm', 'academicSemester', 'results' => fn ($q) => $q->where('student_id', $student->id)])
            ->get();

        $rows = $exams->map(function (Exam $exam) {
            $result = $exam->results->first();

            return [
                'examId' => $exam->id,
                'title' => $exam->title,
                'subject' => $exam->subject?->name,
                'className' => $exam->schoolClass?->name,
                'term' => $exam->academicTerm?->name ?? $exam->term,
                'semester' => $exam->academicSemester?->name,
                'examDate' => $exam->exam_date,
                'maxScore' => $exam->max_score,
                'passingScore' => $exam->passing_score,
                'score' => $result?->score,
                'grade' => $result?->grade,
                'remarks' => $result?->remarks,
                'passed' => $result ? $result->score >= ($exam->passing_score ?? 50) : null,
            ];
        })->values();

        $scored = $rows->filter(fn ($row) => $row['score'] !== null);

        return [
            'type' => 'student',
            'period' => $this->periodLabel($year->name, $semesterId, $termId),
            'student' => [
                'id' => $student->id,
                'studentId' => $student->student_id,
                'name' => trim("{$student->first_name} {$student->last_name}"),
                'gradeLevel' => $student->grade_level,
                'classSection' => $student->class_section,
            ],
            'rows' => $rows,
            'summary' => [
                'examsTaken' => $scored->count(),
                'averageScore' => $scored->count() ? round($scored->avg('score'), 1) : null,
                'passed' => $scored->where('passed', true)->count(),
                'failed' => $scored->where('passed', false)->count(),
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function classReport(int $schoolId, int $classId, ?int $yearId = null, ?int $semesterId = null, ?int $termId = null): array
    {
        $class = SchoolClass::forSchool($schoolId)->findOrFail($classId);
        $year = $this->calendar->resolveYear($schoolId, $yearId);

        $students = Student::forSchool($schoolId)
            ->when($class->school_branch_id, fn ($q) => $q->where('school_branch_id', $class->school_branch_id))
            ->where('grade_level', $class->grade_level)
            ->when($class->section, fn ($q) => $q->where('class_section', $class->section))
            ->orderBy('last_name')
            ->get();

        $exams = $this->examQuery($schoolId, $year->id, $semesterId, $termId)
            ->where('class_id', $class->id)
            ->with(['subject', 'results'])
            ->get();

        $studentRows = $students->map(function (Student $student) use ($exams) {
            $results = $exams->map(function (Exam $exam) use ($student) {
                $result = $exam->results->firstWhere('student_id', $student->id);

                return [
                    'examId' => $exam->id,
                    'examTitle' => $exam->title,
                    'subject' => $exam->subject?->name,
                    'score' => $result?->score,
                    'grade' => $result?->grade,
                    'maxScore' => $exam->max_score,
                ];
            });

            $scored = $results->filter(fn ($r) => $r['score'] !== null);

            return [
                'studentId' => $student->id,
                'studentNumber' => $student->student_id,
                'name' => trim("{$student->first_name} {$student->last_name}"),
                'results' => $results->values(),
                'averageScore' => $scored->count() ? round($scored->avg('score'), 1) : null,
                'examsTaken' => $scored->count(),
            ];
        })->values();

        return [
            'type' => 'class',
            'period' => $this->periodLabel($year->name, $semesterId, $termId),
            'class' => [
                'id' => $class->id,
                'name' => $class->name,
                'gradeLevel' => $class->grade_level,
                'section' => $class->section,
            ],
            'exams' => $exams->map(fn (Exam $exam) => [
                'id' => $exam->id,
                'title' => $exam->title,
                'subject' => $exam->subject?->name,
                'maxScore' => $exam->max_score,
            ])->values(),
            'students' => $studentRows,
            'summary' => [
                'studentCount' => $students->count(),
                'examCount' => $exams->count(),
                'classAverage' => $this->averageFromStudentRows($studentRows),
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function subjectExamReport(int $schoolId, int $subjectId, ?int $yearId = null, ?int $semesterId = null, ?int $termId = null, ?int $examId = null): array
    {
        $subject = Subject::forSchool($schoolId)->findOrFail($subjectId);
        $year = $this->calendar->resolveYear($schoolId, $yearId);

        $exams = $this->examQuery($schoolId, $year->id, $semesterId, $termId)
            ->where('subject_id', $subject->id)
            ->when($examId, fn ($q) => $q->where('id', $examId))
            ->with(['schoolClass', 'academicTerm', 'results.student'])
            ->get();

        $examRows = $exams->map(function (Exam $exam) {
            $results = $exam->results->map(fn (ExamResult $result) => [
                'studentId' => $result->student_id,
                'studentNumber' => $result->student?->student_id,
                'studentName' => trim("{$result->student?->first_name} {$result->student?->last_name}"),
                'score' => $result->score,
                'grade' => $result->grade,
                'remarks' => $result->remarks,
                'passed' => $result->score >= ($exam->passing_score ?? 50),
            ])->values();

            return [
                'examId' => $exam->id,
                'title' => $exam->title,
                'className' => $exam->schoolClass?->name,
                'term' => $exam->academicTerm?->name ?? $exam->term,
                'examDate' => $exam->exam_date,
                'maxScore' => $exam->max_score,
                'passingScore' => $exam->passing_score,
                'results' => $results,
                'summary' => [
                    'candidates' => $results->count(),
                    'averageScore' => $results->count() ? round($results->avg('score'), 1) : null,
                    'passRate' => $results->count()
                        ? round($results->where('passed', true)->count() / $results->count() * 100, 1)
                        : null,
                    'highestScore' => $results->max('score'),
                    'lowestScore' => $results->min('score'),
                ],
            ];
        })->values();

        return [
            'type' => 'subject',
            'period' => $this->periodLabel($year->name, $semesterId, $termId),
            'subject' => [
                'id' => $subject->id,
                'name' => $subject->name,
                'code' => $subject->code,
            ],
            'exams' => $examRows,
            'summary' => [
                'examCount' => $examRows->count(),
                'totalResults' => $examRows->sum(fn ($row) => count($row['results'])),
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function overallExamsReport(int $schoolId, ?int $yearId = null, ?int $semesterId = null, ?int $termId = null): array
    {
        $year = $this->calendar->resolveYear($schoolId, $yearId);

        $exams = $this->examQuery($schoolId, $year->id, $semesterId, $termId)
            ->with(['subject', 'schoolClass', 'academicTerm', 'academicSemester', 'results'])
            ->get();

        $allResults = $exams->flatMap(fn (Exam $exam) => $exam->results);

        $byClass = $exams->groupBy('class_id')->map(function (Collection $classExams, $classId) {
            $class = $classExams->first()->schoolClass;
            $results = $classExams->flatMap(fn (Exam $e) => $e->results);

            return [
                'classId' => (int) $classId,
                'className' => $class?->name ?? 'Unknown',
                'examCount' => $classExams->count(),
                'resultsCount' => $results->count(),
                'averageScore' => $results->count() ? round($results->avg('score'), 1) : null,
            ];
        })->values();

        $bySubject = $exams->groupBy('subject_id')->map(function (Collection $subjectExams, $subjectId) {
            $subject = $subjectExams->first()->subject;
            $results = $subjectExams->flatMap(fn (Exam $e) => $e->results);

            return [
                'subjectId' => (int) $subjectId,
                'subjectName' => $subject?->name ?? 'Unknown',
                'examCount' => $subjectExams->count(),
                'resultsCount' => $results->count(),
                'averageScore' => $results->count() ? round($results->avg('score'), 1) : null,
            ];
        })->values();

        $byTerm = $exams->groupBy(fn (Exam $exam) => $exam->academic_term_id ?? $exam->term)->map(function (Collection $termExams) {
            $first = $termExams->first();
            $results = $termExams->flatMap(fn (Exam $e) => $e->results);

            return [
                'term' => $first->academicTerm?->name ?? $first->term ?? 'Unassigned',
                'semester' => $first->academicSemester?->name,
                'examCount' => $termExams->count(),
                'resultsCount' => $results->count(),
                'averageScore' => $results->count() ? round($results->avg('score'), 1) : null,
            ];
        })->values();

        return [
            'type' => 'overall',
            'period' => $this->periodLabel($year->name, $semesterId, $termId),
            'summary' => [
                'totalExams' => $exams->count(),
                'totalResults' => $allResults->count(),
                'schoolAverage' => $allResults->count() ? round($allResults->avg('score'), 1) : null,
                'passRate' => $allResults->count()
                    ? round($allResults->filter(fn ($r) => $r->score >= 50)->count() / $allResults->count() * 100, 1)
                    : null,
            ],
            'byClass' => $byClass,
            'bySubject' => $bySubject,
            'byTerm' => $byTerm,
        ];
    }

    private function examQuery(int $schoolId, int $yearId, ?int $semesterId, ?int $termId)
    {
        return Exam::forSchool($schoolId)
            ->where('academic_year_id', $yearId)
            ->when($semesterId, fn ($q) => $q->where('academic_semester_id', $semesterId))
            ->when($termId, fn ($q) => $q->where('academic_term_id', $termId))
            ->orderBy('exam_date');
    }

    private function periodLabel(string $yearName, ?int $semesterId, ?int $termId): array
    {
        $semester = $semesterId ? \App\Models\AcademicSemester::find($semesterId) : null;
        $term = $termId ? \App\Models\AcademicTerm::find($termId) : null;

        return [
            'year' => $yearName,
            'semester' => $semester?->name,
            'term' => $term?->name,
            'label' => collect([$yearName, $semester?->name, $term?->name])->filter()->implode(' · '),
        ];
    }

    private function averageFromStudentRows(Collection $studentRows): ?float
    {
        $averages = $studentRows
            ->pluck('averageScore')
            ->filter(fn ($avg) => $avg !== null);

        return $averages->count() ? round($averages->avg(), 1) : null;
    }
}
