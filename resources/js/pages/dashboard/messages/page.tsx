import { useState } from "react";
import { router } from "@inertiajs/react";
import { DashboardLayout } from "../_components/layout.tsx";
import { useCurrentSchool } from "../_components/use-current-school.ts";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { toast } from "sonner";
import { motion } from "motion/react";
import { MessageSquare, Send, Inbox, Pencil, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export type Message = {
  id: number;
  schoolId: number;
  senderId: number;
  receiverId: number;
  subject?: string | null;
  body: string;
  isRead: boolean;
  parentMessageId?: number | null;
  createdAt: string;
  senderName?: string;
  receiverName?: string;
};

export type SchoolUser = {
  id: number;
  name?: string | null;
  email?: string | null;
  role?: string | null;
};

type PageProps = {
  inbox: Message[];
  sent: Message[];
  users: SchoolUser[];
};

function MessagesInner({ inbox, sent, users }: PageProps) {
  const [tab, setTab] = useState("inbox");
  const [composeOpen, setComposeOpen] = useState(false);
  const [receiverId, setReceiverId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedMsg, setSelectedMsg] = useState<number | null>(null);

  const { user, schoolId } = useCurrentSchool();
  const userId = user?.id;

  const handleSend = () => {
    if (!schoolId || !receiverId || !body) return;
    setSending(true);
    router.post("/dashboard/messages", {
      receiverId: Number(receiverId),
      subject: subject || undefined,
      body,
    }, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success("Message sent");
        setComposeOpen(false);
        setReceiverId("");
        setSubject("");
        setBody("");
      },
      onError: () => toast.error("Failed to send message"),
      onFinish: () => setSending(false),
    });
  };

  const markRead = (messageId: number) => {
    router.post(`/dashboard/messages/${messageId}/read`, {}, { preserveScroll: true });
  };

  const deleteMsg = (messageId: number) => {
    router.delete(`/dashboard/messages/${messageId}`, { preserveScroll: true });
  };

  const messages = tab === "inbox" ? inbox : sent;
  const unreadCount = inbox.filter((m) => !m.isRead).length;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-primary" /> Messages
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Internal messaging between staff, teachers, and parents</p>
          </div>
          <Button onClick={() => setComposeOpen(true)} className="cursor-pointer">
            <Pencil className="h-4 w-4 mr-1.5" /> Compose
          </Button>
        </div>
      </motion.div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="inbox" className="cursor-pointer">
            <Inbox className="h-4 w-4 mr-1.5" /> Inbox
            {unreadCount > 0 && (
              <Badge className="ml-1.5 h-5 w-5 p-0 flex items-center justify-center text-xs">{unreadCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent" className="cursor-pointer">
            <Send className="h-4 w-4 mr-1.5" /> Sent
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {messages.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-16 gap-3">
                <MessageSquare className="h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {tab === "inbox" ? "Your inbox is empty." : "No sent messages yet."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {messages.map((msg) => {
                const isSelected = selectedMsg === msg.id;
                const isUnread = tab === "inbox" && !msg.isRead;
                return (
                  <Card
                    key={msg.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${isUnread ? "border-primary/30 bg-primary/5" : ""}`}
                    onClick={() => {
                      setSelectedMsg(isSelected ? null : msg.id);
                      if (isUnread) markRead(msg.id);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {isUnread && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                            <p className={`text-sm ${isUnread ? "font-bold" : "font-semibold"}`}>
                              {tab === "inbox"
                                ? `From: ${msg.senderName ?? "Unknown"}`
                                : `To: ${msg.receiverName ?? "Unknown"}`}
                            </p>
                            {msg.subject && (
                              <span className="text-sm text-muted-foreground truncate">— {msg.subject}</span>
                            )}
                          </div>
                          {isSelected && (
                            <motion.p
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              className="text-sm text-foreground mt-2 whitespace-pre-wrap"
                            >
                              {msg.body}
                            </motion.p>
                          )}
                          {!isSelected && (
                            <p className="text-xs text-muted-foreground truncate">{msg.body}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <p className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                          </p>
                          {tab === "inbox" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteMsg(msg.id);
                              }}
                              className="text-muted-foreground hover:text-red-600 cursor-pointer p-1 rounded"
                              aria-label="Delete message"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Compose Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>To *</Label>
              <Select value={receiverId} onValueChange={setReceiverId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select recipient…" />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .filter((u) => u.id !== userId)
                    .map((u) => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        {u.name ?? u.email ?? "Unknown"} ({u.role ?? "user"})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Optional subject…" />
            </div>
            <div className="space-y-1.5">
              <Label>Message *</Label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your message…"
                className="min-h-[120px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setComposeOpen(false)} className="cursor-pointer">Cancel</Button>
            <Button onClick={handleSend} disabled={!receiverId || !body || sending} className="cursor-pointer">
              <Send className="h-4 w-4 mr-1.5" />
              {sending ? "Sending…" : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function MessagesPage(props: PageProps) {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <MessagesInner {...props} />
      </div>
    </DashboardLayout>
  );
}
