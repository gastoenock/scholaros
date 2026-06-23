<?php

namespace App\Http\Controllers;

use App\Models\SchoolClass;
use App\Models\Staff;
use App\Models\TimetableSlot;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TimetableController extends Controller
{
    public function index(): Response
    {
        $schoolId = $this->schoolId();

        $classes = $schoolId ? SchoolClass::forSchool($schoolId)->orderBy('id')->get() : collect();
        $staff = $schoolId ? Staff::forSchool($schoolId)->orderBy('id')->get() : collect();
        $slots = $schoolId ? TimetableSlot::forSchool($schoolId)->get() : collect();

        return Inertia::render('dashboard/timetable/page', [
            'classes' => $classes,
            'staff' => $staff,
            'slots' => $slots,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $schoolId = $this->schoolId();
        abort_unless($schoolId, 403);

        $validated = $request->validate([
            'classId' => ['required', 'integer', 'exists:classes,id'],
            'day' => ['required', 'in:monday,tuesday,wednesday,thursday,friday'],
            'period' => ['required', 'integer'],
            'subject' => ['required', 'string', 'max:255'],
            'teacherId' => ['nullable', 'integer', 'exists:staff,id'],
            'room' => ['nullable', 'string'],
            'startTime' => ['required', 'string'],
            'endTime' => ['required', 'string'],
            ...$this->academicYearRules(),
            ...$this->academicSemesterRules(),
            ...$this->academicTermRules(),
        ]);

        TimetableSlot::create([
            ...$this->snakeKeys($validated),
            ...$this->academicCalendar()->applyCalendar($schoolId, $validated, false, ['academic_year']),
            'school_id' => $schoolId,
        ]);

        return back()->with('success', 'Slot added');
    }

    public function update(Request $request, TimetableSlot $slot): RedirectResponse
    {
        abort_unless($slot->school_id === $this->schoolId(), 403);

        $validated = $request->validate([
            'subject' => ['sometimes', 'string', 'max:255'],
            'teacherId' => ['nullable', 'integer', 'exists:staff,id'],
            'room' => ['nullable', 'string'],
            'startTime' => ['sometimes', 'string'],
            'endTime' => ['sometimes', 'string'],
        ]);

        $slot->update($this->snakeKeys($validated));

        return back()->with('success', 'Slot updated');
    }

    public function destroy(TimetableSlot $slot): RedirectResponse
    {
        abort_unless($slot->school_id === $this->schoolId(), 403);

        $slot->delete();

        return back()->with('success', 'Slot removed');
    }
}
