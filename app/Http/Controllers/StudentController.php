<?php

namespace App\Http\Controllers;

use App\Models\Student;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StudentController extends Controller
{
    public function index(): Response
    {
        $schoolId = $this->schoolId();

        $students = $schoolId
            ? Student::forSchool($schoolId)->orderBy('last_name')->get()
            : collect();

        $stats = [
            'total' => $students->count(),
            'active' => $students->where('status', 'active')->count(),
            'byGrade' => $students->countBy(fn ($s) => $s->grade_level ?? 'Unassigned'),
        ];

        return Inertia::render('dashboard/students/page', [
            'students' => $students,
            'stats' => $stats,
            'school' => $this->school(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $schoolId = $this->schoolId();
        abort_unless($schoolId, 403);

        $validated = $request->validate([
            'branchId' => ['nullable', 'string'],
            'firstName' => ['required', 'string', 'max:255'],
            'lastName' => ['required', 'string', 'max:255'],
            'dateOfBirth' => ['nullable', 'string'],
            'gender' => ['nullable', 'in:male,female,other'],
            'nationality' => ['nullable', 'string'],
            'religion' => ['nullable', 'string'],
            'bloodGroup' => ['nullable', 'string'],
            'gradeLevel' => ['nullable', 'string'],
            'classSection' => ['nullable', 'string'],
            'enrollmentDate' => ['nullable', 'string'],
            'academicYear' => ['nullable', 'string'],
            'address' => ['nullable', 'string'],
            'city' => ['nullable', 'string'],
            'state' => ['nullable', 'string'],
            'zip' => ['nullable', 'string'],
            'email' => ['nullable', 'string'],
            'phone' => ['nullable', 'string'],
            'medicalNotes' => ['nullable', 'string'],
            'guardians' => ['nullable', 'array'],
            'guardians.*.name' => ['required', 'string'],
            'guardians.*.relationship' => ['required', 'string'],
            'guardians.*.phone' => ['required', 'string'],
            'guardians.*.email' => ['nullable', 'string'],
            'guardians.*.occupation' => ['nullable', 'string'],
            'guardians.*.isEmergencyContact' => ['boolean'],
        ]);

        $count = Student::forSchool($schoolId)->count();

        Student::create([
            ...$this->snakeKeys($validated),
            'school_id' => $schoolId,
            'student_id' => sprintf('STU-%04d', $count + 1),
            'status' => 'active',
        ]);

        return back()->with('success', 'Student added!');
    }

    public function update(Request $request, Student $student): RedirectResponse
    {
        abort_unless($student->school_id === $this->schoolId(), 403);

        $validated = $request->validate([
            'branchId' => ['nullable', 'string'],
            'firstName' => ['sometimes', 'string', 'max:255'],
            'lastName' => ['sometimes', 'string', 'max:255'],
            'dateOfBirth' => ['nullable', 'string'],
            'gender' => ['nullable', 'in:male,female,other'],
            'nationality' => ['nullable', 'string'],
            'religion' => ['nullable', 'string'],
            'bloodGroup' => ['nullable', 'string'],
            'gradeLevel' => ['nullable', 'string'],
            'classSection' => ['nullable', 'string'],
            'enrollmentDate' => ['nullable', 'string'],
            'academicYear' => ['nullable', 'string'],
            'address' => ['nullable', 'string'],
            'city' => ['nullable', 'string'],
            'state' => ['nullable', 'string'],
            'zip' => ['nullable', 'string'],
            'email' => ['nullable', 'string'],
            'phone' => ['nullable', 'string'],
            'medicalNotes' => ['nullable', 'string'],
            'status' => ['nullable', 'in:active,inactive,graduated,transferred,suspended'],
            'guardians' => ['nullable', 'array'],
            'guardians.*.name' => ['required', 'string'],
            'guardians.*.relationship' => ['required', 'string'],
            'guardians.*.phone' => ['required', 'string'],
            'guardians.*.email' => ['nullable', 'string'],
            'guardians.*.occupation' => ['nullable', 'string'],
            'guardians.*.isEmergencyContact' => ['boolean'],
        ]);

        $student->update($this->snakeKeys($validated));

        return back()->with('success', 'Student updated!');
    }

    public function destroy(Student $student): RedirectResponse
    {
        abort_unless($student->school_id === $this->schoolId(), 403);

        $student->delete();

        return back()->with('success', 'Student removed');
    }
}
