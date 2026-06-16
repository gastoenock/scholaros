<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function index(): Response
    {
        $notifications = Notification::where('user_id', Auth::id())
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        return Inertia::render('dashboard/notifications/page', [
            'notifications' => $notifications,
        ]);
    }

    public function markRead(Notification $notification): RedirectResponse
    {
        abort_unless($notification->user_id === Auth::id(), 403);

        $notification->update(['is_read' => true]);

        return back();
    }

    public function markAllRead(): RedirectResponse
    {
        Notification::where('user_id', Auth::id())
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return back()->with('success', 'All notifications marked as read');
    }

    public function broadcast(Request $request): RedirectResponse
    {
        $user = Auth::user();
        $schoolId = $this->schoolId();
        abort_unless($schoolId, 403);
        abort_unless($user?->isPlatformAdmin() || $user?->role === 'admin', 403);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string'],
        ]);

        // Notify all users in the school (mirrors Convex broadcastAnnouncement).
        $userIds = User::query()->pluck('id');

        foreach ($userIds as $userId) {
            Notification::create([
                'school_id' => $schoolId,
                'user_id' => $userId,
                'title' => $validated['title'],
                'message' => $validated['message'],
                'type' => 'announcement',
                'is_read' => false,
            ]);
        }

        return back()->with('success', 'Announcement sent to all school users');
    }
}
