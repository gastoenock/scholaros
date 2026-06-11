<?php

namespace App\Http\Controllers;

use App\Models\Bus;
use App\Models\BusRoute;
use App\Models\Student;
use App\Models\TransportAssignment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TransportController extends Controller
{
    public function index(): Response
    {
        $schoolId = $this->schoolId();
        $academicYear = now()->year.'-'.(now()->year + 1);

        $routes = $schoolId ? BusRoute::forSchool($schoolId)->get() : collect();
        $buses = $schoolId ? Bus::forSchool($schoolId)->get() : collect();
        $assignments = $schoolId
            ? TransportAssignment::forSchool($schoolId)->where('academic_year', $academicYear)->get()
            : collect();
        $students = $schoolId
            ? Student::forSchool($schoolId)->orderBy('last_name')->get(['id', 'first_name', 'last_name'])
            : collect();

        return Inertia::render('dashboard/transport/page', [
            'routes' => $routes,
            'buses' => $buses,
            'assignments' => $assignments,
            'students' => $students,
        ]);
    }

    // ─── Bus Routes ──────────────────────────────────────────────

    public function storeRoute(Request $request): RedirectResponse
    {
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
        abort_unless($busRoute->school_id === $this->schoolId(), 403);

        $busRoute->delete();

        return back()->with('success', 'Route deleted');
    }

    // ─── Buses ───────────────────────────────────────────────────

    public function storeBus(Request $request): RedirectResponse
    {
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
        abort_unless($bus->school_id === $this->schoolId(), 403);

        $bus->delete();

        return back()->with('success', 'Bus deleted');
    }

    // ─── Transport Assignments ───────────────────────────────────

    public function storeAssignment(Request $request): RedirectResponse
    {
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

        TransportAssignment::create([
            ...$this->snakeKeys($validated),
            'pickup_stop' => $validated['pickupStop'] ?? '',
            'drop_stop' => $validated['dropStop'] ?? '',
            'school_id' => $schoolId,
            'is_active' => true,
        ]);

        return back()->with('success', 'Student assigned');
    }

    public function destroyAssignment(TransportAssignment $transportAssignment): RedirectResponse
    {
        abort_unless($transportAssignment->school_id === $this->schoolId(), 403);

        $transportAssignment->delete();

        return back()->with('success', 'Assignment removed');
    }
}
