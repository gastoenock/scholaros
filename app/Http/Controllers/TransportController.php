<?php

namespace App\Http\Controllers;

use App\Models\Bus;
use App\Models\BusRoute;
use App\Models\ParentStudentLink;
use App\Models\Student;
use App\Models\TransportAssignment;
use App\Models\User;
use App\Support\RoleAccess;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class TransportController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();
        $schoolId = $this->schoolId();
        $academicYear = now()->year.'-'.(now()->year + 1);
        $canManage = RoleAccess::can($user, 'transport.manage');
        $isParentView = $user instanceof User
            && RoleAccess::can($user, 'transport.view')
            && ! $canManage;

        if ($isParentView) {
            return Inertia::render('dashboard/transport/page', $this->parentIndexPayload($schoolId, $user, $academicYear));
        }

        $routes = $schoolId ? BusRoute::forSchool($schoolId)->get() : collect();
        $buses = $schoolId ? Bus::forSchool($schoolId)->get() : collect();
        $assignments = $schoolId
            ? TransportAssignment::forSchool($schoolId)->where('academic_year', $academicYear)->get()
            : collect();
        $students = $schoolId
            ? Student::forSchool($schoolId)->orderBy('last_name')->get([
                'id', 'first_name', 'last_name', 'student_id', 'class_section', 'grade_level',
                'date_of_birth', 'city', 'address', 'gender',
            ])
            : collect();

        return Inertia::render('dashboard/transport/page', [
            'routes' => $routes,
            'buses' => $buses,
            'assignments' => $assignments,
            'students' => $students,
            'children' => [],
            'canManage' => $canManage,
            'isParentView' => false,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function parentIndexPayload(?int $schoolId, User $user, string $academicYear): array
    {
        if (! $schoolId) {
            return [
                'routes' => [],
                'buses' => [],
                'assignments' => [],
                'students' => [],
                'children' => [],
                'canManage' => false,
                'isParentView' => true,
            ];
        }

        $studentIds = ParentStudentLink::where('parent_user_id', $user->id)->pluck('student_id');
        $students = Student::forSchool($schoolId)->whereIn('id', $studentIds)->orderBy('last_name')->get([
            'id', 'first_name', 'last_name', 'student_id', 'class_section', 'grade_level',
            'date_of_birth', 'city', 'address', 'gender',
        ]);

        $assignments = TransportAssignment::forSchool($schoolId)
            ->where('academic_year', $academicYear)
            ->whereIn('student_id', $studentIds)
            ->get();

        $busIds = $assignments->pluck('bus_id')->unique()->filter();
        $routeIds = $assignments->pluck('route_id')->unique()->filter();

        $buses = Bus::forSchool($schoolId)->whereIn('id', $busIds)->get();
        $routes = BusRoute::forSchool($schoolId)->whereIn('id', $routeIds)->get();

        $busById = $buses->keyBy('id');
        $routeById = $routes->keyBy('id');
        $assignmentByStudent = $assignments->keyBy('student_id');

        $children = $students->map(function (Student $student) use ($assignmentByStudent, $busById, $routeById) {
            $assignment = $assignmentByStudent->get($student->id);

            return [
                'student' => $student,
                'assignment' => $assignment,
                'bus' => $assignment ? $busById->get($assignment->bus_id) : null,
                'route' => $assignment ? $routeById->get($assignment->route_id) : null,
            ];
        })->values();

        return [
            'routes' => $routes,
            'buses' => $buses,
            'assignments' => $assignments,
            'students' => $students,
            'children' => $children,
            'canManage' => false,
            'isParentView' => true,
        ];
    }

    // ─── Bus Routes ──────────────────────────────────────────────

    public function storeRoute(Request $request): RedirectResponse
    {
        abort_unless(RoleAccess::can(auth()->user(), 'transport.manage'), 403);
        $schoolId = $this->schoolId();
        abort_unless($schoolId, 403);

        $validated = $request->validate([
            'routeName' => ['required', 'string', 'max:255'],
            'routeNumber' => ['nullable', 'string', 'max:255'],
            'stops' => ['required', 'array'],
            'stops.*.name' => ['required', 'string'],
            'stops.*.time' => ['nullable', 'string'],
            'stops.*.lat' => ['nullable', 'numeric'],
            'stops.*.lng' => ['nullable', 'numeric'],
            'morningStartTime' => ['nullable', 'string'],
            'afternoonStartTime' => ['nullable', 'string'],
        ]);

        BusRoute::create([
            ...$this->snakeKeys($validated),
            'route_number' => $validated['routeNumber'] ?? '',
            'school_id' => $schoolId,
            'is_active' => true,
        ]);

        return back()->with('success', 'Route created');
    }

    public function destroyRoute(BusRoute $busRoute): RedirectResponse
    {
        abort_unless(RoleAccess::can(auth()->user(), 'transport.manage'), 403);
        abort_unless($busRoute->school_id === $this->schoolId(), 403);

        $busRoute->delete();

        return back()->with('success', 'Route deleted');
    }

    // ─── Buses ───────────────────────────────────────────────────

    public function storeBus(Request $request): RedirectResponse
    {
        abort_unless(RoleAccess::can(auth()->user(), 'transport.manage'), 403);
        $schoolId = $this->schoolId();
        abort_unless($schoolId, 403);

        $validated = $request->validate([
            'busNumber' => ['required', 'string', 'max:255'],
            'plateNumber' => ['nullable', 'string', 'max:255'],
            'capacity' => ['required', 'integer', 'min:1'],
            'routeId' => ['nullable', 'integer', 'exists:bus_routes,id'],
            'driverName' => ['required', 'string', 'max:255'],
            'driverPhone' => ['required', 'string', 'max:255'],
            'driverLicense' => ['nullable', 'string', 'max:255'],
            'matronName' => ['nullable', 'string', 'max:255'],
            'matronPhone' => ['nullable', 'string', 'max:255'],
        ]);

        Bus::create([
            ...$this->snakeKeys($validated),
            'plate_number' => $validated['plateNumber'] ?? '',
            'school_id' => $schoolId,
            'status' => 'active',
        ]);

        return back()->with('success', 'Bus added');
    }

    /**
     * Handles both status changes and (simulated) GPS location updates.
     */
    public function updateBus(Request $request, Bus $bus): RedirectResponse
    {
        abort_unless(RoleAccess::can(auth()->user(), 'transport.manage'), 403);
        abort_unless($bus->school_id === $this->schoolId(), 403);

        $validated = $request->validate([
            'status' => ['nullable', 'in:active,in_transit,maintenance,inactive'],
            'lat' => ['nullable', 'numeric'],
            'lng' => ['nullable', 'numeric'],
        ]);

        if (isset($validated['lat'], $validated['lng'])) {
            $bus->update([
                'current_lat' => $validated['lat'],
                'current_lng' => $validated['lng'],
                'last_location_update' => now()->toISOString(),
                'status' => 'in_transit',
            ]);
        } elseif (isset($validated['status'])) {
            $bus->update(['status' => $validated['status']]);
        }

        return back()->with('success', 'Bus updated');
    }

    public function destroyBus(Bus $bus): RedirectResponse
    {
        abort_unless(RoleAccess::can(auth()->user(), 'transport.manage'), 403);
        abort_unless($bus->school_id === $this->schoolId(), 403);

        $bus->delete();

        return back()->with('success', 'Bus deleted');
    }

    // ─── Transport Assignments ───────────────────────────────────

    public function storeAssignment(Request $request): RedirectResponse
    {
        abort_unless(RoleAccess::can(auth()->user(), 'transport.manage'), 403);
        $schoolId = $this->schoolId();
        abort_unless($schoolId, 403);

        $validated = $request->validate([
            'studentId' => ['required', 'integer', 'exists:students,id'],
            'busId' => ['required', 'integer', 'exists:buses,id'],
            'routeId' => ['required', 'integer', 'exists:bus_routes,id'],
            'pickupStop' => ['nullable', 'string', 'max:255'],
            'dropStop' => ['nullable', 'string', 'max:255'],
            'academicYear' => ['required', 'string', 'max:255'],
        ]);

        $this->upsertAssignment($schoolId, $validated);

        return back()->with('success', 'Student assigned');
    }

    public function bulkStoreAssignments(Request $request): RedirectResponse
    {
        abort_unless(RoleAccess::can(auth()->user(), 'transport.manage'), 403);
        $schoolId = $this->schoolId();
        abort_unless($schoolId, 403);

        $validated = $request->validate([
            'studentIds' => ['required', 'array', 'min:1'],
            'studentIds.*' => ['integer', 'exists:students,id'],
            'busId' => ['required', 'integer', 'exists:buses,id'],
            'routeId' => ['required', 'integer', 'exists:bus_routes,id'],
            'pickupStop' => ['nullable', 'string', 'max:255'],
            'dropStop' => ['nullable', 'string', 'max:255'],
            'academicYear' => ['required', 'string', 'max:255'],
        ]);

        $this->assertTransportResourcesBelongToSchool($schoolId, $validated);

        $bus = Bus::forSchool($schoolId)->findOrFail($validated['busId']);
        $this->assertBusCapacity($schoolId, $bus, $validated['studentIds'], $validated['academicYear']);

        foreach ($validated['studentIds'] as $studentId) {
            $this->upsertAssignment($schoolId, [
                ...$validated,
                'studentId' => $studentId,
            ]);
        }

        $count = count($validated['studentIds']);

        return back()->with('success', "{$count} student".($count === 1 ? '' : 's').' assigned');
    }

    public function updateAssignment(Request $request, TransportAssignment $transportAssignment): RedirectResponse
    {
        abort_unless(RoleAccess::can(auth()->user(), 'transport.manage'), 403);
        $schoolId = $this->schoolId();
        abort_unless($schoolId && $transportAssignment->school_id === $schoolId, 403);

        $validated = $request->validate([
            'busId' => ['required', 'integer', 'exists:buses,id'],
            'routeId' => ['required', 'integer', 'exists:bus_routes,id'],
            'pickupStop' => ['nullable', 'string', 'max:255'],
            'dropStop' => ['nullable', 'string', 'max:255'],
            'isActive' => ['nullable', 'boolean'],
            'academicYear' => ['nullable', 'string', 'max:255'],
        ]);

        $this->assertTransportResourcesBelongToSchool($schoolId, $validated);

        $bus = Bus::forSchool($schoolId)->findOrFail($validated['busId']);
        $academicYear = $validated['academicYear'] ?? $transportAssignment->academic_year;

        if ((int) $validated['busId'] !== (int) $transportAssignment->bus_id) {
            $this->assertBusCapacity(
                $schoolId,
                $bus,
                [$transportAssignment->student_id],
                $academicYear,
                excludeAssignmentId: $transportAssignment->id,
            );
        }

        $transportAssignment->update([
            'bus_id' => $validated['busId'],
            'route_id' => $validated['routeId'],
            'pickup_stop' => $validated['pickupStop'] ?? '',
            'drop_stop' => $validated['dropStop'] ?? '',
            'is_active' => $validated['isActive'] ?? $transportAssignment->is_active,
            'academic_year' => $academicYear,
        ]);

        return back()->with('success', 'Assignment updated');
    }

    public function destroyAssignment(TransportAssignment $transportAssignment): RedirectResponse
    {
        abort_unless(RoleAccess::can(auth()->user(), 'transport.manage'), 403);
        abort_unless($transportAssignment->school_id === $this->schoolId(), 403);

        $transportAssignment->delete();

        return back()->with('success', 'Assignment removed');
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    private function upsertAssignment(int $schoolId, array $validated): TransportAssignment
    {
        $this->assertTransportResourcesBelongToSchool($schoolId, $validated);

        $bus = Bus::forSchool($schoolId)->findOrFail($validated['busId']);
        $this->assertBusCapacity(
            $schoolId,
            $bus,
            [(int) $validated['studentId']],
            $validated['academicYear'],
        );

        return TransportAssignment::updateOrCreate(
            [
                'school_id' => $schoolId,
                'student_id' => $validated['studentId'],
                'academic_year' => $validated['academicYear'],
            ],
            [
                'bus_id' => $validated['busId'],
                'route_id' => $validated['routeId'],
                'pickup_stop' => $validated['pickupStop'] ?? '',
                'drop_stop' => $validated['dropStop'] ?? '',
                'is_active' => true,
            ],
        );
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    private function assertTransportResourcesBelongToSchool(int $schoolId, array $validated): void
    {
        Bus::forSchool($schoolId)->findOrFail($validated['busId']);
        BusRoute::forSchool($schoolId)->findOrFail($validated['routeId']);

        if (isset($validated['studentId'])) {
            Student::forSchool($schoolId)->findOrFail($validated['studentId']);
        }

        if (isset($validated['studentIds'])) {
            $count = Student::forSchool($schoolId)->whereIn('id', $validated['studentIds'])->count();
            abort_unless($count === count($validated['studentIds']), 403);
        }
    }

    /**
     * @param  array<int>  $studentIds
     */
    private function assertBusCapacity(
        int $schoolId,
        Bus $bus,
        array $studentIds,
        string $academicYear,
        ?int $excludeAssignmentId = null,
    ): void {
        $query = TransportAssignment::forSchool($schoolId)
            ->where('bus_id', $bus->id)
            ->where('academic_year', $academicYear)
            ->where('is_active', true);

        if ($excludeAssignmentId) {
            $query->where('id', '!=', $excludeAssignmentId);
        }

        $alreadyOnBus = (clone $query)->whereIn('student_id', $studentIds)->pluck('student_id');
        $incomingNew = collect($studentIds)->diff($alreadyOnBus)->count();
        $currentOnBus = $query->count();

        if ($currentOnBus + $incomingNew > $bus->capacity) {
            throw ValidationException::withMessages([
                'capacity' => "Bus {$bus->bus_number} has capacity {$bus->capacity}. Cannot assign {$incomingNew} more student(s).",
            ]);
        }
    }
}
