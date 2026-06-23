<?php

namespace App\Http\Controllers;

use App\Models\CallParticipant;
use App\Models\CallSession;
use App\Models\Notification;
use App\Models\User;
use App\Services\DailyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CallController extends Controller
{
    public function __construct(
        private DailyService $daily,
    ) {}

    public function store(Request $request): RedirectResponse
    {
        $user = Auth::user();
        $schoolId = $this->requireTenancy();

        $validated = $request->validate([
            'callType' => ['required', 'in:audio,video,conference'],
            'participantIds' => ['required', 'array', 'min:1'],
            'participantIds.*' => ['integer', Rule::exists(User::class, 'id')],
            'title' => ['nullable', 'string', 'max:255'],
        ]);

        $participantIds = collect($validated['participantIds'])
            ->filter(fn ($id) => (int) $id !== $user->id)
            ->unique()
            ->values();

        abort_if($participantIds->isEmpty(), 422, 'Select at least one participant.');
        abort_unless($this->daily->isConfigured(), 503, 'Video calling is not configured. Add DAILY_API_KEY to your environment.');

        $roomCode = Str::upper(Str::random(8));
        $dailyRoom = $this->daily->createRoom($schoolId, $validated['callType']);

        $session = CallSession::create([
            'school_id' => $schoolId,
            'initiator_id' => $user->id,
            'call_type' => $validated['callType'],
            'room_code' => $roomCode,
            'daily_room_name' => $dailyRoom['name'],
            'daily_room_url' => $dailyRoom['url'],
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
                'message' => ($user->name ?? 'Someone').' is calling you. Tap to join.',
                'type' => 'call',
                'is_read' => false,
                'related_id' => (string) $session->id,
            ]);
        }

        return redirect()
            ->to($this->tenantRoute('messages.index', ['joinCall' => $session->id]))
            ->with('success', 'Call started');
    }

    public function join(CallSession $callSession): RedirectResponse
    {
        $userId = Auth::id();
        abort_unless($callSession->school_id === $this->schoolId(), 403);
        abort_if($callSession->status === 'ended', 422, 'This call has ended.');
        $this->assertCanAccessCall($callSession, $userId);

        CallParticipant::updateOrCreate(
            ['call_session_id' => $callSession->id, 'user_id' => $userId],
            ['status' => 'joined', 'joined_at' => now()->toIso8601String()],
        );

        if ($callSession->status === 'ringing') {
            $callSession->update(['status' => 'active', 'started_at' => now()->toIso8601String()]);
        }

        return redirect()
            ->to($this->tenantRoute('messages.index', ['joinCall' => $callSession->id]))
            ->with('success', 'Joined call');
    }

    public function token(CallSession $callSession): JsonResponse
    {
        $user = Auth::user();
        abort_unless($callSession->school_id === $this->schoolId(), 403);
        abort_if($callSession->status === 'ended', 422, 'This call has ended.');
        abort_unless($callSession->daily_room_name && $callSession->daily_room_url, 422, 'This call room is not available.');
        abort_unless($this->daily->isConfigured(), 503, 'Video calling is not configured.');
        $this->assertCanAccessCall($callSession, $user->id);

        $token = $this->daily->createMeetingToken(
            $callSession->daily_room_name,
            $user->name ?? 'Guest',
            $callSession->initiator_id === $user->id,
            $callSession->call_type,
        );

        return response()->json([
            'token' => $token,
            'roomUrl' => $callSession->daily_room_url,
            'callType' => $callSession->call_type,
        ]);
    }

    public function end(CallSession $callSession): RedirectResponse
    {
        $userId = Auth::id();
        abort_unless(
            $callSession->school_id === $this->schoolId()
            && ($callSession->initiator_id === $userId || CallParticipant::where('call_session_id', $callSession->id)->where('user_id', $userId)->exists()),
            403,
        );

        $this->daily->deleteRoom($callSession->daily_room_name);

        $callSession->update([
            'status' => 'ended',
            'ended_at' => now()->toIso8601String(),
        ]);

        CallParticipant::where('call_session_id', $callSession->id)
            ->whereNull('left_at')
            ->update(['left_at' => now()->toIso8601String()]);

        return back()->with('success', 'Call ended');
    }

    private function assertCanAccessCall(CallSession $callSession, int $userId): void
    {
        abort_unless(
            $callSession->initiator_id === $userId
            || CallParticipant::where('call_session_id', $callSession->id)->where('user_id', $userId)->exists(),
            403,
        );
    }
}
