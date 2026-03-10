import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Bell, Megaphone, AlertTriangle, Calendar, Info, Trash2, Plus, Send, CheckCircle } from "lucide-react";

type AnnouncementType = "info" | "cancellation" | "schedule_change" | "urgent";

const TYPE_CONFIG: Record<AnnouncementType, { label: string; icon: React.ReactNode; color: string; bg: string; border: string }> = {
  info: {
    label: "Info",
    icon: <Info className="w-4 h-4" />,
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  cancellation: {
    label: "Cancellation",
    icon: <AlertTriangle className="w-4 h-4" />,
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
  },
  schedule_change: {
    label: "Schedule Change",
    icon: <Calendar className="w-4 h-4" />,
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  urgent: {
    label: "Urgent",
    icon: <AlertTriangle className="w-4 h-4" />,
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
  },
};

function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

export default function Announcements() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<AnnouncementType>("info");
  const [sendEmail, setSendEmail] = useState(true);
  const [sendSms, setSendSms] = useState(false);

  const { data: announcements = [], refetch } = trpc.announcements.list.useQuery();
  const utils = trpc.useUtils();

  const postMutation = trpc.announcements.post.useMutation({
    onSuccess: (result) => {
      toast.success(`Announcement posted! ${result.emailsSent} emails sent${result.smsSent > 0 ? `, ${result.smsSent} SMS sent` : ""}.`);
      setTitle("");
      setBody("");
      setType("info");
      setSendEmail(true);
      setSendSms(false);
      setShowForm(false);
      refetch();
      utils.announcements.unreadCount.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const markReadMutation = trpc.announcements.markRead.useMutation({
    onSuccess: () => {
      refetch();
      utils.announcements.unreadCount.invalidate();
    },
  });

  const deleteMutation = trpc.announcements.delete.useMutation({
    onSuccess: () => {
      toast.success("Announcement deleted.");
      refetch();
      utils.announcements.unreadCount.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const unreadCount = announcements.filter((a: any) => !a.isRead).length;

  function handleMarkRead(id: number, isRead: boolean) {
    if (!user || isRead) return;
    markReadMutation.mutate({ id });
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell className="w-7 h-7 text-primary" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold">Announcements</h1>
              <p className="text-sm text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} unread message${unreadCount !== 1 ? "s" : ""}` : "You're all caught up"}
              </p>
            </div>
          </div>
          {isAdmin && (
            <Button onClick={() => setShowForm(!showForm)} className="gap-2">
              <Plus className="w-4 h-4" />
              Post Announcement
            </Button>
          )}
        </div>

        {/* Admin Post Form */}
        {isAdmin && showForm && (
          <Card className="mb-6 border-primary/20 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Megaphone className="w-5 h-5 text-primary" />
                New Announcement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="ann-type">Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as AnnouncementType)}>
                  <SelectTrigger id="ann-type" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">📢 Info</SelectItem>
                    <SelectItem value="cancellation">🚫 Cancellation</SelectItem>
                    <SelectItem value="schedule_change">📅 Schedule Change</SelectItem>
                    <SelectItem value="urgent">🚨 Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="ann-title">Title</Label>
                <Input
                  id="ann-title"
                  className="mt-1"
                  placeholder="e.g. Session cancelled due to rain"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={200}
                />
              </div>

              <div>
                <Label htmlFor="ann-body">Message</Label>
                <Textarea
                  id="ann-body"
                  className="mt-1 min-h-[100px]"
                  placeholder="Write your message here..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-3 pt-1">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="send-email" className="font-medium">Send Email</Label>
                    <p className="text-xs text-muted-foreground">Email all registered students</p>
                  </div>
                  <Switch id="send-email" checked={sendEmail} onCheckedChange={setSendEmail} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="send-sms" className="font-medium">Send SMS</Label>
                    <p className="text-xs text-muted-foreground">SMS students who opted in</p>
                  </div>
                  <Switch id="send-sms" checked={sendSms} onCheckedChange={setSendSms} />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  className="flex-1 gap-2"
                  disabled={!title.trim() || !body.trim() || postMutation.isPending}
                  onClick={() => postMutation.mutate({ title: title.trim(), body: body.trim(), type, sendEmail, sendSms })}
                >
                  <Send className="w-4 h-4" />
                  {postMutation.isPending ? "Sending..." : "Post & Broadcast"}
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Announcements List */}
        {announcements.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No announcements yet</p>
            <p className="text-sm mt-1">Check back here for updates from Coach Mario</p>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((ann: any) => {
              const cfg = TYPE_CONFIG[ann.type as AnnouncementType] || TYPE_CONFIG.info;
              return (
                <div
                  key={ann.id}
                  className={`relative rounded-xl border p-4 cursor-pointer transition-all ${
                    ann.isRead ? "opacity-80" : "shadow-sm"
                  } ${cfg.bg} ${cfg.border}`}
                  onClick={() => handleMarkRead(ann.id, ann.isRead)}
                >
                  {/* Unread dot */}
                  {!ann.isRead && user && (
                    <span className="absolute top-4 right-4 w-2.5 h-2.5 bg-primary rounded-full" />
                  )}

                  <div className="flex items-start gap-3 pr-4">
                    <span className={`mt-0.5 ${cfg.color}`}>{cfg.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge variant="outline" className={`text-xs ${cfg.color} border-current`}>
                          {cfg.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{timeAgo(ann.createdAt)}</span>
                        {ann.isRead && user && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <CheckCircle className="w-3 h-3" /> Read
                          </span>
                        )}
                      </div>
                      <h3 className={`font-semibold text-sm mb-1 ${cfg.color}`}>{ann.title}</h3>
                      <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{ann.body}</p>
                      {isAdmin && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {ann.emailsSent} emails · {ann.smsSent} SMS
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Admin delete */}
                  {isAdmin && (
                    <button
                      className="absolute bottom-3 right-3 text-muted-foreground hover:text-red-500 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Delete this announcement?")) {
                          deleteMutation.mutate({ id: ann.id });
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
