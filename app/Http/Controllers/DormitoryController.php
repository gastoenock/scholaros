<?php

namespace App\Http\Controllers;

use App\Models\DormAllocation;
use App\Models\DormRoom;
use App\Models\MaintenanceRequest;
use App\Models\SecurityLog;
use App\Models\Student;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DormitoryController extends Controller
{
    public function index(): Response
    {
        $schoolId = $this->schoolId();

        $rooms = $schoolId ? DormRoom::forSchool($schoolId)->get() : collect();
        $allocations = $schoolId ? DormAllocation::forSchool($schoolId)->get() : collect();
        $maintenance = $schoolId ? MaintenanceRequest::forSchool($schoolId)->get() : collect();
        $securityLogs = $schoolId
            ? SecurityLog::forSchool($schoolId)->orderByDesc('id')->limit(100)->get()
            : collect();
        $students = $schoolId
            ? Student::forSchool($schoolId)->orderBy('last_name')->get(['id', 'first_name', 'last_name'])
            : collect();

        return Inertia::render('dashboard/dormitory/page', [
            'rooms' => $rooms,
            'allocations' => $allocations,
            'maintenance' => $maintenance,
            'securityLogs' => $securityLogs,
            'students' => $students,
        ]);
    }

    // ─── Dorm Rooms ──────────────────────────────────────────────

    public function storeRoom(Request $request): RedirectResponse
    {
        $schoolId = $this->schoolId();
        abort_unless($schoolId, 403);

        $validated = $request->validate([
            'roomNumber' => ['required', 'string', 'max:255'],
            'dormBlock' => ['nullable', 'string', 'max:255'],
            'floor' => ['nullable', 'integer'],
            'capacity' => ['required', 'integer', 'min:1'],
            'type' => ['required', 'in:single,double,triple,dormitory'],
            'gender' => ['required', 'in:male,female,mixed'],
            'amenities' => ['nullable', 'array'],
            'amenities.*' => ['string'],
            'monthlyFee' => ['nullable', 'numeric'],
        ]);

        DormRoom::create([
            ...$this->snakeKeys($validated),
            'school_id' => $schoolId,
            'occupied_count' => 0,
            'status' => 'available',
        ]);

        return back()->with('success', 'Room created');
    }

    public function updateRoom(Request $request, DormRoom $dormRoom): RedirectResponse
    {
        abort_unless($dormRoom->school_id === $this->schoolId(), 403);

        $validated = $request->validate([
            'roomNumber' => ['sometimes', 'required', 'string', 'max:255'],
            'dormBlock' => ['nullable', 'string', 'max:255'],
            'floor' => ['nullable', 'integer'],
            'capacity' => ['sometimes', 'required', 'integer', 'min:1'],
            'type' => ['sometimes', 'required', 'in:single,double,triple,dormitory'],
            'gender' => ['sometimes', 'required', 'in:male,female,mixed'],
            'amenities' => ['nullable', 'array'],
            'amenities.*' => ['string'],
            'monthlyFee' => ['nullable', 'numeric'],
            'status' => ['sometimes', 'required', 'in:available,full,maintenance'],
        ]);

        $dormRoom->update($this->snakeKeys($validated));

        if (isset($validated['capacity']) && $dormRoom->occupied_count >= $dormRoom->capacity && $dormRoom->status !== 'maintenance') {
            $dormRoom->update(['status' => 'full']);
        }

        return back()->with('success', 'Hostel room updated');
    }

    public function destroyRoom(DormRoom $dormRoom): RedirectResponse
    {
        abort_unless($dormRoom->school_id === $this->schoolId(), 403);

        $dormRoom->delete();

        return back()->with('success', 'Room deleted');
    }

    // ─── Allocations ─────────────────────────────────────────────

    public function storeAllocation(Request $request): RedirectResponse
    {
        $schoolId = $this->schoolId();
        abort_unless($schoolId, 403);

        $validated = $request->validate([
            'roomId' => ['required', 'integer', 'exists:dorm_rooms,id'],
            'studentId' => ['required', 'integer', 'exists:students,id'],
            'academicYear' => ['required', 'string', 'max:255'],
            'checkInDate' => ['required', 'string', 'max:255'],
            'bedNumber' => ['nullable', 'string', 'max:255'],
        ]);

        $room = DormRoom::findOrFail($validated['roomId']);
        abort_unless($room->school_id === $schoolId, 403);

        if ($room->occupied_count >= $room->capacity) {
            return back()->withErrors(['roomId' => 'Room is full']);
        }

        DormAllocation::create([
            ...$this->snakeKeys($validated),
            'school_id' => $schoolId,
            'status' => 'active',
        ]);

        $newCount = $room->occupied_count + 1;
        $room->update([
            'occupied_count' => $newCount,
            'status' => $newCount >= $room->capacity ? 'full' : 'available',
        ]);

        return back()->with('success', 'Student allocated');
    }

    public function checkOutAllocation(Request $request, DormAllocation $dormAllocation): RedirectResponse
    {
        abort_unless($dormAllocation->school_id === $this->schoolId(), 403);

        $validated = $request->validate([
            'checkOutDate' => ['required', 'string', 'max:255'],
        ]);

        $dormAllocation->update([
            'status' => 'checked_out',
            'check_out_date' => $validated['checkOutDate'],
        ]);

        $room = DormRoom::find($dormAllocation->room_id);
        if ($room && $room->status !== 'maintenance') {
            $room->update([
                'occupied_count' => max(0, $room->occupied_count - 1),
                'status' => 'available',
            ]);
        }

        return back()->with('success', 'Checked out');
    }

    // ─── Maintenance ─────────────────────────────────────────────

    public function storeMaintenance(Request $request): RedirectResponse
    {
        $schoolId = $this->schoolId();
        abort_unless($schoolId, 403);

        $validated = $request->validate([
            'location' => ['required', 'string', 'max:255'],
            'locationType' => ['required', 'string', 'max:255'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'priority' => ['required', 'in:low,medium,high,urgent'],
            'assignedTo' => ['nullable', 'string', 'max:255'],
        ]);

        MaintenanceRequest::create([
            ...$this->snakeKeys($validated),
            'school_id' => $schoolId,
            'status' => 'open',
        ]);

        return back()->with('success', 'Maintenance request submitted');
    }

    public function updateMaintenance(Request $request, MaintenanceRequest $maintenanceRequest): RedirectResponse
    {
        abort_unless($maintenanceRequest->school_id === $this->schoolId(), 403);

        $validated = $request->validate([
            'status' => ['required', 'in:open,in_progress,resolved,closed'],
        ]);

        $payload = ['status' => $validated['status']];
        if (in_array($validated['status'], ['resolved', 'closed'], true)) {
            $payload['resolved_at'] = now()->toIso8601String();
        }

        $maintenanceRequest->update($payload);

        return back()->with('success', 'Maintenance request updated');
    }

    public function destroyMaintenance(MaintenanceRequest $maintenanceRequest): RedirectResponse
    {
        abort_unless($maintenanceRequest->school_id === $this->schoolId(), 403);

        $maintenanceRequest->delete();

        return back()->with('success', 'Maintenance request deleted');
    }

    // ─── Security Logs ─────────────────────────────────────────────

    public function storeSecurityLog(Request $request): RedirectResponse
    {
        $schoolId = $this->schoolId();
        abort_unless($schoolId, 403);

        $validated = $request->validate([
            'personName' => ['required', 'string', 'max:255'],
            'personType' => ['required', 'in:visitor,student,staff,vendor'],
            'purpose' => ['nullable', 'string', 'max:255'],
            'checkInTime' => ['required', 'string', 'max:255'],
            'hostName' => ['nullable', 'string', 'max:255'],
            'idType' => ['nullable', 'string', 'max:255'],
            'idNumber' => ['nullable', 'string', 'max:255'],
        ]);

        SecurityLog::create([
            ...$this->snakeKeys($validated),
            'school_id' => $schoolId,
            'logged_by' => auth()->id(),
        ]);

        return back()->with('success', 'Entry logged');
    }

    public function checkOutSecurityLog(Request $request, SecurityLog $securityLog): RedirectResponse
    {
        abort_unless($securityLog->school_id === $this->schoolId(), 403);

        $validated = $request->validate([
            'checkOutTime' => ['required', 'string', 'max:255'],
        ]);

        $securityLog->update(['check_out_time' => $validated['checkOutTime']]);

        return back()->with('success', 'Checked out');
    }
}
