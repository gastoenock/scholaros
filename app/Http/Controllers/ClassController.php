<?php

namespace App\Http\Controllers;

use App\Models\SchoolClass;
use App\Models\Staff;
use App\Models\Student;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ClassController extends Controller
{
    public function index(): Response
    {
        $schoolId = $this->schoolId();

        $classes = $schoolId ? SchoolClass::forSchool($schoolId)->orderBy('id')->get() : collect();
        $staff = $schoolId ? Staff::forSchool($schoolId)->orderBy('id')->get() : collect();
        $students = $schoolId ? Student::forSchool($schoolId)->get() : collect();

        return Inertia::render('dashboard/classes/page', [
            'classes' => $classes,
            'staff' => $staff,
            'students' => $students,
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
            'room' => ['nullable', 'string'],
            ...$this->academicYearRules(true),
            'capacity' => ['nullable', 'integer'],
        ]);

        SchoolClass::create([
            ...$this->snakeKeys($validated),
            ...$this->academicCalendar()->applyYear($schoolId, $validated),
            'school_id' => $schoolId,
        ]);

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
            'room' => ['nullable', 'string'],
            ...$this->academicYearRules(),
            'capacity' => ['nullable', 'integer'],
        ]);

        $payload = $this->snakeKeys($validated);
        if (isset($validated['academicYearId']) || isset($validated['academicYear'])) {
            $payload = [...$payload, ...$this->academicCalendar()->applyYear($class->school_id, $validated)];
        }

        $class->update($payload);

        return back()->with('success', 'Class updated');
    }

    public function destroy(SchoolClass $class): RedirectResponse
    {
        abort_unless($class->school_id === $this->schoolId(), 403);

        $class->delete();

        return back()->with('success', 'Class deleted');
    }
}
