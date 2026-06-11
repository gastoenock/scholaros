<?php

namespace App\Http\Controllers;

use App\Models\AttendanceRecord;
use App\Models\Exam;
use App\Models\ExamResult;
use App\Models\Meeting;
use App\Models\Notification;
use App\Models\ParentStudentLink;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Submission;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ParentPortalController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();

        if ($user->role !== 'parent') {
            return Inertia::render('dashboard/parent-portal/page', [
                'dashboard' => null,
            ]);
        }

        $studentIds = ParentStudentLink::where('parent_user_id', $user->id)
            ->pluck('student_id');

        $students = Student::whereIn('id', $studentIds)->get();

        $upcomingMeetings = Meeting::where('parent_id', $user->id)
            ->whereIn('status', ['confirmed', 'requested'])
            ->orderBy('scheduled_at')
            ->limit(5)
            ->get();

        $notifications = Notification::where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();

        return Inertia::render('dashboard/parent-portal/page', [
            'dashboard' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                ],
                'students' => $students,
                'upcomingMeetings' => $upcomingMeetings,
                'notifications' => $notifications,
                'studentCount' => $students->count(),
            ],
        ]);
    }

    public function studentSummary(Request $request, Student $student): Response
    {
        $user = auth()->user();
        abort_unless($user->role === 'parent', 403);

        $linked = ParentStudentLink::where('parent_user_id', $user->id)
            ->where('student_id', $student->id)
            ->exists();

        abort_unless($linked, 403);

        $examResults = ExamResult::where('student_id', $student->id)
            ->orderByDesc('id')
            ->limit(10)
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

        $attendance = AttendanceRecord::where('person_id', (string) $student->id)->get();
        $totalDays = $attendance->count();
        $presentDays = $attendance->whereIn('status', ['present', 'late'])->count();
        $attendanceRate = $totalDays > 0 ? (int) round(($presentDays / $totalDays) * 100) : 0;

        $submissions = Submission::where('student_id', $student->id)->get();

        return Inertia::render('dashboard/parent-portal/page', [
            'dashboard' => null,
            'studentSummary' => [
                'student' => $student,
                'examResults' => $examResults,
                'attendanceRate' => $attendanceRate,
                'totalDays' => $totalDays,
                'presentDays' => $presentDays,
                'submissionCount' => $submissions->count(),
                'gradedCount' => $submissions->where('status', 'graded')->count(),
            ],
        ]);
    }
}
