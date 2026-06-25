<?php

namespace App\Http\Controllers;

use App\Models\SchoolClass;
use App\Models\Staff;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StaffController extends Controller
{
    public function index(): Response
    {
        $schoolId = $this->schoolId();

        $staff = $schoolId
            ? Staff::forSchool($schoolId)->orderBy('id')->get()
            : collect();

        $stats = [
            'total' => $staff->count(),
            'teachers' => $staff->where('role', 'teacher')->count(),
            'active' => $staff->where('status', 'active')->count(),
        ];

        return Inertia::render('dashboard/staff/page', [
            'staff' => $staff,
            'stats' => $stats,
        ]);
    }

    public function show(Staff $staff): Response
    {
        abort_unless($staff->school_id === $this->schoolId(), 403);

        $staff->load('branch');

        $taughtClasses = SchoolClass::forSchool($staff->school_id)
            ->where('class_teacher_id', $staff->id)
            ->with('assignedRoom:id,name,building')
            ->orderBy('name')
            ->get(['id', 'uuid', 'name', 'grade_level', 'section', 'room', 'class_room_id']);

        return Inertia::render('dashboard/staff/show', [
            'staffMember' => $staff,
            'taughtClasses' => $taughtClasses,
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
            'department' => ['nullable', 'string'],
            'designation' => ['nullable', 'string'],
            'role' => ['required', 'in:teacher,admin_staff,support_staff,principal,vice_principal'],
            'joinDate' => ['nullable', 'string'],
            'qualification' => ['nullable', 'string'],
            'subjects' => ['nullable', 'array'],
            'subjects.*' => ['string'],
            'email' => ['nullable', 'string'],
            'phone' => ['nullable', 'string'],
            'address' => ['nullable', 'string'],
            'salary' => ['nullable', 'numeric'],
            'emergencyContact' => ['nullable', 'array'],
            'emergencyContact.name' => ['required_with:emergencyContact', 'string'],
            'emergencyContact.phone' => ['required_with:emergencyContact', 'string'],
            'emergencyContact.relationship' => ['required_with:emergencyContact', 'string'],
        ]);

        $count = Staff::forSchool($schoolId)->count();

        Staff::create([
            ...$this->snakeKeys($validated),
            'school_id' => $schoolId,
            'staff_id' => sprintf('STF-%04d', $count + 1),
            'status' => 'active',
        ]);

        return back()->with('success', 'Staff member added!');
    }

    public function update(Request $request, Staff $staff): RedirectResponse
    {
        abort_unless($staff->school_id === $this->schoolId(), 403);

        $validated = $request->validate([
            'schoolBranchId' => ['nullable', 'integer', 'exists:school_branches,id'],
            'firstName' => ['sometimes', 'string', 'max:255'],
            'lastName' => ['sometimes', 'string', 'max:255'],
            'dateOfBirth' => ['nullable', 'string'],
            'gender' => ['nullable', 'in:male,female,other'],
            'nationality' => ['nullable', 'string'],
            'department' => ['nullable', 'string'],
            'designation' => ['nullable', 'string'],
            'role' => ['sometimes', 'in:teacher,admin_staff,support_staff,principal,vice_principal'],
            'joinDate' => ['nullable', 'string'],
            'qualification' => ['nullable', 'string'],
            'subjects' => ['nullable', 'array'],
            'subjects.*' => ['string'],
            'email' => ['nullable', 'string'],
            'phone' => ['nullable', 'string'],
            'address' => ['nullable', 'string'],
            'salary' => ['nullable', 'numeric'],
            'status' => ['nullable', 'in:active,inactive,on_leave'],
            'emergencyContact' => ['nullable', 'array'],
            'emergencyContact.name' => ['required_with:emergencyContact', 'string'],
            'emergencyContact.phone' => ['required_with:emergencyContact', 'string'],
            'emergencyContact.relationship' => ['required_with:emergencyContact', 'string'],
        ]);

        $staff->update($this->snakeKeys($validated));

        return back()->with('success', 'Staff member updated!');
    }

    public function destroy(Staff $staff): RedirectResponse
    {
        abort_unless($staff->school_id === $this->schoolId(), 403);

        $staff->delete();

        return back()->with('success', 'Staff member removed');
    }
}
