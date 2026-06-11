<?php

namespace App\Http\Controllers;

use App\Models\Assignment;
use App\Models\Exam;
use App\Models\ExamResult;
use App\Models\OnlineClass;
use App\Models\SchoolClass;
use App\Models\Staff;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Submission;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AcademicsController extends Controller
{
    public function index(): Response
    {
        $schoolId = $this->schoolId();

        if (! $schoolId) {
            return Inertia::render('dashboard/academics/page', $this->emptyPayload());
        }

        $students = Student::forSchool($schoolId)->get()->keyBy('id');
        $staff = Staff::forSchool($schoolId)->orderBy('last_name')->get();
        $classes = SchoolClass::forSchool($schoolId)->orderBy('name')->get();
        $subjects = Subject::forSchool($schoolId)->orderBy('name')->get();
        $assignments = Assignment::forSchool($schoolId)->orderByDesc('id')->get();
        $exams = Exam::forSchool($schoolId)->orderByDesc('exam_date')->get();
        $onlineClasses = OnlineClass::forSchool($schoolId)->orderByDesc('scheduled_at')->get();

        $submissions = Submission::forSchool($schoolId)->get()->map(function ($submission) use ($students) {
            $student = $students->get($submission->student_id);

            return array_merge($submission->toArray(), [
                'studentName' => $student
                    ? trim("{$student->first_name} {$student->last_name}")
                    : 'Unknown',
            ]);
        })->values();

        $examResults = ExamResult::forSchool($schoolId)->get()->map(function ($result) use ($students) {
            $student = $students->get($result->student_id);

            return array_merge($result->toArray(), [
                'studentName' => $student
                    ? trim("{$student->first_name} {$student->last_name}")
                    : 'Unknown',
                'studentId' => $student?->student_id ?? '',
            ]);
        })->values();

        return Inertia::render('dashboard/academics/page', [
            'subjects' => $subjects,
            'assignments' => $assignments,
            'exams' => $exams,
            'examResults' => $examResults,
            'onlineClasses' => $onlineClasses,
            'submissions' => $submissions,
            'classes' => $classes,
            'staff' => $staff,
            'students' => $students->values(),
            'school' => $this->school(),
        ]);
    }

    public function storeSubject(Request $request): RedirectResponse
    {
        $schoolId = $this->schoolId();
        abort_unless($schoolId, 403);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:50'],
            'gradeLevel' => ['nullable', 'string', 'max:50'],
            'teacherId' => ['nullable', 'integer', 'exists:staff,id'],
            'description' => ['nullable', 'string'],
        ]);

        Subject::create([
            ...$this->snakeKeys($validated),
            'school_id' => $schoolId,
        ]);

        return back()->with('success', 'Subject created');
    }

    public function updateSubject(Request $request, Subject $subject): RedirectResponse
    {
        abort_unless($subject->school_id === $this->schoolId(), 403);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:50'],
            'gradeLevel' => ['nullable', 'string', 'max:50'],
            'teacherId' => ['nullable', 'integer', 'exists:staff,id'],
            'description' => ['nullable', 'string'],
        ]);

        $subject->update($this->snakeKeys($validated));

        return back()->with('success', 'Subject updated');
    }

    public function destroySubject(Subject $subject): RedirectResponse
    {
        abort_unless($subject->school_id === $this->schoolId(), 403);

        $subject->delete();

        return back()->with('success', 'Subject removed');
    }

    public function storeAssignment(Request $request): RedirectResponse
    {
        $schoolId = $this->schoolId();
        abort_unless($schoolId, 403);

        $validated = $request->validate([
            'classId' => ['required', 'integer', 'exists:classes,id'],
            'subjectId' => ['required', 'integer', 'exists:subjects,id'],
            'teacherId' => ['required', 'integer', 'exists:staff,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'dueDate' => ['required', 'string'],
            'maxScore' => ['required', 'numeric'],
            'type' => ['required', 'in:homework,classwork,project,quiz'],
            'attachmentUrl' => ['nullable', 'string'],
        ]);

        Assignment::create([
            ...$this->snakeKeys($validated),
            'school_id' => $schoolId,
        ]);

        return back()->with('success', 'Assignment created');
    }

    public function updateAssignment(Request $request, Assignment $assignment): RedirectResponse
    {
        abort_unless($assignment->school_id === $this->schoolId(), 403);

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'dueDate' => ['nullable', 'string'],
            'maxScore' => ['nullable', 'numeric'],
        ]);

        $assignment->update($this->snakeKeys($validated));

        return back()->with('success', 'Assignment updated');
    }

    public function destroyAssignment(Assignment $assignment): RedirectResponse
    {
        abort_unless($assignment->school_id === $this->schoolId(), 403);

        $assignment->delete();

        return back()->with('success', 'Assignment removed');
    }

    public function gradeSubmission(Request $request, Submission $submission): RedirectResponse
    {
        abort_unless($submission->school_id === $this->schoolId(), 403);

        $validated = $request->validate([
            'score' => ['required', 'numeric'],
            'feedback' => ['nullable', 'string'],
        ]);

        $submission->update([
            'score' => $validated['score'],
            'feedback' => $validated['feedback'] ?? null,
            'status' => 'graded',
        ]);

        return back()->with('success', 'Submission graded');
    }

    public function storeExam(Request $request): RedirectResponse
    {
        $schoolId = $this->schoolId();
        abort_unless($schoolId, 403);

        $validated = $request->validate([
            'classId' => ['required', 'integer', 'exists:classes,id'],
            'subjectId' => ['required', 'integer', 'exists:subjects,id'],
            'title' => ['required', 'string', 'max:255'],
            'examDate' => ['required', 'string'],
            'startTime' => ['nullable', 'string'],
            'endTime' => ['nullable', 'string'],
            'maxScore' => ['required', 'numeric'],
            'passingScore' => ['nullable', 'numeric'],
            'term' => ['nullable', 'string'],
            'academicYear' => ['required', 'string'],
            'venue' => ['nullable', 'string'],
        ]);

        Exam::create([
            ...$this->snakeKeys($validated),
            'school_id' => $schoolId,
        ]);

        return back()->with('success', 'Exam created');
    }

    public function updateExam(Request $request, Exam $exam): RedirectResponse
    {
        abort_unless($exam->school_id === $this->schoolId(), 403);

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'examDate' => ['nullable', 'string'],
            'startTime' => ['nullable', 'string'],
            'endTime' => ['nullable', 'string'],
            'maxScore' => ['nullable', 'numeric'],
            'passingScore' => ['nullable', 'numeric'],
            'venue' => ['nullable', 'string'],
            'term' => ['nullable', 'string'],
        ]);

        $exam->update($this->snakeKeys($validated));

        return back()->with('success', 'Exam updated');
    }

    public function destroyExam(Exam $exam): RedirectResponse
    {
        abort_unless($exam->school_id === $this->schoolId(), 403);

        $exam->delete();

        return back()->with('success', 'Exam removed');
    }

    public function bulkSaveExamResults(Request $request, Exam $exam): RedirectResponse
    {
        abort_unless($exam->school_id === $this->schoolId(), 403);

        $validated = $request->validate([
            'results' => ['required', 'array'],
            'results.*.studentId' => ['required', 'integer', 'exists:students,id'],
            'results.*.score' => ['required', 'numeric'],
            'results.*.grade' => ['nullable', 'string'],
            'results.*.remarks' => ['nullable', 'string'],
        ]);

        foreach ($validated['results'] as $row) {
            ExamResult::updateOrCreate(
                [
                    'exam_id' => $exam->id,
                    'student_id' => $row['studentId'],
                ],
                [
                    'school_id' => $exam->school_id,
                    'score' => $row['score'],
                    'grade' => $row['grade'] ?? null,
                    'remarks' => $row['remarks'] ?? null,
                ]
            );
        }

        return back()->with('success', 'Results saved');
    }

    public function storeOnlineClass(Request $request): RedirectResponse
    {
        $schoolId = $this->schoolId();
        abort_unless($schoolId, 403);

        $validated = $request->validate([
            'classId' => ['required', 'integer', 'exists:classes,id'],
            'subjectId' => ['nullable', 'integer', 'exists:subjects,id'],
            'teacherId' => ['required', 'integer', 'exists:staff,id'],
            'title' => ['required', 'string', 'max:255'],
            'zoomLink' => ['required', 'string'],
            'meetingId' => ['nullable', 'string'],
            'passcode' => ['nullable', 'string'],
            'scheduledAt' => ['required', 'string'],
            'durationMinutes' => ['nullable', 'integer'],
            'isRecurring' => ['boolean'],
            'recurringDays' => ['nullable', 'array'],
            'recurringDays.*' => ['string'],
        ]);

        OnlineClass::create([
            ...$this->snakeKeys($validated),
            'school_id' => $schoolId,
            'status' => 'scheduled',
        ]);

        return back()->with('success', 'Online class scheduled');
    }

    public function updateOnlineClass(Request $request, OnlineClass $onlineClass): RedirectResponse
    {
        abort_unless($onlineClass->school_id === $this->schoolId(), 403);

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'zoomLink' => ['nullable', 'string'],
            'meetingId' => ['nullable', 'string'],
            'passcode' => ['nullable', 'string'],
            'scheduledAt' => ['nullable', 'string'],
            'durationMinutes' => ['nullable', 'integer'],
            'status' => ['nullable', 'in:scheduled,live,completed,cancelled'],
        ]);

        $onlineClass->update($this->snakeKeys($validated));

        return back()->with('success', 'Online class updated');
    }

    public function destroyOnlineClass(OnlineClass $onlineClass): RedirectResponse
    {
        abort_unless($onlineClass->school_id === $this->schoolId(), 403);

        $onlineClass->delete();

        return back()->with('success', 'Online class removed');
    }

    /**
     * @return array<string, mixed>
     */
    private function emptyPayload(): array
    {
        return [
            'subjects' => [],
            'assignments' => [],
            'exams' => [],
            'examResults' => [],
            'onlineClasses' => [],
            'submissions' => [],
            'classes' => [],
            'staff' => [],
            'students' => [],
            'school' => null,
        ];
    }
}
