<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class MessageController extends Controller
{
    public function index(): Response
    {
        $user = Auth::user();
        $schoolId = $this->schoolId();

        $inbox = Message::where('receiver_id', $user->id)
            ->orderByDesc('created_at')
            ->limit(100)
            ->get();

        $sent = Message::where('sender_id', $user->id)
            ->orderByDesc('created_at')
            ->limit(100)
            ->get();

        // Lookup map for sender/receiver names (mirrors the Convex joins).
        $userIds = $inbox->pluck('sender_id')
            ->merge($sent->pluck('receiver_id'))
            ->unique()
            ->values();
        $names = User::whereIn('id', $userIds)->pluck('name', 'id');

        $users = $schoolId
            ? User::where('school_id', $schoolId)->orderBy('name')->get()
            : collect();

        return Inertia::render('dashboard/messages/page', [
            'inbox' => $inbox->map(fn ($m) => [
                ...$m->toArray(),
                'senderName' => $names[$m->sender_id] ?? 'Unknown',
            ]),
            'sent' => $sent->map(fn ($m) => [
                ...$m->toArray(),
                'receiverName' => $names[$m->receiver_id] ?? 'Unknown',
            ]),
            'users' => $users->map(fn ($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'role' => $u->role,
            ]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = Auth::user();
        $schoolId = $this->schoolId();
        abort_unless($schoolId, 403);

        $validated = $request->validate([
            'receiverId' => ['required', 'integer', 'exists:users,id'],
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

        // Notify recipient (mirrors Convex sendMessage behavior).
        Notification::create([
            'school_id' => $schoolId,
            'user_id' => $validated['receiverId'],
            'title' => $validated['subject'] ?? 'New Message',
            'message' => 'You have a new message from '.($user->name ?? 'someone'),
            'type' => 'message',
            'is_read' => false,
            'related_id' => (string) $message->id,
        ]);

        return back()->with('success', 'Message sent');
    }

    public function markRead(Message $message): RedirectResponse
    {
        abort_unless($message->receiver_id === Auth::id(), 403);

        $message->update(['is_read' => true]);

        return back();
    }

    public function destroy(Message $message): RedirectResponse
    {
        $userId = Auth::id();
        abort_unless($message->receiver_id === $userId || $message->sender_id === $userId, 403);

        $message->delete();

        return back();
    }
}
