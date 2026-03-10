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
import { Bell, Megaphone, AlertTriangle, Calendar, Info, Trash2, Plus, Send, CheckCircle, CloudRain, Star, Filter, CheckCheck, X } from "lucide-react";

type AnnouncementType = "info" | "cancellation" | "rain_cancellation" | "schedule_change" | "urgent" | "event";

const TYPE_CONFIG: Record<AnnouncementType, {
  label: string;
  emoji: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  border: string;
  darkBg?: string;
  priority: number; // higher = more important
}> = {
  urgent: {
    label: "Urgent",
    emoji: "🚨",
    icon: <AlertTriangle className="w-4 h-4" />,
    color: "text-red-700 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-300 dark:border-red-800",
    priority: 5,
  },
  rain_cancellation: {
    label: "Rain Cancellation",
    emoji: "🌧️",
    icon: <CloudRain className="w-4 h-4" />,
    color: "text-sky-700 dark:text-sky-400",
    bg: "bg-sky-50 dark:bg-sky-950/30",
    border: "border-sky-300 dark:border-sky-800",
    priority: 4,
  },
  cancellation: {
    label: "Cancellation",
    emoji: "🚫",
    icon: <AlertTriangle className="w-4 h-4" />,
    color: "text-orange-700 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950/30",
    border: "border-orange-300 dark:border-orange-800",
    priority: 3,
  },
  schedule_change: {
    label: "Schedule Change",
    emoji: "📅",
    icon: <Calendar className="w-4 h-4" />,
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-300 dark:border-amber-800",
    priority: 2,
  },
  event: {
    label: "Event",
    emoji: "🎾",
    icon: <Star className="w-4 h-4" />,
    color: "text-green-700 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-950/30",
    border: "border-green-300 dark:border-green-800",
    priority: 1,
  },
  info: {
    label: "Info",
    emoji: "📢",
    icon: <Info className="w-4 h-4" />,
    color: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
    priority: 0,
  },
};

const FILTER_OPTIONS: { value: AnnouncementType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "urgent", label: "🚨 Urgent" },
  { value: "rain_cancellation", label: "🌧️ Rain" },
  { value: "cancellation", label: "🚫 Cancellations" },
  { value: "schedule_change", label: "📅 Schedule" },
  { value: "event", label: "🎾 Events" },
  { value: "info", label: "📢 Info" },
];

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
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function Announcements() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<AnnouncementType>("info");
  const [sendEmail, setSendEmail] = useState(true);
  const [filterType, setFilterType] = useState<AnnouncementType | "all">("all");

  const { data: announcements = [], refetch } = trpc.announcements.list.useQuery();
  const utils = trpc.useUtils();

  const postMutation = trpc.announcements.post.useMutation({
    onSuccess: (result) => {
      toast.success(`Announcement posted! ${result.emailsSent} email${result.emailsSent !== 1 ? "s" : ""} sent.`);
      setTitle("");
      setBody("");
      setType("info");
      setSendEmail(true);
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

  const unreadAnnouncements = announcements.filter((a: any) => !a.isRead);
  const unreadCount = unreadAnnouncements.length;

  // Mark all unread as read
  const markAllRead = () => {
    if (!user || unreadCount === 0) return;
    unreadAnnouncements.forEach((ann: any) => {
      markReadMutation.mutate({ id: ann.id });
    });
    toast.success("All marked as read");
  };

  const filteredAnnouncements = filterType === "all"
    ? announcements
    : announcements.filter((a: any) => a.type === filterType);

  function handleMarkRead(id: number, isRead: boolean) {
    if (!user || isRead) return;
    markReadMutation.mutate({ id });
  }

  // Count per type for filter badges
  const countByType = announcements.reduce((acc: Record<string, number>, ann: any) => {
    acc[ann.type] = (acc[ann.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${unreadCount > 0 ? "bg-primary" : "bg-primary/10"}`}>
                <Bell className={`w-6 h-6 ${unreadCount > 0 ? "text-primary-foreground" : "text-primary"}`} />
              </div>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Announcements</h1>
              <p className="text-sm text-muted-foreground">
                {unreadCount > 0
                  ? `${unreadCount} unread message${unreadCount !== 1 ? "s" : ""}`
                  : "You're all caught up ✓"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user && unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllRead}
                className="gap-1.5 text-xs"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </Button>
            )}
            {isAdmin && (
              <Button onClick={() => setShowForm(!showForm)} className="gap-2" size="sm">
                {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {showForm ? "Cancel" : "Post"}
              </Button>
            )}
          </div>
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
                <Label htmlFor="ann-type">Category</Label>
                <Select value={type} onValueChange={(v) => setType(v as AnnouncementType)}>
                  <SelectTrigger id="ann-type" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">🚨 Urgent</SelectItem>
                    <SelectItem value="rain_cancellation">🌧️ Rain Cancellation</SelectItem>
                    <SelectItem value="cancellation">🚫 Cancellation</SelectItem>
                    <SelectItem value="schedule_change">📅 Schedule Change</SelectItem>
                    <SelectItem value="event">🎾 Event / Tournament</SelectItem>
                    <SelectItem value="info">📢 General Info</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Preview of selected type */}
              <div className={`flex items-center gap-2 p-2.5 rounded-lg border ${TYPE_CONFIG[type].bg} ${TYPE_CONFIG[type].border}`}>
                <span className={TYPE_CONFIG[type].color}>{TYPE_CONFIG[type].icon}</span>
                <span className={`text-xs font-semibold ${TYPE_CONFIG[type].color}`}>
                  {TYPE_CONFIG[type].emoji} {TYPE_CONFIG[type].label}
                </span>
              </div>

              <div>
                <Label htmlFor="ann-title">Title</Label>
                <Input
                  id="ann-title"
                  className="mt-1"
                  placeholder={
                    type === "rain_cancellation" ? "e.g. Today's 4pm session cancelled — rain" :
                    type === "urgent" ? "e.g. Court closed — emergency maintenance" :
                    type === "event" ? "e.g. Summer Tournament — July 12 at Newport" :
                    type === "cancellation" ? "e.g. Wednesday clinic cancelled" :
                    type === "schedule_change" ? "e.g. This week's clinic moved to Thursday" :
                    "e.g. New summer schedule available"
                  }
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={200}
                />
                <div className="text-xs text-muted-foreground text-right mt-0.5">{title.length}/200</div>
              </div>

              <div>
                <Label htmlFor="ann-body">Message</Label>
                <Textarea
                  id="ann-body"
                  className="mt-1 min-h-[100px]"
                  placeholder="Write your message here. Be clear and specific — students will receive this via email."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-3 pt-1">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <Label htmlFor="send-email" className="font-medium cursor-pointer">Send Email Notification</Label>
                    <p className="text-xs text-muted-foreground">Email all registered students immediately</p>
                  </div>
                  <Switch id="send-email" checked={sendEmail} onCheckedChange={setSendEmail} />
                </div>
                {/* SMS toggle hidden until Twilio is fully configured */}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  className="flex-1 gap-2"
                  disabled={!title.trim() || !body.trim() || postMutation.isPending}
                  onClick={() => postMutation.mutate({ title: title.trim(), body: body.trim(), type, sendEmail, sendSms: false })}
                >
                  <Send className="w-4 h-4" />
                  {postMutation.isPending ? "Sending..." : sendEmail ? "Post & Email Students" : "Post Announcement"}
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filter Tabs */}
        {announcements.length > 0 && (
          <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1 scrollbar-hide">
            <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            {FILTER_OPTIONS.map((opt) => {
              const count = opt.value === "all" ? announcements.length : (countByType[opt.value] || 0);
              if (opt.value !== "all" && count === 0) return null;
              return (
                <button
                  key={opt.value}
                  onClick={() => setFilterType(opt.value)}
                  className={`shrink-0 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    filterType === opt.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {opt.label}
                  {count > 0 && <span className={`text-xs ${filterType === opt.value ? "text-primary-foreground/70" : "text-muted-foreground/70"}`}>({count})</span>}
                </button>
              );
            })}
          </div>
        )}

        {/* Announcements List */}
        {filteredAnnouncements.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 opacity-30" />
            </div>
            <p className="font-semibold text-foreground">
              {filterType === "all" ? "No announcements yet" : `No ${FILTER_OPTIONS.find(o => o.value === filterType)?.label} announcements`}
            </p>
            <p className="text-sm mt-1">
              {filterType === "all" ? "Check back here for updates from Coach Mario" : "Try a different filter"}
            </p>
            {filterType !== "all" && (
              <button
                onClick={() => setFilterType("all")}
                className="mt-3 text-xs text-primary underline"
              >
                Show all announcements
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAnnouncements.map((ann: any) => {
              const cfg = TYPE_CONFIG[ann.type as AnnouncementType] || TYPE_CONFIG.info;
              const isHighPriority = cfg.priority >= 3; // urgent, rain_cancellation, cancellation
              return (
                <div
                  key={ann.id}
                  className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all hover:shadow-md ${
                    ann.isRead ? "opacity-70" : isHighPriority ? "shadow-md" : "shadow-sm"
                  } ${cfg.bg} ${cfg.border}`}
                  onClick={() => handleMarkRead(ann.id, ann.isRead)}
                >
                  {/* Unread indicator */}
                  {!ann.isRead && user && (
                    <span className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full ${isHighPriority ? "bg-red-500 animate-pulse" : "bg-primary"}`} />
                  )}

                  <div className="flex items-start gap-3 pr-5">
                    {/* Type icon */}
                    <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg} border ${cfg.border}`}>
                      <span className={cfg.color}>{cfg.icon}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Meta row */}
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <Badge variant="outline" className={`text-xs font-semibold ${cfg.color} border-current`}>
                          {cfg.emoji} {cfg.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{timeAgo(ann.createdAt)}</span>
                        {ann.isRead && user && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <CheckCircle className="w-3 h-3" /> Read
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className={`font-bold text-sm mb-1.5 leading-snug ${cfg.color}`}>{ann.title}</h3>

                      {/* Body */}
                      <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{ann.body}</p>

                      {/* Admin stats */}
                      {isAdmin && (
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <Send className="w-3 h-3" />
                          {ann.emailsSent} email{ann.emailsSent !== 1 ? "s" : ""} sent
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Admin delete */}
                  {isAdmin && (
                    <button
                      className="absolute bottom-3 right-3 p-1 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Delete this announcement?")) {
                          deleteMutation.mutate({ id: ann.id });
                        }
                      }}
                      title="Delete announcement"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer note */}
        {announcements.length > 0 && (
          <p className="text-xs text-muted-foreground text-center mt-6">
            Tap an announcement to mark it as read · Updates from Coach Mario Llano
          </p>
        )}
      </div>
    </div>
  );
}
