<?php

namespace App\Http\Controllers;

use App\Models\Admission;
use App\Models\AttendanceRecord;
use App\Models\School;
use App\Models\SchoolApplication;
use App\Models\Staff;
use App\Models\Student;
use App\Services\StudentFeeBalanceService;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private StudentFeeBalanceService $feeBalances,
    ) {}

    public function index(): Response
    {
        $user = auth()->user();

        if ($user?->isPlatformAdmin()) {
            $schoolId = $this->schoolId();

            if ($schoolId && tenancy()->initialized) {
                return Inertia::render('dashboard/page', $this->schoolDashboardPayload($schoolId));
            }

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

        return Inertia::render('dashboard/page', $this->schoolDashboardPayload($schoolId));
    }

    /**
     * @return array<string, mixed>
     */
    private function schoolDashboardPayload(int $schoolId): array
    {
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
            'pendingFees' => $this->feeBalances->totalOutstandingForSchool(
                $schoolId,
                sprintf('%d-%d', now()->year, now()->year + 1),
            ),
        ];

        return [
            'school' => $this->school(),
            'stats' => $stats,
            'recentAdmissions' => Admission::forSchool($schoolId)
                ->orderByDesc('created_at')
                ->limit(5)
                ->get(),
            'schools' => [],
            'applications' => [],
        ];
    }
}
