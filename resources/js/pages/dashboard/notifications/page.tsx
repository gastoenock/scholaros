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
import { toast } from "sonner";
import { motion } from "motion/react";
import { Bell, Megaphone, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export type Notification = {
  id: number;
  schoolId: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  relatedId?: string | null;
  createdAt: string;
};

type PageProps = {
  notifications: Notification[];
};

const TYPE_STYLES: Record<string, { color: string; label: string }> = {
  attendance: { color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300", label: "Attendance" },
  message: { color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300", label: "Message" },
  call: { color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300", label: "Call" },
  announcement: { color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300", label: "Announcement" },
  general: { color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300", label: "General" },
};

function NotificationsInner({ notifications }: PageProps) {
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcasting, setBroadcasting] = useState(false);

  const { schoolId, role } = useCurrentSchool();

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const isAdmin = role === "admin" || role === "superadmin";

  const markRead = (notificationId: number) => {
    router.post(`/dashboard/notifications/${notificationId}/read`, {}, { preserveScroll: true });
  };

  const openNotification = (notification: Notification) => {
    if (!notification.isRead) markRead(notification.id);

    if (notification.type === "call" && notification.relatedId) {
      router.get("/dashboard/messages", { joinCall: notification.relatedId });
    }
  };

  const handleMarkAll = () => {
    router.post("/dashboard/notifications/read-all", {}, {
      preserveScroll: true,
      onSuccess: () => toast.success("All notifications marked as read"),
    });
  };

  const handleBroadcast = () => {
    if (!schoolId) return;
    setBroadcasting(true);
    router.post("/dashboard/notifications/broadcast", {
      title: broadcastTitle,
      message: broadcastMsg,
    }, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success("Announcement sent to all school users");
        setBroadcastOpen(false);
        setBroadcastTitle("");
        setBroadcastMsg("");
      },
      onError: () => toast.error("Failed to send announcement"),
      onFinish: () => setBroadcasting(false),
    });
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-extrabold flex items-center gap-2">
              <Bell className="h-6 w-6 text-primary" /> Notifications
              {unreadCount > 0 && (
                <Badge className="ml-1">{unreadCount} unread</Badge>
              )}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Attendance alerts, messages, and school announcements</p>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button variant="secondary" size="sm" onClick={handleMarkAll} className="cursor-pointer">
                <CheckCheck className="h-4 w-4 mr-1.5" /> Mark All Read
              </Button>
            )}
            {isAdmin && (
              <Button size="sm" onClick={() => setBroadcastOpen(true)} className="cursor-pointer">
                <Megaphone className="h-4 w-4 mr-1.5" /> Broadcast
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 gap-3">
            <Bell className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No notifications yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const typeStyle = TYPE_STYLES[n.type] ?? TYPE_STYLES.general;
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card
                  className={`cursor-pointer transition-all hover:shadow-md ${!n.isRead ? "border-primary/30 bg-primary/5" : ""}`}
                  onClick={() => openNotification(n)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {!n.isRead && <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeStyle.color}`}>
                            {typeStyle.label}
                          </span>
                          <p className={`text-sm ${!n.isRead ? "font-bold" : "font-medium"}`}>{n.title}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">{n.message}</p>
                      </div>
                      <p className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <Dialog open={broadcastOpen} onOpenChange={setBroadcastOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Broadcast Announcement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              This announcement will be sent as a notification to all users in your school.
            </p>
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                placeholder="e.g. School Closed Tomorrow"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Message *</Label>
              <Textarea
                value={broadcastMsg}
                onChange={(e) => setBroadcastMsg(e.target.value)}
                placeholder="Write your announcement…"
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setBroadcastOpen(false)} className="cursor-pointer">Cancel</Button>
            <Button onClick={handleBroadcast} disabled={!broadcastTitle || !broadcastMsg || broadcasting} className="cursor-pointer">
              <Megaphone className="h-4 w-4 mr-1.5" />
              {broadcasting ? "Sending…" : "Send Announcement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function NotificationsPage(props: PageProps) {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <NotificationsInner {...props} />
      </div>
    </DashboardLayout>
  );
}
