<?php

namespace App\Http\Controllers;

use App\Models\Meeting;
use App\Models\Staff;
use App\Models\Student;
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
            $query = Meeting::forSchool($schoolId)
                ->with(['parent', 'staff', 'students'])
                ->orderByDesc('scheduled_at');

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
            'staffIds' => ['required', 'array', 'min:1'],
            'staffIds.*' => ['integer', 'exists:staff,id'],
            'studentIds' => ['required', 'array', 'min:1'],
            'studentIds.*' => ['integer', 'exists:students,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'scheduledAt' => ['required', 'string'],
            'durationMinutes' => ['required', 'integer', 'min:15'],
            'meetingType' => ['required', 'in:in_person,virtual'],
            'location' => ['nullable', 'string'],
            'meetingLink' => ['nullable', 'string'],
        ]);

        $meeting = Meeting::create([
            'school_id' => $schoolId,
            'parent_id' => auth()->id(),
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'scheduled_at' => $validated['scheduledAt'],
            'duration_minutes' => $validated['durationMinutes'],
            'meeting_type' => $validated['meetingType'],
            'location' => $validated['location'] ?? null,
            'meeting_link' => $validated['meetingLink'] ?? null,
            'status' => 'requested',
        ]);

        $meeting->staff()->sync($validated['staffIds']);
        $meeting->students()->sync($validated['studentIds']);

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
        $staffNames = $meeting->staff
            ->map(fn (Staff $s) => trim("{$s->first_name} {$s->last_name}"))
            ->values()
            ->all();

        $studentNames = $meeting->students
            ->map(fn (Student $s) => trim("{$s->first_name} {$s->last_name}"))
            ->values()
            ->all();

        return array_merge($meeting->toArray(), [
            'parentName' => $meeting->parent?->name ?? 'Unknown',
            'staffIds' => $meeting->staff->pluck('id')->all(),
            'studentIds' => $meeting->students->pluck('id')->all(),
            'staffNames' => $staffNames,
            'studentNames' => $studentNames,
            'teacherName' => $staffNames[0] ?? 'Unknown',
            'studentName' => $studentNames[0] ?? 'Unknown',
        ]);
    }
}
