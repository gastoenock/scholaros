<?php

namespace App\Http\Controllers;

use App\Models\AttendanceRecord;
use App\Models\ExamResult;
use App\Models\FeePayment;
use App\Models\SchoolBranch;
use App\Models\Student;
use App\Models\TransportAssignment;
use App\Services\StudentFeeBalanceService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StudentController extends Controller
{
    public function __construct(
        private StudentFeeBalanceService $feeBalances,
    ) {}

    public function index(): Response
    {
        $schoolId = $this->requireTenancy();

        $students = Student::forSchool($schoolId)->with('branch')->orderBy('last_name')->get();

        $stats = [
            'total' => $students->count(),
            'active' => $students->where('status', 'active')->count(),
            'byGrade' => $students->countBy(fn ($s) => $s->grade_level ?? 'Unassigned'),
        ];

        return Inertia::render('dashboard/students/page', [
            'students' => $students,
            'stats' => $stats,
            'school' => $this->school(),
            'branches' => SchoolBranch::forSchool($schoolId)->orderBy('name')->get(),
        ]);
    }

    public function show(Student $student): Response
    {
        abort_unless($student->school_id === $this->schoolId(), 403);

        $student->load('branch');

        $attendanceRecords = AttendanceRecord::query()
            ->where('school_id', $student->school_id)
            ->where('person_id', (string) $student->id)
            ->orderByDesc('date')
            ->limit(30)
            ->get();

        $attendanceSummary = [
            'present' => $attendanceRecords->where('status', 'present')->count(),
            'absent' => $attendanceRecords->where('status', 'absent')->count(),
            'late' => $attendanceRecords->where('status', 'late')->count(),
            'total' => $attendanceRecords->count(),
        ];

        $feePayments = FeePayment::query()
            ->where('school_id', $student->school_id)
            ->where('student_id', $student->id)
            ->orderByDesc('payment_date')
            ->limit(10)
            ->get();

        $examResults = ExamResult::query()
            ->where('school_id', $student->school_id)
            ->where('student_id', $student->id)
            ->with('exam')
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();

        $transport = TransportAssignment::query()
            ->where('school_id', $student->school_id)
            ->where('student_id', $student->id)
            ->where('is_active', true)
            ->with(['bus', 'route'])
            ->first();

        $branches = SchoolBranch::forSchool($student->school_id)->orderBy('name')->get();

        $academicYear = $student->academic_year
            ?? sprintf('%d-%d', now()->year, now()->year + 1);

        $feeBalance = $this->feeBalances->currentBalance(
            $student->school_id,
            $student,
            $academicYear,
        );

        return Inertia::render('dashboard/students/show', [
            'student' => $student,
            'branches' => $branches,
            'attendanceRecords' => $attendanceRecords,
            'attendanceSummary' => $attendanceSummary,
            'feePayments' => $feePayments,
            'feeBalance' => $feeBalance,
            'examResults' => $examResults,
            'transport' => $transport,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $schoolId = $this->schoolId();
        abort_unless($schoolId, 403);

        $validated = $request->validate([
            'schoolBranchId' => ['nullable', 'integer', 'exists:school_branches,id'],
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
            ...$this->academicYearRules(),
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
            ...$this->academicCalendar()->applyYear($schoolId, $validated),
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
            'schoolBranchId' => ['nullable', 'integer', 'exists:school_branches,id'],
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
            ...$this->academicYearRules(),
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

        $payload = $this->snakeKeys($validated);
        if (isset($validated['academicYearId']) || isset($validated['academicYear'])) {
            $payload = [...$payload, ...$this->academicCalendar()->applyYear($student->school_id, $validated)];
        }

        $student->update($payload);

        return back()->with('success', 'Student updated!');
    }

    public function destroy(Student $student): RedirectResponse
    {
        abort_unless($student->school_id === $this->schoolId(), 403);

        $student->delete();

        return redirect()
            ->to($this->tenantRoute('students.index'))
            ->with('success', 'Student removed');
    }
}
