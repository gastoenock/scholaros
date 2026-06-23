import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { router } from "@inertiajs/react";
import { routerDeleteWithConfirm } from "@/lib/confirm.ts";
import { DashboardLayout } from "../_components/layout.tsx";
import { useCurrentSchool } from "../_components/use-current-school.ts";
import { cn } from "@/lib/utils.ts";
import { toast } from "sonner";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog.tsx";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import {
  ArrowLeft, CheckCheck, MessageSquarePlus, MoreVertical, Paperclip, Camera, Mic,
  Phone, Search, Send, Smile, Star, Trash2, Users, Video, VideoOff, X,
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { DailyCallOverlay } from "@/components/daily-call-overlay.tsx";

const FAVORITES_KEY = "scholaros:message-favorites";

const AVATAR_GRADIENTS = [
  "from-violet-400 via-purple-400 to-indigo-500",
  "from-orange-400 via-amber-400 to-yellow-400",
  "from-pink-400 via-rose-400 to-fuchsia-500",
  "from-cyan-400 via-sky-400 to-blue-500",
  "from-emerald-400 via-teal-400 to-green-500",
  "from-red-400 via-rose-400 to-pink-500",
];

export type ThreadMessage = {
  id: number;
  schoolId: number;
  senderId: number;
  receiverId: number;
  subject?: string | null;
  body: string;
  isRead: boolean;
  parentMessageId?: number | null;
  createdAt: string;
  isMine: boolean;
};

export type Conversation = {
  userId: number;
  userName: string;
  userRole?: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  isSentByMe: boolean;
};

export type Contact = {
  id: number;
  name?: string | null;
  email?: string | null;
  role?: string | null;
};

type PageProps = {
  conversations: Conversation[];
  threads: Record<string, ThreadMessage[]>;
  contacts: Contact[];
  schoolUsers: Contact[];
  activeWith: number | null;
  newMessagesCount: number;
  currentUserId: number;
  activeCall: CallSession | null;
  dailyCallsEnabled: boolean;
};

type CallSession = {
  id: number;
  schoolId: number;
  initiatorId: number;
  callType: "audio" | "video" | "conference";
  roomCode: string;
  dailyRoomName?: string | null;
  dailyRoomUrl?: string | null;
  title?: string | null;
  status: string;
  startedAt?: string | null;
};

type MessageSearchMatch = {
  userId: number;
  userName: string;
  snippet: string;
  messageId: number;
};

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function snippetAroundMatch(text: string, query: string, radius = 40) {
  const lower = text.toLowerCase();
  const index = lower.indexOf(query);
  if (index === -1) return text.slice(0, radius * 2);

  const start = Math.max(0, index - radius);
  const end = Math.min(text.length, index + query.length + radius);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < text.length ? "…" : "";

  return `${prefix}${text.slice(start, end)}${suffix}`;
}

function useMessageSearch(
  query: string,
  conversations: Conversation[],
  threads: Record<string, ThreadMessage[]>,
  schoolUsers: Contact[],
) {
  return useMemo(() => {
    const q = normalizeSearch(query);
    if (!q) {
      return { isSearching: false, matchingConversations: conversations, messageMatches: [] as MessageSearchMatch[] };
    }

    const matchingUserIds = new Set<number>();
    const messageMatches: MessageSearchMatch[] = [];

    for (const conv of conversations) {
      if (
        conv.userName.toLowerCase().includes(q)
        || (conv.userRole ?? "").toLowerCase().includes(q)
        || conv.lastMessage.toLowerCase().includes(q)
      ) {
        matchingUserIds.add(conv.userId);
      }
    }

    for (const [userIdStr, messages] of Object.entries(threads)) {
      const userId = Number(userIdStr);
      const userName = conversations.find((c) => c.userId === userId)?.userName
        ?? schoolUsers.find((u) => u.id === userId)?.name
        ?? "Unknown";

      for (const msg of messages) {
        if (msg.body.toLowerCase().includes(q) || (msg.subject ?? "").toLowerCase().includes(q)) {
          matchingUserIds.add(userId);
          messageMatches.push({
            userId,
            userName,
            snippet: snippetAroundMatch(msg.body, q),
            messageId: msg.id,
          });
        }
      }
    }

    for (const user of schoolUsers) {
      if (
        (user.name ?? "").toLowerCase().includes(q)
        || (user.email ?? "").toLowerCase().includes(q)
        || (user.role ?? "").toLowerCase().includes(q)
      ) {
        matchingUserIds.add(user.id);
      }
    }

    const matchingConversations = conversations
      .filter((c) => matchingUserIds.has(c.userId))
      .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

    return { isSearching: true, matchingConversations, messageMatches };
  }, [query, conversations, threads, schoolUsers]);
}

function avatarGradient(userId: number) {
  return AVATAR_GRADIENTS[userId % AVATAR_GRADIENTS.length];
}

function initials(name?: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatLastSeen(dateStr?: string | null) {
  if (!dateStr) return "Offline";
  const date = new Date(dateStr);
  if (isToday(date)) return `last seen today at ${format(date, "HH:mm")}`;
  if (isYesterday(date)) return `last seen yesterday at ${format(date, "HH:mm")}`;
  return `last seen ${format(date, "MMM d, HH:mm")}`;
}

function CallOverlay({
  call,
  partnerName,
  onEnd,
}: {
  call: CallSession;
  partnerName?: string;
  onEnd: () => void;
}) {
  if (call.dailyRoomUrl) {
    return <DailyCallOverlay call={call} partnerName={partnerName} onEnd={onEnd} />;
  }

  const label = call.callType === "conference" ? "Conference call" : call.callType === "video" ? "Video call" : "Audio call";

  return (
    <div className="fixed inset-0 z-50 bg-blue-950/95 flex flex-col items-center justify-center text-white p-6">
      <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center mb-6 animate-pulse">
        {call.callType === "video" ? <Video className="h-10 w-10" /> : call.callType === "conference" ? <Users className="h-10 w-10" /> : <Phone className="h-10 w-10" />}
      </div>
      <p className="text-xl font-semibold">{partnerName ?? call.title ?? "Call in progress"}</p>
      <p className="text-blue-200 text-sm mt-1">{label}</p>
      <p className="text-blue-300 text-xs mt-2 font-mono">Room: {call.roomCode}</p>
      <p className="text-blue-200/80 text-xs mt-6 text-center max-w-sm">
        Daily.co is not configured for this call session. Add DAILY_API_KEY to enable live audio and video.
      </p>
      <Button
        type="button"
        variant="destructive"
        className="mt-8 rounded-full px-8 cursor-pointer"
        onClick={onEnd}
      >
        <Phone className="h-4 w-4 mr-2 rotate-[135deg]" />
        End call
      </Button>
    </div>
  );
}

function ConferenceDialog({
  open,
  onOpenChange,
  schoolUsers,
  partnerId,
  onStart,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolUsers: Contact[];
  partnerId: number;
  onStart: (participantIds: number[]) => void;
}) {
  const [selected, setSelected] = useState<number[]>([partnerId]);

  useEffect(() => {
    if (open) setSelected([partnerId]);
  }, [open, partnerId]);

  const toggle = (id: number) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start conference</DialogTitle>
          <DialogDescription>Select participants to invite.</DialogDescription>
        </DialogHeader>
        <div className="max-h-64 overflow-y-auto space-y-1">
          {schoolUsers.map((user) => (
            <label key={user.id} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-blue-50 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.includes(user.id)}
                onChange={() => toggle(user.id)}
                className="rounded border-blue-300"
              />
              <GradientAvatar userId={user.id} name={user.name} size="sm" />
              <span className="text-sm">{user.name}</span>
            </label>
          ))}
        </div>
        <Button
          type="button"
          className="w-full bg-blue-600 hover:bg-blue-700 cursor-pointer"
          disabled={selected.length === 0}
          onClick={() => { onStart(selected); onOpenChange(false); }}
        >
          <Users className="h-4 w-4 mr-2" />
          Start conference ({selected.length})
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function formatDateSeparator(dateStr: string) {
  const date = new Date(dateStr);
  if (isToday(date)) return `Today, ${format(date, "HH:mm")}`;
  if (isYesterday(date)) return `Yesterday, ${format(date, "HH:mm")}`;
  return format(date, "EEEE, HH:mm");
}

function useFavorites() {
  const [favorites, setFavorites] = useState<number[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      if (stored) setFavorites(JSON.parse(stored) as number[]);
    } catch {
      setFavorites([]);
    }
  }, []);

  const toggleFavorite = useCallback((userId: number) => {
    setFavorites((prev) => {
      const next = prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId];
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { favorites, toggleFavorite, isFavorite: (id: number) => favorites.includes(id) };
}

function GradientAvatar({
  userId,
  name,
  size = "md",
}: {
  userId: number;
  name?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass = size === "sm" ? "h-10 w-10 text-xs" : size === "lg" ? "h-11 w-11 text-sm" : "h-12 w-12 text-sm";
  return (
    <div
      className={cn(
        "rounded-full bg-gradient-to-br flex items-center justify-center font-semibold text-white shrink-0 shadow-sm",
        avatarGradient(userId),
        sizeClass,
      )}
    >
      {initials(name)}
    </div>
  );
}

function ConversationRow({
  conversation,
  isActive,
  isFavorite,
  onSelect,
  subtitle,
}: {
  conversation: Conversation;
  isActive: boolean;
  isFavorite: boolean;
  onSelect: () => void;
  subtitle?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer border-b border-blue-50/80",
        isActive ? "bg-blue-50" : "hover:bg-blue-50/60",
      )}
    >
      <GradientAvatar userId={conversation.userId} name={conversation.userName} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-sm text-gray-800 truncate">{conversation.userName}</span>
          {isFavorite && <Star className="h-3 w-3 fill-blue-500 text-blue-500 shrink-0" />}
        </div>
        <p className="text-xs text-gray-500 truncate mt-0.5">
          {subtitle ?? `${conversation.isSentByMe ? "You: " : ""}${conversation.lastMessage}`}
        </p>
      </div>
      {conversation.unreadCount > 0 && (
        <span className="h-5 min-w-5 px-1.5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
          {conversation.unreadCount}
        </span>
      )}
    </button>
  );
}

function SearchMatchRow({
  match,
  isActive,
  onSelect,
}: {
  match: MessageSearchMatch;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer border-b border-blue-50/80",
        isActive ? "bg-blue-50" : "hover:bg-blue-50/60",
      )}
    >
      <GradientAvatar userId={match.userId} name={match.userName} />
      <div className="flex-1 min-w-0">
        <span className="font-semibold text-sm text-gray-800 truncate block">{match.userName}</span>
        <p className="text-xs text-gray-500 truncate mt-0.5">{match.snippet}</p>
      </div>
    </button>
  );
}

function NewConversationDialog({
  open,
  onOpenChange,
  schoolUsers,
  onSelectUser,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolUsers: Contact[];
  onSelectUser: (userId: number) => void;
}) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const filteredUsers = useMemo(() => {
    const q = normalizeSearch(query);
    if (!q) return schoolUsers;
    return schoolUsers.filter((user) =>
      (user.name ?? "").toLowerCase().includes(q)
      || (user.email ?? "").toLowerCase().includes(q)
      || (user.role ?? "").toLowerCase().includes(q),
    );
  }, [query, schoolUsers]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New conversation</DialogTitle>
          <DialogDescription>
            Choose a colleague to start messaging.
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, or role…"
            className="pl-9"
            autoFocus
          />
        </div>
        <div className="max-h-72 overflow-y-auto -mx-1">
          {filteredUsers.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No contacts found.</p>
          ) : (
            filteredUsers.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => {
                  onSelectUser(user.id);
                  onOpenChange(false);
                }}
                className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-blue-50 text-left cursor-pointer transition-colors"
              >
                <GradientAvatar userId={user.id} name={user.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {user.role ? `${user.role} · ` : ""}{user.email}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MessageBubble({
  message,
  onDelete,
}: {
  message: ThreadMessage;
  onDelete: () => void;
}) {
  const isMine = message.isMine;
  const time = format(new Date(message.createdAt), "h:mm a");

  return (
    <div className={cn("group flex", isMine ? "justify-end" : "justify-start")}>
      <div className="relative max-w-[80%]">
        <div
          className={cn(
            "px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm",
            isMine
              ? "bg-blue-500 text-white rounded-2xl rounded-br-sm"
              : "bg-white text-gray-900 rounded-2xl rounded-bl-sm",
          )}
        >
          {message.body}
          <div className={cn("flex items-center gap-1 mt-1", isMine ? "justify-end text-blue-100" : "justify-end text-gray-400")}>
            <span className="text-[10px]">{time}</span>
            {isMine && (
              <CheckCheck className={cn("h-3.5 w-3.5", message.isRead ? "text-blue-100" : "text-blue-200/70")} />
            )}
          </div>
        </div>
        {isMine && (
          <button
            type="button"
            onClick={onDelete}
            className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 cursor-pointer transition-opacity"
            aria-label="Delete message"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function ChatPanel({
  partnerId,
  partnerName,
  partnerLastSeen,
  messages,
  isFavorite,
  onToggleFavorite,
  onBack,
  showBack,
  schoolUsers,
  onStartCall,
}: {
  partnerId: number;
  partnerName: string;
  partnerLastSeen?: string | null;
  messages: ThreadMessage[];
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onBack?: () => void;
  showBack?: boolean;
  schoolUsers: Contact[];
  onStartCall: (type: "audio" | "video" | "conference", participantIds: number[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [conferenceOpen, setConferenceOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { schoolId } = useCurrentSchool();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    if (messages.some((m) => !m.isMine && !m.isRead)) {
      router.post("/dashboard/messages/read-thread", { with: partnerId }, { preserveScroll: true, preserveState: true });
    }
  }, [partnerId, messages]);

  const groupedMessages = useMemo(() => {
    const groups: { date: string; items: ThreadMessage[] }[] = [];
    messages.forEach((msg) => {
      const dateKey = format(new Date(msg.createdAt), "yyyy-MM-dd");
      const last = groups[groups.length - 1];
      if (last && format(new Date(last.date), "yyyy-MM-dd") === dateKey) {
        last.items.push(msg);
      } else {
        groups.push({ date: msg.createdAt, items: [msg] });
      }
    });
    return groups;
  }, [messages]);

  const handleSend = () => {
    if (!schoolId || !draft.trim()) return;
    setSending(true);
    router.post("/dashboard/messages", {
      receiverId: partnerId,
      body: draft.trim(),
    }, {
      preserveScroll: true,
      onSuccess: () => {
        setDraft("");
        toast.success("Message sent");
      },
      onError: () => toast.error("Failed to send message"),
      onFinish: () => setSending(false),
    });
  };

  const handleDelete = async (messageId: number) => {
    await routerDeleteWithConfirm(`/dashboard/messages/${messageId}`, {
      title: "Delete this message?",
      preserveScroll: true,
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#e5e5ea]">
      <ConferenceDialog
        open={conferenceOpen}
        onOpenChange={setConferenceOpen}
        schoolUsers={schoolUsers}
        partnerId={partnerId}
        onStart={(ids) => onStartCall("conference", ids)}
      />

      {/* Chat header — blue */}
      <div className="bg-blue-600 px-3 py-2.5 flex items-center gap-2 shrink-0 shadow-md">
        {showBack && (
          <button type="button" onClick={onBack} className="md:hidden text-white/90 hover:text-white cursor-pointer p-1" aria-label="Back to conversations">
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <GradientAvatar userId={partnerId} name={partnerName} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm truncate">{partnerName}</p>
          <p className="text-[11px] text-blue-100 truncate">
            Online · {formatLastSeen(partnerLastSeen ?? messages.at(-1)?.createdAt)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onStartCall("audio", [partnerId])}
          className="text-white/90 hover:text-white cursor-pointer p-2"
          aria-label="Audio call"
        >
          <Phone className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => onStartCall("video", [partnerId])}
          className="text-white/90 hover:text-white cursor-pointer p-2 hidden sm:block"
          aria-label="Video call"
        >
          <Video className="h-5 w-5" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="text-white/90 hover:text-white cursor-pointer p-2" aria-label="More options">
              <MoreVertical className="h-5 w-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="cursor-pointer" onClick={() => onStartCall("video", [partnerId])}>
              <Video className="h-4 w-4 mr-2" /> Video call
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => setConferenceOpen(true)}>
              <Users className="h-4 w-4 mr-2" /> Conference
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={onToggleFavorite}>
              <Star className="h-4 w-4 mr-2" /> {isFavorite ? "Remove favorite" : "Add to favorites"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Messages — dotted background */}
      <div
        className="flex-1 overflow-y-auto px-3 py-4 space-y-3"
        style={{ backgroundImage: "radial-gradient(circle, #c7c7cc 1px, transparent 1px)", backgroundSize: "18px 18px" }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm">
            <p>No messages yet.</p>
            <p className="text-xs mt-1">Say hello to start the conversation!</p>
          </div>
        ) : (
          groupedMessages.map((group) => (
            <div key={group.date} className="space-y-2">
              <p className="text-center text-[11px] text-gray-500 font-medium">
                {formatDateSeparator(group.date)}
              </p>
              {group.items.map((msg) => (
                <MessageBubble key={msg.id} message={msg} onDelete={() => handleDelete(msg.id)} />
              ))}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="bg-[#f2f2f7] px-3 py-2.5 flex items-center gap-2 shrink-0 border-t border-gray-200">
        <div className="flex-1 flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-gray-100">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder="Type a message…"
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-gray-400 text-gray-800 min-w-0"
          />
          <button type="button" className="text-gray-400 hover:text-blue-600 cursor-pointer p-0.5" aria-label="Attach file">
            <Paperclip className="h-5 w-5" />
          </button>
          <button type="button" className="text-gray-400 hover:text-blue-600 cursor-pointer p-0.5" aria-label="Camera">
            <Camera className="h-5 w-5" />
          </button>
        </div>
        {draft.trim() ? (
          <button
            type="button"
            onClick={handleSend}
            disabled={sending}
            className="h-11 w-11 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center cursor-pointer disabled:opacity-50 shrink-0"
            aria-label="Send message"
          >
            <Send className="h-5 w-5" />
          </button>
        ) : (
          <button
            type="button"
            className="h-11 w-11 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center cursor-pointer shrink-0"
            aria-label="Voice message"
          >
            <Mic className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}

function MessagesInner({
  conversations,
  threads,
  contacts,
  schoolUsers,
  activeWith,
  newMessagesCount,
  activeCall: initialActiveCall,
  dailyCallsEnabled,
}: PageProps) {
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const [mobileShowChat, setMobileShowChat] = useState(!!activeWith);
  const [searchQuery, setSearchQuery] = useState("");
  const [newConversationOpen, setNewConversationOpen] = useState(false);
  const [activeCall, setActiveCall] = useState<CallSession | null>(initialActiveCall);

  useEffect(() => {
    setActiveCall(initialActiveCall);
  }, [initialActiveCall]);

  const { isSearching, matchingConversations, messageMatches } = useMessageSearch(
    searchQuery,
    conversations,
    threads,
    schoolUsers,
  );

  const favoriteConversations = useMemo(
    () => (isSearching ? matchingConversations : conversations).filter((c) => favorites.includes(c.userId)),
    [conversations, matchingConversations, favorites, isSearching],
  );

  const recentConversations = useMemo(
    () => (isSearching ? matchingConversations : conversations).filter((c) => !favorites.includes(c.userId)),
    [conversations, matchingConversations, favorites, isSearching],
  );

  const usersMap = useMemo(
    () => new Map(schoolUsers.map((u) => [u.id, u])),
    [schoolUsers],
  );

  const activePartner = useMemo(() => {
    if (!activeWith) return null;
    return conversations.find((c) => c.userId === activeWith) ?? {
      userId: activeWith,
      userName: usersMap.get(activeWith)?.name ?? contacts.find((c) => c.id === activeWith)?.name ?? "Contact",
      userRole: usersMap.get(activeWith)?.role ?? contacts.find((c) => c.id === activeWith)?.role,
      lastMessage: "",
      lastMessageAt: new Date().toISOString(),
      unreadCount: 0,
      isSentByMe: false,
    };
  }, [activeWith, conversations, contacts, usersMap]);

  const activeMessages = activeWith ? (threads[String(activeWith)] ?? []) : [];

  const openConversation = (userId: number) => {
    setMobileShowChat(true);
    router.get("/dashboard/messages", { with: userId }, { preserveState: true, preserveScroll: true });
  };

  const closeMobileChat = () => {
    setMobileShowChat(false);
    router.get("/dashboard/messages", {}, { preserveState: true, preserveScroll: true });
  };

  const startCall = (type: "audio" | "video" | "conference", participantIds: number[]) => {
    if (!dailyCallsEnabled) {
      toast.error("Video calling is not configured. Add DAILY_API_KEY to your .env file.");
      return;
    }

    router.post("/dashboard/calls", {
      callType: type,
      participantIds,
      title: type === "conference" ? "Team conference" : undefined,
    }, {
      preserveScroll: true,
      onSuccess: () => toast.success(`${type === "conference" ? "Conference" : type === "video" ? "Video" : "Audio"} call started`),
      onError: (errors) => {
        const message = Object.values(errors)[0];
        toast.error(typeof message === "string" ? message : "Could not start call");
      },
    });
  };

  const endCall = () => {
    if (!activeCall) return;
    router.post(`/dashboard/calls/${activeCall.id}/end`, {}, {
      preserveScroll: true,
      onSuccess: () => {
        setActiveCall(null);
        toast.success("Call ended");
      },
    });
  };

  const newContactCount = contacts.length;
  const noSearchResults = isSearching && matchingConversations.length === 0 && messageMatches.length === 0;

  return (
    <div className="-mx-6 -my-6 md:mx-0 md:my-0">
      {activeCall && (
        <CallOverlay
          call={activeCall}
          partnerName={activePartner?.userName}
          onEnd={endCall}
        />
      )}

      <NewConversationDialog
        open={newConversationOpen}
        onOpenChange={setNewConversationOpen}
        schoolUsers={schoolUsers}
        onSelectUser={openConversation}
      />

      <div className="flex h-[calc(100vh-3.5rem)] md:h-[calc(100vh-3rem)] max-w-6xl mx-auto md:rounded-2xl md:overflow-hidden md:border md:shadow-lg bg-white">
        {/* Left panel — conversation list */}
        <div
          className={cn(
            "w-full md:w-[340px] lg:w-[380px] flex flex-col border-r border-blue-100 shrink-0 bg-white",
            mobileShowChat && activeWith ? "hidden md:flex" : "flex",
          )}
        >
          {/* Pink header banner */}
          <div className="bg-blue-600 px-5 py-4 shrink-0">
            <div className="flex items-center justify-between gap-3">
              <p className="text-white font-semibold text-sm">
                {newMessagesCount > 0
                  ? `You have ${newMessagesCount} new message${newMessagesCount === 1 ? "" : "s"}!`
                  : "Your messages"}
              </p>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setNewConversationOpen(true)}
                className="h-8 shrink-0 bg-white/20 text-white border-0 hover:bg-white/30 cursor-pointer"
              >
                <MessageSquarePlus className="h-4 w-4 mr-1.5" />
                New
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="px-4 py-3 border-b border-blue-50 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages or contacts…"
                className="pl-9 pr-9 h-9 bg-blue-50/40 border-blue-100 focus-visible:ring-blue-300"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* New contacts row */}
          {!isSearching && contacts.length > 0 && (
            <div className="px-4 pt-4 pb-2 shrink-0">
              <p className="text-xs font-semibold text-blue-600 mb-3">New Contacts</p>
              <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
                {contacts.slice(0, 8).map((contact) => (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => openConversation(contact.id)}
                    className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
                  >
                    <GradientAvatar userId={contact.id} name={contact.name} size="md" />
                    <span className="text-[10px] text-gray-500 max-w-[56px] truncate group-hover:text-blue-600">
                      {(contact.name ?? "User").split(" ")[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Scrollable lists */}
          <div className="flex-1 overflow-y-auto">
            {isSearching ? (
              <div>
                <p className="px-4 pt-3 pb-1 text-xs font-semibold text-blue-600">Search Results</p>
                {noSearchResults ? (
                  <div className="px-4 py-12 text-center text-sm text-gray-400">
                    No messages or contacts match your search.
                  </div>
                ) : (
                  <>
                    {matchingConversations.map((conv) => (
                      <ConversationRow
                        key={conv.userId}
                        conversation={conv}
                        isActive={activeWith === conv.userId}
                        isFavorite={isFavorite(conv.userId)}
                        onSelect={() => openConversation(conv.userId)}
                      />
                    ))}
                    {messageMatches.length > 0 && (
                      <>
                        {matchingConversations.length > 0 && (
                          <p className="px-4 pt-4 pb-1 text-xs font-semibold text-blue-600">Message matches</p>
                        )}
                        {messageMatches.map((match) => (
                          <SearchMatchRow
                            key={`${match.userId}-${match.messageId}`}
                            match={match}
                            isActive={activeWith === match.userId}
                            onSelect={() => openConversation(match.userId)}
                          />
                        ))}
                      </>
                    )}
                  </>
                )}
              </div>
            ) : (
              <>
                {favoriteConversations.length > 0 && (
                  <div>
                    <p className="px-4 pt-3 pb-1 text-xs font-semibold text-blue-600">Favorites</p>
                    {favoriteConversations.map((conv) => (
                      <ConversationRow
                        key={conv.userId}
                        conversation={conv}
                        isActive={activeWith === conv.userId}
                        isFavorite
                        onSelect={() => openConversation(conv.userId)}
                      />
                    ))}
                  </div>
                )}

                <div>
                  <p className="px-4 pt-3 pb-1 text-xs font-semibold text-blue-600">
                    {favoriteConversations.length > 0 ? "Recent Messages" : "Messages"}
                  </p>
                  {recentConversations.length === 0 && favoriteConversations.length === 0 ? (
                    <div className="px-4 py-12 text-center text-sm text-gray-400">
                      {newContactCount > 0
                        ? "Tap a contact above or use New to start chatting."
                        : "No conversations yet. Use New to start one."}
                    </div>
                  ) : (
                    recentConversations.map((conv) => (
                      <ConversationRow
                        key={conv.userId}
                        conversation={conv}
                        isActive={activeWith === conv.userId}
                        isFavorite={false}
                        onSelect={() => openConversation(conv.userId)}
                      />
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right panel — active chat */}
        <div
          className={cn(
            "flex-1 flex flex-col min-w-0",
            !mobileShowChat && !activeWith ? "hidden md:flex" : "flex",
            mobileShowChat && activeWith ? "flex" : "hidden md:flex",
          )}
        >
          {activeWith && activePartner ? (
            <ChatPanel
              partnerId={activeWith}
              partnerName={activePartner.userName}
              partnerLastSeen={activePartner.lastMessageAt}
              messages={activeMessages}
              isFavorite={isFavorite(activeWith)}
              onToggleFavorite={() => toggleFavorite(activeWith)}
              onBack={closeMobileChat}
              showBack={mobileShowChat}
              schoolUsers={schoolUsers}
              onStartCall={startCall}
            />
          ) : (
            <div className="hidden md:flex flex-col items-center justify-center h-full bg-gray-50/50 text-gray-400 px-6">
              <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center mb-4 opacity-80">
                <Send className="h-7 w-7 text-white" />
              </div>
              <p className="text-sm font-medium text-gray-500">Select a conversation</p>
              <p className="text-xs mt-1 text-center">Choose from your messages or start a new chat</p>
              <Button
                type="button"
                size="sm"
                onClick={() => setNewConversationOpen(true)}
                className="mt-4 bg-blue-600 hover:bg-blue-700 cursor-pointer"
              >
                <MessageSquarePlus className="h-4 w-4 mr-1.5" />
                New conversation
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage(props: PageProps) {
  return (
    <DashboardLayout>
      <MessagesInner {...props} />
    </DashboardLayout>
  );
}
