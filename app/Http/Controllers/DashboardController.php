<?php

namespace App\Http\Controllers;

use App\Models\Admission;
use App\Models\AttendanceRecord;
use App\Models\FeePayment;
use App\Models\School;
use App\Models\SchoolApplication;
use App\Models\Staff;
use App\Models\Student;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();

        if ($user?->isSuperadmin()) {
            return Inertia::render('dashboard/page', [
                'school' => null,
                'stats' => null,
                'recentAdmissions' => [],
                'schools' => School::orderByDesc('created_at')->get(),
                'applications' => SchoolApplication::orderByDesc('created_at')->get(),
            ]);
        }

        $schoolId = $this->schoolId();

        if (! $schoolId) {
            return Inertia::render('dashboard/page', [
                'school' => null,
                'stats' => null,
                'recentAdmissions' => [],
                'schools' => [],
                'applications' => [],
            ]);
        }

        $today = now()->toDateString();
        $todayRecords = AttendanceRecord::forSchool($schoolId)->where('date', $today)->get();
        $presentToday = $todayRecords->whereIn('status', ['present', 'late'])->count();

        $stats = [
            'totalStudents' => Student::forSchool($schoolId)->count(),
            'activeTeachers' => Staff::forSchool($schoolId)
                ->where('role', 'teacher')
                ->where('status', 'active')
                ->count(),
            'todayAttendance' => $todayRecords->isNotEmpty()
                ? round($presentToday / $todayRecords->count() * 100).'%'
                : null,
            'pendingFees' => (float) FeePayment::forSchool($schoolId)
                ->where('status', 'pending')
                ->sum('amount'),
        ];

        return Inertia::render('dashboard/page', [
            'school' => $this->school(),
            'stats' => $stats,
            'recentAdmissions' => Admission::forSchool($schoolId)
                ->orderByDesc('created_at')
                ->limit(5)
                ->get(),
            'schools' => [],
            'applications' => [],
        ]);
    }
}
