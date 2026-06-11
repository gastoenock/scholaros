<?php

namespace App\Http\Controllers;

use App\Models\AttendanceRecord;
use App\Models\SchoolClass;
use App\Models\Staff;
use App\Models\Student;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceController extends Controller
{
    public function index(): Response
    {
        $schoolId = $this->schoolId();

        $classes = $schoolId ? SchoolClass::forSchool($schoolId)->orderBy('name')->get() : collect();
        $students = $schoolId ? Student::forSchool($schoolId)->orderBy('last_name')->get() : collect();
        $staff = $schoolId ? Staff::forSchool($schoolId)->orderBy('last_name')->get() : collect();
        $records = $schoolId ? AttendanceRecord::forSchool($schoolId)->get() : collect();

        return Inertia::render('dashboard/attendance/page', [
            'classes' => $classes,
            'students' => $students,
            'staff' => $staff,
            'records' => $records,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $schoolId = $this->schoolId();
        abort_unless($schoolId, 403);

        $validated = $request->validate([
            'date' => ['required', 'string'],
            'type' => ['required', 'in:student,staff'],
            'records' => ['required', 'array'],
            'records.*.personId' => ['required', 'string'],
            'records.*.status' => ['required', 'in:present,absent,late,excused'],
            'records.*.classId' => ['nullable', 'integer', 'exists:classes,id'],
            'records.*.note' => ['nullable', 'string'],
        ]);

        $personIds = collect($validated['records'])->pluck('personId');

        AttendanceRecord::forSchool($schoolId)
            ->where('date', $validated['date'])
            ->where('type', $validated['type'])
            ->whereIn('person_id', $personIds)
            ->delete();

        $markedBy = auth()->id();

        foreach ($validated['records'] as $rec) {
            AttendanceRecord::create([
                'school_id' => $schoolId,
                'date' => $validated['date'],
                'type' => $validated['type'],
                'person_id' => $rec['personId'],
                'status' => $rec['status'],
                'class_id' => $rec['classId'] ?? null,
                'marked_by' => $markedBy,
                'note' => $rec['note'] ?? null,
            ]);
        }

        return back()->with('success', 'Attendance saved successfully');
    }
}
