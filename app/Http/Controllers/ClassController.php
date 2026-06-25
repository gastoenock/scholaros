<?php

namespace App\Http\Controllers;

use App\Models\SchoolClass;
use App\Models\Staff;
use App\Models\Student;
use App\Models\Subject;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ClassController extends Controller
{
    public function index(): Response
    {
        $schoolId = $this->schoolId();

        $classes = $schoolId
            ? SchoolClass::forSchool($schoolId)->with(['subjects:id', 'assignedRoom:id,name,building'])->orderBy('id')->get()->map(function (SchoolClass $class) {
                $array = $class->toArray();
                $array['subjectIds'] = $class->subjects->pluck('id')->values()->all();

                return $array;
            })
            : collect();
        $staff = $schoolId ? Staff::forSchool($schoolId)->orderBy('id')->get() : collect();
        $students = $schoolId ? Student::forSchool($schoolId)->get(['id', 'class_id']) : collect();
        $subjects = $schoolId ? Subject::forSchool($schoolId)->orderBy('name')->get(['id', 'name', 'code', 'grade_level']) : collect();

        return Inertia::render('dashboard/classes/page', [
            'classes' => $classes,
            'staff' => $staff,
            'students' => $students,
            'subjects' => $subjects,
        ]);
    }

    public function show(SchoolClass $class): Response
    {
        abort_unless($class->school_id === $this->schoolId(), 403);

        $class->load(['subjects:id,name,code,grade_level', 'classTeacher:id,uuid,first_name,last_name,staff_id', 'assignedRoom:id,name,building']);

        $enrolledStudents = $class->students()
            ->where('status', 'active')
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get(['id', 'uuid', 'first_name', 'last_name', 'student_id', 'grade_level', 'class_section', 'class_id']);

        $availableStudents = Student::forSchool($class->school_id)
            ->where('status', 'active')
            ->where(fn ($q) => $q->whereNull('class_id')->orWhere('class_id', '!=', $class->id))
            ->when($class->school_branch_id, fn ($q) => $q->where('school_branch_id', $class->school_branch_id))
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get(['id', 'uuid', 'first_name', 'last_name', 'student_id', 'grade_level', 'class_section', 'class_id']);

        $schoolId = $this->schoolId();
        $allSubjects = $schoolId
            ? Subject::forSchool($schoolId)->orderBy('name')->get(['id', 'name', 'code', 'grade_level'])
            : collect();

        return Inertia::render('dashboard/classes/show', [
            'schoolClass' => [
                ...$class->toArray(),
                'subjectIds' => $class->subjects->pluck('id')->values()->all(),
            ],
            'students' => $enrolledStudents,
            'availableStudents' => $availableStudents,
            'subjects' => $allSubjects,
            'staff' => $schoolId
                ? Staff::forSchool($schoolId)->where('status', 'active')->orderBy('last_name')->get(['id', 'uuid', 'first_name', 'last_name', 'staff_id', 'role'])
                : collect(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $schoolId = $this->schoolId();
        abort_unless($schoolId, 403);

        $validated = $request->validate([
            'schoolBranchId' => ['nullable', 'integer', 'exists:school_branches,id'],
            'name' => ['required', 'string', 'max:255'],
            'gradeLevel' => ['required', 'string'],
            'section' => ['nullable', 'string'],
            'classTeacherId' => ['nullable', 'integer', 'exists:staff,id'],
            ...$this->academicYearRules(true),
            'capacity' => ['nullable', 'integer'],
            'subjectIds' => ['nullable', 'array'],
            'subjectIds.*' => ['integer', 'exists:subjects,id'],
        ]);

        $subjectIds = $validated['subjectIds'] ?? null;
        unset($validated['subjectIds']);

        $payload = $this->snakeKeys($validated);
        unset($payload['class_room_id']);

        $class = SchoolClass::create([
            ...$payload,
            ...$this->academicCalendar()->applyYear($schoolId, $validated),
            'school_id' => $schoolId,
        ]);

        if ($subjectIds !== null) {
            $class->subjects()->sync($subjectIds);
        }

        return back()->with('success', 'Class created');
    }

    public function update(Request $request, SchoolClass $class): RedirectResponse
    {
        abort_unless($class->school_id === $this->schoolId(), 403);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'gradeLevel' => ['sometimes', 'string'],
            'section' => ['nullable', 'string'],
            'classTeacherId' => ['nullable', 'integer', 'exists:staff,id'],
            ...$this->academicYearRules(),
            'capacity' => ['nullable', 'integer'],
            'subjectIds' => ['nullable', 'array'],
            'subjectIds.*' => ['integer', 'exists:subjects,id'],
        ]);

        $subjectIds = $validated['subjectIds'] ?? null;
        unset($validated['subjectIds']);

        $payload = $this->snakeKeys($validated);
        unset($payload['class_room_id']);
        if (isset($validated['academicYearId']) || isset($validated['academicYear'])) {
            $payload = [...$payload, ...$this->academicCalendar()->applyYear($class->school_id, $validated)];
        }

        $class->update($payload);

        if ($subjectIds !== null) {
            $class->subjects()->sync($subjectIds);
        }

        if (array_key_exists('grade_level', $payload) || array_key_exists('section', $payload)) {
            $class->students()->update([
                'grade_level' => $class->grade_level,
                'class_section' => $class->section,
            ]);
        }

        return back()->with('success', 'Class updated');
    }

    public function assignStudents(Request $request, SchoolClass $class): RedirectResponse
    {
        abort_unless($class->school_id === $this->schoolId(), 403);

        $validated = $request->validate([
            'studentIds' => ['required', 'array', 'min:1'],
            'studentIds.*' => ['integer', 'exists:students,id'],
        ]);

        $students = Student::forSchool($class->school_id)
            ->whereIn('id', $validated['studentIds'])
            ->get();

        foreach ($students as $student) {
            $student->update([
                'class_id' => $class->id,
                'grade_level' => $class->grade_level,
                'class_section' => $class->section,
                'school_branch_id' => $class->school_branch_id ?? $student->school_branch_id,
            ]);
        }

        return back()->with('success', count($students).' student(s) added to class');
    }

    public function removeStudent(SchoolClass $class, Student $student): RedirectResponse
    {
        abort_unless($class->school_id === $this->schoolId(), 403);
        abort_unless($student->class_id === $class->id, 404);

        $student->update(['class_id' => null]);

        return back()->with('success', 'Student removed from class');
    }

    public function destroy(SchoolClass $class): RedirectResponse
    {
        abort_unless($class->school_id === $this->schoolId(), 403);

        $class->students()->update(['class_id' => null]);
        $class->delete();

        return redirect()->route('classes.index')->with('success', 'Class deleted');
    }
}
