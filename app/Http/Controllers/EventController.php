<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\SchoolBranch;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EventController extends Controller
{
    public function index(Request $request): Response
    {
        $schoolId = $this->schoolId();

        $events = collect();
        $branches = collect();

        if ($schoolId) {
            $query = Event::forSchool($schoolId)->with('branch')->orderBy('start_at');

            if ($request->filled('status') && $request->status !== 'all') {
                $query->where('status', $request->status);
            }

            if ($request->filled('eventType') && $request->eventType !== 'all') {
                $query->where('event_type', $request->eventType);
            }

            $events = $query->get();
            $branches = SchoolBranch::forSchool($schoolId)->orderBy('name')->get();
        }

        return Inertia::render('dashboard/events/page', [
            'events' => $events,
            'branches' => $branches,
            'filters' => [
                'status' => $request->get('status', 'all'),
                'eventType' => $request->get('eventType', 'all'),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $schoolId = $this->schoolId();
        abort_unless($schoolId, 403);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'startAt' => ['required', 'string'],
            'endAt' => ['nullable', 'string'],
            'location' => ['nullable', 'string', 'max:255'],
            'eventType' => ['required', 'in:general,academic,sports,cultural,holiday,meeting,other'],
            'status' => ['nullable', 'in:scheduled,cancelled,completed'],
            'schoolBranchId' => ['nullable', 'integer', 'exists:school_branches,id'],
        ]);

        Event::create([
            ...$this->snakeKeys($validated),
            'school_id' => $schoolId,
            'created_by' => auth()->id(),
            'status' => $validated['status'] ?? 'scheduled',
        ]);

        return back()->with('success', 'Event created');
    }

    public function update(Request $request, Event $event): RedirectResponse
    {
        abort_unless($event->school_id === $this->schoolId(), 403);

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'startAt' => ['sometimes', 'string'],
            'endAt' => ['nullable', 'string'],
            'location' => ['nullable', 'string', 'max:255'],
            'eventType' => ['sometimes', 'in:general,academic,sports,cultural,holiday,meeting,other'],
            'status' => ['nullable', 'in:scheduled,cancelled,completed'],
            'schoolBranchId' => ['nullable', 'integer', 'exists:school_branches,id'],
        ]);

        $event->update($this->snakeKeys($validated));

        return back()->with('success', 'Event updated');
    }

    public function destroy(Event $event): RedirectResponse
    {
        abort_unless($event->school_id === $this->schoolId(), 403);

        $event->delete();

        return back()->with('success', 'Event removed');
    }
}
