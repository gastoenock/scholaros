<?php

namespace App\Http\Controllers;

use App\Models\Meeting;
use App\Models\Staff;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MeetingController extends Controller
{
    public function index(Request $request): Response
    {
        $schoolId = $this->schoolId();

        $meetings = collect();

        if ($schoolId) {
            $query = Meeting::forSchool($schoolId)->orderByDesc('scheduled_at');

            if ($request->filled('status') && $request->status !== 'all') {
                $query->where('status', $request->status);
            }

            $meetings = $query->get()->map(fn (Meeting $meeting) => $this->enrichMeeting($meeting));
        }

        $staff = $schoolId ? Staff::forSchool($schoolId)->orderBy('last_name')->get() : collect();
        $students = $schoolId ? Student::forSchool($schoolId)->orderBy('last_name')->get() : collect();

        return Inertia::render('dashboard/meetings/page', [
            'meetings' => $meetings,
            'staff' => $staff,
            'students' => $students,
            'filters' => [
                'status' => $request->get('status', 'all'),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $schoolId = $this->schoolId();
        abort_unless($schoolId, 403);

        $validated = $request->validate([
            'teacherId' => ['required', 'integer', 'exists:staff,id'],
            'studentId' => ['required', 'integer', 'exists:students,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'scheduledAt' => ['required', 'string'],
            'durationMinutes' => ['required', 'integer', 'min:15'],
            'meetingType' => ['required', 'in:in_person,virtual'],
            'location' => ['nullable', 'string'],
            'meetingLink' => ['nullable', 'string'],
        ]);

        Meeting::create([
            ...$this->snakeKeys($validated),
            'school_id' => $schoolId,
            'parent_id' => auth()->id(),
            'status' => 'requested',
        ]);

        return back()->with('success', 'Meeting requested');
    }

    public function updateStatus(Request $request, Meeting $meeting): RedirectResponse
    {
        abort_unless($meeting->school_id === $this->schoolId(), 403);

        $validated = $request->validate([
            'status' => ['required', 'in:confirmed,cancelled,completed'],
            'cancelReason' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
        ]);

        $meeting->update($this->snakeKeys($validated));

        return back()->with('success', "Meeting {$validated['status']}");
    }

    public function destroy(Meeting $meeting): RedirectResponse
    {
        abort_unless($meeting->school_id === $this->schoolId(), 403);

        $meeting->delete();

        return back()->with('success', 'Meeting removed');
    }

    /**
     * @return array<string, mixed>
     */
    private function enrichMeeting(Meeting $meeting): array
    {
        $parent = User::find($meeting->parent_id);
        $teacher = Staff::find($meeting->teacher_id);
        $student = Student::find($meeting->student_id);

        return array_merge($meeting->toArray(), [
            'parentName' => $parent?->name ?? 'Unknown',
            'teacherName' => $teacher
                ? trim("{$teacher->first_name} {$teacher->last_name}")
                : 'Unknown',
            'studentName' => $student
                ? trim("{$student->first_name} {$student->last_name}")
                : 'Unknown',
        ]);
    }
}
