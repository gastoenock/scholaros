<?php

namespace App\Services;

use App\Models\Assignment;
use App\Models\AttendanceRecord;
use App\Models\Exam;
use App\Models\ExamResult;
use App\Models\SchoolClass;
use App\Models\Staff;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Submission;
use App\Models\TimetableSlot;
use App\Models\User;
use Illuminate\Support\Collection;

class RoleDashboardService
{
    /** @var list<string> */
    public const STAFF_PORTAL_ROLES = ['admin', 'teacher', 'admin_staff', 'principal', 'vice_principal'];

    public function portalAllowsRole(string $portal, ?string $role): bool
    {
        if ($role === null) {
            return false;
        }

        return match ($portal) {
            'parent' => $role === 'parent',
            'student' => $role === 'student',
            'staff' => in_array($role, self::STAFF_PORTAL_ROLES, true),
            default => false,
        };
    }

    public function resolveStaff(User $user): ?Staff
    {
        if ($user->staffProfile) {
            return $user->staffProfile;
        }

        return Staff::query()
            ->when($user->school_id, fn ($q) => $q->where('school_id', $user->school_id))
            ->where('email', $user->email)
            ->first();
    }

    public function resolveStudent(User $user): ?Student
    {
        if ($user->studentProfile) {
            return $user->studentProfile;
        }

        return Student::query()
            ->when($user->school_id, fn ($q) => $q->where('school_id', $user->school_id))
            ->where('email', $user->email)
            ->first();
    }

    /**
     * @return array<string, mixed>
     */
    public function teacherPayload(int $schoolId, Staff $staff): array
    {
        $classes = SchoolClass::forSchool($schoolId)
            ->where('class_teacher_id', $staff->id)
            ->with('assignedRoom:id,name,building')
            ->orderBy('name')
            ->get();

        $classIds = $classes->pluck('id');
        $studentCount = $classIds->isEmpty()
            ? 0
            : Student::forSchool($schoolId)->whereIn('class_id', $classIds)->count();

        $today = strtolower(now()->format('l'));
        $todaySlots = TimetableSlot::forSchool($schoolId)
            ->where('teacher_id', $staff->id)
            ->where('day', $today)
            ->orderBy('period')
            ->limit(8)
            ->get();

        $pendingSubmissions = Submission::forSchool($schoolId)
            ->where('status', 'submitted')
            ->whereIn(
                'assignment_id',
                Assignment::forSchool($schoolId)->where('teacher_id', $staff->id)->pluck('id'),
            )
            ->count();

        $myAssignments = Assignment::forSchool($schoolId)
            ->where('teacher_id', $staff->id)
            ->orderByDesc('due_date')
            ->limit(5)
            ->get();

        return [
            'staff' => $staff,
            'classes' => $classes,
            'studentCount' => $studentCount,
            'todaySlots' => $todaySlots,
            'pendingSubmissions' => $pendingSubmissions,
            'recentAssignments' => $myAssignments,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function studentPayload(int $schoolId, Student $student): array
    {
        $student->load(['schoolClass.assignedRoom:id,name,building', 'schoolClass.classTeacher:id,first_name,last_name']);

        $examResults = ExamResult::where('student_id', $student->id)
            ->orderByDesc('id')
            ->limit(5)
            ->get()
            ->map(function (ExamResult $result) {
                $exam = Exam::find($result->exam_id);
                $subject = $exam ? Subject::find($exam->subject_id) : null;

                return array_merge($result->toArray(), [
                    'examTitle' => $exam?->title ?? 'Unknown',
                    'subjectName' => $subject?->name ?? 'Unknown',
                    'examDate' => $exam?->exam_date ?? '',
                    'maxScore' => $exam?->max_score ?? 0,
                ]);
            });

        $attendance = AttendanceRecord::forSchool($schoolId)
            ->where('person_id', (string) $student->id)
            ->get();
        $totalDays = $attendance->count();
        $presentDays = $attendance->whereIn('status', ['present', 'late'])->count();
        $attendanceRate = $totalDays > 0 ? (int) round(($presentDays / $totalDays) * 100) : 0;

        $today = strtolower(now()->format('l'));
        $classId = $student->class_id;
        $todayTimetable = $classId
            ? TimetableSlot::forSchool($schoolId)
                ->where('class_id', $classId)
                ->where('day', $today)
                ->orderBy('period')
                ->get()
            : collect();

        $upcomingAssignments = $classId
            ? Assignment::forSchool($schoolId)
                ->where('class_id', $classId)
                ->where('due_date', '>=', now()->toDateString())
                ->orderBy('due_date')
                ->limit(5)
                ->get()
            : collect();

        return [
            'student' => $student,
            'examResults' => $examResults,
            'attendanceRate' => $attendanceRate,
            'totalDays' => $totalDays,
            'presentDays' => $presentDays,
            'todayTimetable' => $todayTimetable,
            'upcomingAssignments' => $upcomingAssignments,
        ];
    }

    public function isTeacherRole(?string $role): bool
    {
        return in_array($role, ['teacher', 'principal', 'vice_principal'], true);
    }

    public function isStaffPortalRole(?string $role): bool
    {
        return in_array($role, self::STAFF_PORTAL_ROLES, true);
    }
}
