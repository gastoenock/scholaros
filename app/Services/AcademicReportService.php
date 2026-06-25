<?php

namespace App\Services;

use App\Models\Exam;
use App\Models\ExamResult;
use App\Models\SchoolClass;
use App\Models\Staff;
use App\Models\Student;
use App\Models\StudentReportComment;
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
        $schoolClass = $this->resolveStudentClass($schoolId, $student);
        $subjects = $this->subjectsForClass($schoolId, $schoolClass, $year->id);

        $examQuery = $this->examQuery($schoolId, $year->id, $semesterId, $termId);
        if ($schoolClass) {
            $examQuery->where('class_id', $schoolClass->id);
        }

        $examsBySubject = $examQuery
            ->with(['subject', 'schoolClass', 'academicTerm', 'academicSemester', 'results' => fn ($q) => $q->where('student_id', $student->id)])
            ->get()
            ->groupBy('subject_id');

        $rows = $subjects->map(function (Subject $subject) use ($examsBySubject, $schoolClass) {
            $subjectExams = $examsBySubject->get($subject->id, collect());
            $scoredResults = $subjectExams->flatMap(fn (Exam $exam) => $exam->results);

            $avgScore = $scoredResults->count() ? round($scoredResults->avg('score'), 1) : null;
            $latestExam = $subjectExams->sortByDesc('exam_date')->first();
            $latestResult = $latestExam?->results->first();
            $firstExam = $subjectExams->first();
            $passingScore = $firstExam?->passing_score ?? 50;

            return [
                'subjectId' => $subject->id,
                'examId' => $firstExam?->id,
                'title' => $subjectExams->count() === 1
                    ? $firstExam?->title
                    : ($subjectExams->count() > 1 ? "{$subjectExams->count()} exams" : null),
                'subject' => $subject->name,
                'className' => $schoolClass?->name,
                'term' => $firstExam?->academicTerm?->name ?? $firstExam?->term,
                'semester' => $firstExam?->academicSemester?->name,
                'examDate' => $firstExam?->exam_date,
                'maxScore' => $firstExam?->max_score,
                'passingScore' => $passingScore,
                'score' => $avgScore,
                'grade' => $latestResult?->grade,
                'remarks' => $latestResult?->remarks,
                'passed' => $avgScore !== null ? $avgScore >= $passingScore : null,
                'hasExam' => $subjectExams->isNotEmpty(),
            ];
        })->values();

        $scored = $rows->filter(fn ($row) => $row['score'] !== null);

        $comment = StudentReportComment::query()
            ->where('student_id', $student->id)
            ->where('academic_year_id', $year->id)
            ->when($semesterId, fn ($q) => $q->where('academic_semester_id', $semesterId), fn ($q) => $q->whereNull('academic_semester_id'))
            ->when($termId, fn ($q) => $q->where('academic_term_id', $termId), fn ($q) => $q->whereNull('academic_term_id'))
            ->first();

        $classTeacher = $schoolClass?->classTeacher ?? ($schoolClass?->class_teacher_id ? Staff::find($schoolClass->class_teacher_id) : null);

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
            'class' => $schoolClass ? [
                'id' => $schoolClass->id,
                'name' => $schoolClass->name,
                'gradeLevel' => $schoolClass->grade_level,
                'section' => $schoolClass->section,
            ] : null,
            'classTeacher' => $classTeacher ? [
                'id' => $classTeacher->id,
                'name' => trim("{$classTeacher->first_name} {$classTeacher->last_name}"),
            ] : null,
            'classTeacherComment' => $comment?->comment,
            'rows' => $rows,
            'summary' => [
                'subjectsTotal' => $rows->count(),
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
        $subjects = $this->subjectsForClass($schoolId, $class, $year->id);

        $students = Student::forSchool($schoolId)
            ->when($class->school_branch_id, fn ($q) => $q->where('school_branch_id', $class->school_branch_id))
            ->where('class_id', $class->id)
            ->orderBy('last_name')
            ->get();

        $exams = $this->examQuery($schoolId, $year->id, $semesterId, $termId)
            ->where('class_id', $class->id)
            ->with(['subject', 'results'])
            ->get()
            ->groupBy('subject_id');

        $subjectColumns = $subjects->map(fn (Subject $subject) => [
            'id' => $subject->id,
            'name' => $subject->name,
            'code' => $subject->code,
        ])->values();

        $studentRows = $students->map(function (Student $student) use ($subjects, $exams) {
            $subjectResults = $subjects->map(function (Subject $subject) use ($student, $exams) {
                $subjectExams = $exams->get($subject->id, collect());
                $firstExam = $subjectExams->first();
                $result = $subjectExams
                    ->flatMap(fn (Exam $exam) => $exam->results)
                    ->firstWhere('student_id', $student->id);

                return [
                    'subjectId' => $subject->id,
                    'subject' => $subject->name,
                    'score' => $result?->score,
                    'grade' => $result?->grade,
                    'maxScore' => $firstExam?->max_score,
                ];
            });

            $scored = $subjectResults->filter(fn ($row) => $row['score'] !== null);

            return [
                'studentId' => $student->id,
                'studentNumber' => $student->student_id,
                'name' => trim("{$student->first_name} {$student->last_name}"),
                'subjectResults' => $subjectResults->values(),
                'results' => $subjectResults->values(),
                'averageScore' => $scored->count() ? round($scored->avg('score'), 1) : null,
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
            'subjects' => $subjectColumns,
            'students' => $studentRows,
            'summary' => [
                'studentCount' => $students->count(),
                'subjectCount' => $subjects->count(),
                'subjects' => $subjects->pluck('name')->values()->all(),
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

        $allSubjects = Subject::forSchool($schoolId)
            ->where(function ($q) use ($year) {
                $q->where('academic_year_id', $year->id)->orWhereNull('academic_year_id');
            })
            ->orderBy('name')
            ->get();

        $examsBySubject = $exams->groupBy('subject_id');

        $bySubject = $allSubjects->map(function (Subject $subject) use ($examsBySubject) {
            $subjectExams = $examsBySubject->get($subject->id, collect());
            $results = $subjectExams->flatMap(fn (Exam $e) => $e->results);

            return [
                'subjectId' => $subject->id,
                'subjectName' => $subject->name,
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
                'totalSubjects' => $allSubjects->count(),
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

    /**
     * @return array<string, mixed>
     */
    public function saveStudentComment(
        int $schoolId,
        int $studentId,
        int $yearId,
        ?int $semesterId,
        ?int $termId,
        ?string $comment,
    ): array {
        $student = Student::forSchool($schoolId)->findOrFail($studentId);
        $schoolClass = $this->resolveStudentClass($schoolId, $student);

        StudentReportComment::updateOrCreate(
            [
                'student_id' => $student->id,
                'academic_year_id' => $yearId,
                'academic_semester_id' => $semesterId,
                'academic_term_id' => $termId,
            ],
            [
                'comment' => $comment,
                'class_teacher_id' => $schoolClass?->class_teacher_id,
            ],
        );

        return ['saved' => true];
    }

    private function resolveStudentClass(int $schoolId, Student $student): ?SchoolClass
    {
        if ($student->class_id) {
            return SchoolClass::forSchool($schoolId)->find($student->class_id);
        }

        return SchoolClass::forSchool($schoolId)
            ->when($student->school_branch_id, fn ($q) => $q->where('school_branch_id', $student->school_branch_id))
            ->where('grade_level', $student->grade_level)
            ->when($student->class_section, fn ($q) => $q->where('section', $student->class_section))
            ->first();
    }

    /**
     * @return Collection<int, Subject>
     */
    private function subjectsForClass(int $schoolId, ?SchoolClass $class, int $yearId): Collection
    {
        if ($class) {
            $class->loadMissing('subjects');

            if ($class->subjects->isNotEmpty()) {
                return $class->subjects->sortBy('name')->values();
            }

            return Subject::forSchool($schoolId)
                ->where('grade_level', $class->grade_level)
                ->where(function ($q) use ($yearId) {
                    $q->where('academic_year_id', $yearId)->orWhereNull('academic_year_id');
                })
                ->orderBy('name')
                ->get();
        }

        return Subject::forSchool($schoolId)
            ->where(function ($q) use ($yearId) {
                $q->where('academic_year_id', $yearId)->orWhereNull('academic_year_id');
            })
            ->orderBy('name')
            ->get();
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
