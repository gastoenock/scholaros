<?php

namespace App\Http\Controllers;

use App\Models\CallParticipant;
use App\Models\CallSession;
use App\Models\Notification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class CallController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $user = Auth::user();
        $schoolId = $this->schoolId();
        abort_unless($schoolId, 403);

        $validated = $request->validate([
            'callType' => ['required', 'in:audio,video,conference'],
            'participantIds' => ['required', 'array', 'min:1'],
            'participantIds.*' => ['integer', 'exists:users,id'],
            'title' => ['nullable', 'string', 'max:255'],
        ]);

        $participantIds = collect($validated['participantIds'])
            ->filter(fn ($id) => (int) $id !== $user->id)
            ->unique()
            ->values();

        abort_if($participantIds->isEmpty(), 422, 'Select at least one participant.');

        $roomCode = Str::upper(Str::random(8));

        $session = CallSession::create([
            'school_id' => $schoolId,
            'initiator_id' => $user->id,
            'call_type' => $validated['callType'],
            'room_code' => $roomCode,
            'title' => $validated['title'] ?? null,
            'status' => 'active',
            'started_at' => now()->toIso8601String(),
        ]);

        CallParticipant::create([
            'call_session_id' => $session->id,
            'user_id' => $user->id,
            'status' => 'joined',
            'joined_at' => now()->toIso8601String(),
        ]);

        foreach ($participantIds as $participantId) {
            CallParticipant::create([
                'call_session_id' => $session->id,
                'user_id' => $participantId,
                'status' => 'invited',
            ]);

            Notification::create([
                'school_id' => $schoolId,
                'user_id' => $participantId,
                'title' => ucfirst($validated['callType']).' call',
                'message' => ($user->name ?? 'Someone').' is calling you. Room: '.$roomCode,
                'type' => 'call',
                'is_read' => false,
                'related_id' => (string) $session->id,
            ]);
        }

        return back()->with('success', 'Call started')->with('activeCallId', $session->id);
    }

    public function join(CallSession $callSession): RedirectResponse
    {
        $userId = Auth::id();
        abort_unless($callSession->school_id === $this->schoolId(), 403);
        abort_if($callSession->status === 'ended', 422, 'This call has ended.');

        CallParticipant::updateOrCreate(
            ['call_session_id' => $callSession->id, 'user_id' => $userId],
            ['status' => 'joined', 'joined_at' => now()->toIso8601String()],
        );

        if ($callSession->status === 'ringing') {
            $callSession->update(['status' => 'active', 'started_at' => now()->toIso8601String()]);
        }

        return back()->with('activeCallId', $callSession->id);
    }

    public function end(CallSession $callSession): RedirectResponse
    {
        $userId = Auth::id();
        abort_unless(
            $callSession->school_id === $this->schoolId()
            && ($callSession->initiator_id === $userId || CallParticipant::where('call_session_id', $callSession->id)->where('user_id', $userId)->exists()),
            403,
        );

        $callSession->update([
            'status' => 'ended',
            'ended_at' => now()->toIso8601String(),
        ]);

        CallParticipant::where('call_session_id', $callSession->id)
            ->whereNull('left_at')
            ->update(['left_at' => now()->toIso8601String()]);

        return back()->with('success', 'Call ended');
    }
}
