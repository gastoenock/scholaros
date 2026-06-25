<?php

namespace App\Http\Controllers;

use App\Models\Admission;
use App\Models\AttendanceRecord;
use App\Models\Event;
use App\Models\Notification;
use App\Models\School;
use App\Models\SchoolApplication;
use App\Models\Staff;
use App\Models\Student;
use App\Models\User;
use App\Services\RoleDashboardService;
use App\Services\StudentFeeBalanceService;
use App\Support\RoleAccess;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private StudentFeeBalanceService $feeBalances,
        private RoleDashboardService $roleDashboard,
    ) {}

    public function index(): Response|RedirectResponse
    {
        $user = auth()->user();

        if ($user instanceof User) {
            if ($user->isParent()) {
                return redirect()->route('parent-portal.index');
            }
            if ($user->isStudent()) {
                return redirect()->route('dashboard.student');
            }
            if ($user->isTeacher()) {
                return redirect()->route('dashboard.teacher');
            }
        }

        if ($user?->isPlatformAdmin()) {
            $schoolId = $this->schoolId();

            if ($schoolId && tenancy()->initialized) {
                return Inertia::render('dashboard/page', [
                    ...$this->schoolDashboardPayload($schoolId),
                    'view' => 'admin',
                ]);
            }

            return Inertia::render('dashboard/page', [
                'school' => null,
                'stats' => null,
                'recentAdmissions' => [],
                'schools' => School::orderByDesc('created_at')->get(),
                'applications' => SchoolApplication::orderByDesc('created_at')->get(),
                'view' => 'platform',
            ]);
        }

        $schoolId = $this->schoolId();

        if (! $schoolId || ! $user instanceof User) {
            return Inertia::render('dashboard/page', [
                'school' => null,
                'stats' => null,
                'recentAdmissions' => [],
                'schools' => [],
                'applications' => [],
                'view' => 'setup',
            ]);
        }

        if (in_array($user->role, ['admin_staff', 'principal', 'vice_principal'], true)) {
            return Inertia::render('dashboard/staff-home/page', $this->staffDashboardPayload($schoolId, $user));
        }

        if ($user->isSchoolAdmin()) {
            return Inertia::render('dashboard/page', [
                ...$this->schoolDashboardPayload($schoolId),
                'view' => 'admin',
            ]);
        }

        return redirect()->to(RoleAccess::homePath($user));
    }

    public function teacher(): Response|RedirectResponse
    {
        $user = auth()->user();
        abort_unless($user instanceof User && $user->isTeacher(), 403);

        $schoolId = $this->requireTenancy();
        $staff = $this->roleDashboard->resolveStaff($user);

        if (! $staff) {
            return Inertia::render('dashboard/teacher/page', [
                'school' => $this->school(),
                'linked' => false,
                'teacherDashboard' => null,
            ]);
        }

        return Inertia::render('dashboard/teacher/page', [
            'school' => $this->school(),
            'linked' => true,
            'teacherDashboard' => $this->roleDashboard->teacherPayload($schoolId, $staff),
        ]);
    }

    public function student(): Response|RedirectResponse
    {
        $user = auth()->user();
        abort_unless($user instanceof User && $user->isStudent(), 403);

        $schoolId = $this->requireTenancy();
        $student = $this->roleDashboard->resolveStudent($user);

        if (! $student) {
            return Inertia::render('dashboard/student/page', [
                'school' => $this->school(),
                'linked' => false,
                'studentDashboard' => null,
            ]);
        }

        return Inertia::render('dashboard/student/page', [
            'school' => $this->school(),
            'linked' => true,
            'studentDashboard' => $this->roleDashboard->studentPayload($schoolId, $student),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function staffDashboardPayload(int $schoolId, User $user): array
    {
        return [
            'school' => $this->school(),
            'user' => [
                'name' => $user->name,
                'role' => $user->role,
            ],
            'notifications' => Notification::where('user_id', $user->id)
                ->orderByDesc('created_at')
                ->limit(8)
                ->get(),
            'upcomingEvents' => Event::forSchool($schoolId)
                ->where('start_at', '>=', now()->toDateString())
                ->orderBy('start_at')
                ->limit(5)
                ->get(),
        ];
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
