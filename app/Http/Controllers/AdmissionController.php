<?php

namespace App\Http\Controllers;

use App\Models\Admission;
use App\Models\Student;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AdmissionController extends Controller
{
    public function index(): Response
    {
        $schoolId = $this->schoolId();

        $admissions = $schoolId
            ? Admission::forSchool($schoolId)->orderByDesc('created_at')->get()
            : collect();

        $stats = [
            'total' => $admissions->count(),
            'submitted' => $admissions->where('status', 'submitted')->count(),
            'underReview' => $admissions->where('status', 'under_review')->count(),
            'accepted' => $admissions->where('status', 'accepted')->count(),
            'enrolled' => $admissions->where('status', 'enrolled')->count(),
            'rejected' => $admissions->where('status', 'rejected')->count(),
        ];

        return Inertia::render('dashboard/admissions/page', [
            'admissions' => $admissions,
            'stats' => $stats,
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
            'applyingForGrade' => ['required', 'string'],
            'academicYear' => ['required', 'string'],
            'previousSchool' => ['nullable', 'string'],
            'guardianName' => ['required', 'string'],
            'guardianEmail' => ['required', 'string', 'email'],
            'guardianPhone' => ['required', 'string'],
            'guardianRelationship' => ['required', 'string'],
        ]);

        $count = Admission::forSchool($schoolId)->count();

        Admission::create([
            ...$this->snakeKeys($validated),
            'school_id' => $schoolId,
            'application_id' => sprintf('APP-%d-%03d', now()->year, $count + 1),
            'status' => 'submitted',
            'documents' => [],
        ]);

        return back()->with('success', 'Admission application submitted!');
    }

    public function updateStatus(Request $request, Admission $admission): RedirectResponse
    {
        abort_unless($admission->school_id === $this->schoolId(), 403);

        $validated = $request->validate([
            'status' => ['required', 'in:submitted,under_review,interview_scheduled,accepted,rejected,waitlisted,enrolled'],
            'reviewNotes' => ['nullable', 'string'],
            'interviewDate' => ['nullable', 'string'],
        ]);

        $admission->update($this->snakeKeys($validated));

        return back()->with('success', 'Application status updated');
    }

    public function enroll(Admission $admission): RedirectResponse
    {
        $schoolId = $this->schoolId();
        abort_unless($admission->school_id === $schoolId, 403);

        if ($admission->status !== 'accepted') {
            throw ValidationException::withMessages([
                'status' => 'Student must be accepted before enrollment',
            ]);
        }

        $count = Student::forSchool($schoolId)->count();

        Student::create([
            'school_id' => $admission->school_id,
            'branch_id' => $admission->branch_id,
            'first_name' => $admission->first_name,
            'last_name' => $admission->last_name,
            'date_of_birth' => $admission->date_of_birth,
            'gender' => $admission->gender,
            'student_id' => sprintf('STU-%04d', $count + 1),
            'grade_level' => $admission->applying_for_grade,
            'academic_year' => $admission->academic_year,
            'guardians' => [[
                'name' => $admission->guardian_name,
                'relationship' => $admission->guardian_relationship,
                'phone' => $admission->guardian_phone,
                'email' => $admission->guardian_email,
                'isEmergencyContact' => true,
            ]],
            'status' => 'active',
        ]);

        $admission->update(['status' => 'enrolled']);

        return back()->with('success', 'Student enrolled successfully!');
    }
}
