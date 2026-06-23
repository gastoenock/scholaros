<?php

namespace App\Http\Controllers;

use App\Models\CallParticipant;
use App\Models\CallSession;
use App\Models\Message;
use App\Models\Notification;
use App\Models\User;
use App\Services\DailyService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class MessageController extends Controller
{
    public function __construct(
        private DailyService $daily,
    ) {}

    public function index(Request $request): Response
    {
        $user = Auth::user();
        $schoolId = $this->schoolId();
        $userId = $user->id;

        $allMessages = Message::query()
            ->when($schoolId, fn ($q) => $q->where('school_id', $schoolId))
            ->where(function ($q) use ($userId) {
                $q->where('sender_id', $userId)->orWhere('receiver_id', $userId);
            })
            ->orderBy('created_at')
            ->get();

        $relatedUserIds = $allMessages
            ->pluck('sender_id')
            ->merge($allMessages->pluck('receiver_id'))
            ->unique()
            ->filter(fn ($id) => $id !== $userId)
            ->values();

        $usersMap = User::whereIn('id', $relatedUserIds)->get()->keyBy('id');

        $threads = [];
        foreach ($allMessages as $message) {
            $otherId = $message->sender_id === $userId
                ? $message->receiver_id
                : $message->sender_id;

            $threads[$otherId] ??= [];
            $threads[$otherId][] = array_merge($message->toArray(), [
                'isMine' => $message->sender_id === $userId,
            ]);
        }

        $conversations = collect($threads)
            ->map(function (array $messages, int $otherId) use ($usersMap, $userId) {
                $last = $messages[array_key_last($messages)];
                $other = $usersMap->get($otherId);

                return [
                    'userId' => $otherId,
                    'userName' => $other?->name ?? 'Unknown',
                    'userRole' => $other?->role,
                    'lastMessage' => $last['body'],
                    'lastMessageAt' => $last['createdAt'],
                    'unreadCount' => collect($messages)
                        ->filter(fn ($m) => ! $m['isMine'] && ! $m['isRead'])
                        ->count(),
                    'isSentByMe' => $last['isMine'],
                ];
            })
            ->sortByDesc('lastMessageAt')
            ->values()
            ->all();

        $schoolUsers = $schoolId
            ? User::query()
                ->where('id', '!=', $userId)
                ->orderBy('name')
                ->get()
                ->map(fn (User $u) => [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'role' => $u->role,
                ])
            : collect();

        $contacts = $schoolUsers
            ->filter(fn (array $u) => ! isset($threads[$u['id']]))
            ->values();

        $newMessagesCount = $allMessages
            ->where('receiver_id', $userId)
            ->where('is_read', false)
            ->count();

        $activeWith = $request->integer('with') ?: null;
        if ($activeWith) {
            $isValidPartner = $schoolUsers->contains(fn (array $u) => $u['id'] === $activeWith);
            if (! $isValidPartner) {
                $activeWith = null;
            }
        }

        $activeCall = null;
        $joinCallId = $request->integer('joinCall') ?: null;

        if ($schoolId) {
            if ($joinCallId) {
                $joinSession = CallSession::forSchool($schoolId)
                    ->where('id', $joinCallId)
                    ->where('status', '!=', 'ended')
                    ->first();

                if ($joinSession && $this->canAccessCall($joinSession, $userId)) {
                    CallParticipant::updateOrCreate(
                        ['call_session_id' => $joinSession->id, 'user_id' => $userId],
                        ['status' => 'joined', 'joined_at' => now()->toIso8601String()],
                    );
                    $activeCall = $joinSession;
                }
            }

            $activeCall ??= CallSession::forSchool($schoolId)
                ->where('status', 'active')
                ->where(function ($q) use ($userId) {
                    $q->where('initiator_id', $userId)
                        ->orWhereHas('participants', fn ($p) => $p->where('user_id', $userId)->whereIn('status', ['invited', 'joined']));
                })
                ->latest()
                ->first();
        }

        return Inertia::render('dashboard/messages/page', [
            'conversations' => $conversations,
            'threads' => $threads,
            'contacts' => $contacts,
            'schoolUsers' => $schoolUsers,
            'activeWith' => $activeWith,
            'newMessagesCount' => $newMessagesCount,
            'currentUserId' => $userId,
            'activeCall' => $activeCall?->toArray(),
            'dailyCallsEnabled' => $this->daily->isConfigured(),
        ]);
    }

    private function canAccessCall(CallSession $callSession, int $userId): bool
    {
        return $callSession->initiator_id === $userId
            || CallParticipant::where('call_session_id', $callSession->id)->where('user_id', $userId)->exists();
    }

    public function store(Request $request): RedirectResponse
    {
        $user = Auth::user();
        $schoolId = $this->requireTenancy();

        $validated = $request->validate([
            'receiverId' => ['required', 'integer', Rule::exists(User::class, 'id')],
            'subject' => ['nullable', 'string', 'max:255'],
            'body' => ['required', 'string'],
            'parentMessageId' => ['nullable', 'integer', 'exists:messages,id'],
        ]);

        $message = Message::create([
            ...$this->snakeKeys($validated),
            'school_id' => $schoolId,
            'sender_id' => $user->id,
            'is_read' => false,
        ]);

        Notification::create([
            'school_id' => $schoolId,
            'user_id' => $validated['receiverId'],
            'title' => $validated['subject'] ?? 'New Message',
            'message' => 'You have a new message from '.($user->name ?? 'someone'),
            'type' => 'message',
            'is_read' => false,
            'related_id' => (string) $message->id,
        ]);

        return redirect()
            ->to($this->tenantRoute('messages.index', ['with' => $validated['receiverId']]))
            ->with('success', 'Message sent');
    }

    public function markThreadRead(Request $request): RedirectResponse
    {
        $userId = Auth::id();

        $validated = $request->validate([
            'with' => ['required', 'integer', Rule::exists(User::class, 'id')],
        ]);

        Message::where('sender_id', $validated['with'])
            ->where('receiver_id', $userId)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return back();
    }

    public function destroy(Message $message): RedirectResponse
    {
        $userId = Auth::id();
        abort_unless($message->receiver_id === $userId || $message->sender_id === $userId, 403);

        $otherId = $message->sender_id === $userId
            ? $message->receiver_id
            : $message->sender_id;

        $message->delete();

        return redirect()
            ->to($this->tenantRoute('messages.index', ['with' => $otherId]))
            ->with('success', 'Message removed');
    }
}
