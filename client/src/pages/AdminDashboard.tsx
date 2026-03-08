import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users, Calendar, DollarSign, MessageSquare, CheckCircle,
  Clock, XCircle, Send, Trophy, BarChart3, Shield, Tag, Trash2, Plus, Percent, Mail, Bell, PenLine, Save, ChevronDown, ChevronUp
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Link } from "wouter";

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  completed: "bg-blue-100 text-blue-800",
};

function AnalyticsTab() {
  const { data: analytics, isLoading } = trpc.admin.getAnalytics.useQuery({ months: 6 });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3].map(i => <div key={i} className="h-64 bg-muted rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  const totalRevenue = (analytics?.revenueByProgram || []).reduce((sum, r) => sum + (Number(r.totalRevenueCents) || 0), 0);
  const maxRevenue = Math.max(...(analytics?.revenueByProgram || []).map(r => Number(r.totalRevenueCents) || 0), 1);
  const maxBookings = Math.max(...(analytics?.monthlyTrends || []).map(r => Number(r.bookingCount) || 0), 1);

  return (
    <div className="space-y-6">
      {/* Revenue by Program */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="w-4 h-4 text-green-600" /> Revenue by Program
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!analytics?.revenueByProgram?.length ? (
              <div className="text-center py-8 text-muted-foreground text-sm">No revenue data yet.</div>
            ) : (
              <div className="space-y-3">
                {analytics.revenueByProgram.map((r) => (
                  <div key={r.programName || 'Other'}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground truncate max-w-[55%]">{r.programName || 'Other'}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{Number(r.bookingCount)} bookings</span>
                        <span className="font-bold text-foreground">${(Number(r.totalRevenueCents || 0) / 100).toFixed(0)}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(Number(r.totalRevenueCents || 0) / maxRevenue) * 100}%` }} />
                    </div>
                  </div>
                ))}
                <div className="pt-3 border-t border-border flex justify-between text-sm">
                  <span className="text-muted-foreground font-medium">Total Revenue</span>
                  <span className="font-extrabold text-primary">${(totalRevenue / 100).toFixed(0)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Students */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="w-4 h-4 text-accent" /> Top Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!analytics?.topStudents?.length ? (
              <div className="text-center py-8 text-muted-foreground text-sm">No student data yet.</div>
            ) : (
              <div className="space-y-2">
                {analytics.topStudents.slice(0, 8).map((s, i) => (
                  <div key={s.userId} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold ${
                        i === 0 ? 'bg-yellow-100 text-yellow-700' :
                        i === 1 ? 'bg-gray-100 text-gray-600' :
                        i === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-muted text-muted-foreground'
                      }`}>{i + 1}</div>
                      <div>
                        <div className="text-sm font-semibold text-foreground">{s.userName || 'Unknown'}</div>
                        <div className="text-xs text-muted-foreground">{s.userEmail}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-primary">{Number(s.sessionCount)} sessions</div>
                      <div className="text-xs text-muted-foreground">${(Number(s.totalSpentCents || 0) / 100).toFixed(0)} spent</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Booking Trends */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="w-4 h-4 text-blue-600" /> Monthly Booking Trends (Last 6 Months)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!analytics?.monthlyTrends?.length ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No trend data yet.</div>
          ) : (
            <div className="space-y-4">
              {/* Bar chart */}
              <div className="flex items-end gap-2 h-32">
                {analytics.monthlyTrends.map((m) => (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                    <div className="text-xs font-bold text-foreground">{Number(m.bookingCount)}</div>
                    <div
                      className="w-full rounded-t-lg bg-primary/80 transition-all hover:bg-primary"
                      style={{ height: `${Math.max(4, (Number(m.bookingCount) / maxBookings) * 100)}px` }}
                      title={`${m.month}: ${m.bookingCount} bookings, $${(Number(m.revenueCents || 0) / 100).toFixed(0)} revenue`}
                    />
                    <div className="text-[10px] text-muted-foreground">{m.month?.slice(5)}</div>
                  </div>
                ))}
              </div>
              {/* Summary row */}
              <div className="grid grid-cols-3 gap-4 pt-3 border-t border-border">
                <div className="text-center">
                  <div className="text-xl font-extrabold text-primary" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                    {analytics.monthlyTrends.reduce((s, m) => s + Number(m.bookingCount), 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">Total Bookings</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-extrabold text-green-600" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                    ${(analytics.monthlyTrends.reduce((s, m) => s + Number(m.revenueCents || 0), 0) / 100).toFixed(0)}
                  </div>
                  <div className="text-xs text-muted-foreground">Total Revenue</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-extrabold text-accent" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                    {analytics.monthlyTrends.length > 0
                      ? Math.round(analytics.monthlyTrends.reduce((s, m) => s + Number(m.bookingCount), 0) / analytics.monthlyTrends.length)
                      : 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Avg / Month</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const [bookingFilter, setBookingFilter] = useState("all");
  const [smsMessage, setSmsMessage] = useState("");
  const [activeTab, setActiveTab] = useState("bookings");
  const [publishBannerDismissed, setPublishBannerDismissed] = useState(() => {
    try { return localStorage.getItem("ri_tennis_publish_banner_dismissed") === "true"; } catch { return false; }
  });

  const { data: stats } = trpc.admin.stats.useQuery(undefined, { enabled: user?.role === "admin" });
  const { data: bookings, refetch: refetchBookings } = trpc.booking.adminList.useQuery(
    { status: bookingFilter === "all" ? undefined : bookingFilter, limit: 50 },
    { enabled: user?.role === "admin" }
  );
  const { data: students } = trpc.admin.listStudents.useQuery(undefined, { enabled: user?.role === "admin" });
  const { data: broadcasts } = trpc.sms.getBroadcasts.useQuery(undefined, { enabled: user?.role === "admin" });
  const { data: smsCount } = trpc.sms.getOptInCount.useQuery(undefined, { enabled: user?.role === "admin" });

  // Promo codes
  const { data: promoCodes, refetch: refetchPromos } = trpc.promoCodes.list.useQuery(undefined, { enabled: user?.role === "admin" });
  const [promoForm, setPromoForm] = useState({ code: "", discountType: "percent", discountValue: "", maxUses: "", expiresAt: "", applicablePrograms: "" });
  const createPromoMutation = trpc.promoCodes.create.useMutation({
    onSuccess: () => { toast.success("Promo code created!"); refetchPromos(); setPromoForm({ code: "", discountType: "percent", discountValue: "", maxUses: "", expiresAt: "", applicablePrograms: "" }); },
    onError: (e) => toast.error(e.message || "Failed to create promo code."),
  });
  const deletePromoMutation = trpc.promoCodes.delete.useMutation({
    onSuccess: () => { toast.success("Promo code deleted."); refetchPromos(); },
    onError: () => toast.error("Failed to delete promo code."),
  });

  const confirmNowMutation = trpc.booking.confirmNow.useMutation({
    onSuccess: () => { toast.success("Booking confirmed! Student notified via email & SMS."); refetchBookings(); },
    onError: () => toast.error("Failed to confirm booking."),
  });

  const cancelNowMutation = trpc.booking.cancelNow.useMutation({
    onSuccess: () => { toast.success("Booking cancelled. Student notified via email & SMS."); refetchBookings(); },
    onError: () => toast.error("Failed to cancel booking."),
  });

  const remindNowMutation = trpc.booking.remindNow.useMutation({
    onSuccess: (data) => {
      if (data.scheduledFor) {
        toast.success(`Reminder scheduled for ${data.scheduledFor} (2 hours before lesson).`);
      } else {
        toast.success("Reminder scheduled successfully.");
      }
    },
    onError: () => toast.error("Failed to schedule reminder."),
  });

  const updateStatusMutation = trpc.booking.updateStatus.useMutation({
    onSuccess: () => { toast.success("Booking status updated!"); refetchBookings(); },
    onError: () => toast.error("Failed to update status."),
  });

  const updateCoachNotesMutation = trpc.booking.updateCoachNotes.useMutation({
    onSuccess: () => { toast.success("Coach notes saved!"); refetchBookings(); },
    onError: () => toast.error("Failed to save notes."),
  });

  const [expandedNotes, setExpandedNotes] = useState<Record<number, boolean>>({});
  const [noteDrafts, setNoteDrafts] = useState<Record<number, string>>({});

  const sendSmsMutation = trpc.sms.sendBroadcast.useMutation({
    onSuccess: (data) => {
      toast.success(`SMS sent to ${data.recipientCount} subscribers!`);
      setSmsMessage("");
    },
    onError: () => toast.error("Failed to send SMS broadcast."),
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full text-center p-8">
          <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Admin Access Required</h2>
          <p className="text-muted-foreground mb-6">Please sign in with your admin account.</p>
          <Button className="bg-primary text-primary-foreground" onClick={() => (window.location.href = getLoginUrl())}>
            Sign In
          </Button>
        </Card>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full text-center p-8">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-6">This area is restricted to academy admins.</p>
          <Link href="/"><Button variant="outline">Go Home</Button></Link>
        </Card>
      </div>
    );
  }

  const dismissPublishBanner = () => {
    setPublishBannerDismissed(true);
    try { localStorage.setItem("ri_tennis_publish_banner_dismissed", "true"); } catch {}
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Publish Reminder Banner */}
      {!publishBannerDismissed && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
          <div className="container flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-amber-600 text-lg">🚀</span>
              <div>
                <p className="text-sm font-semibold text-amber-900">Your changes are live in preview — don't forget to Publish!</p>
                <p className="text-xs text-amber-700">Click the <strong>Publish</strong> button in the top-right corner of the Management UI to push updates to your live site at <span className="font-mono">tennispro-kzzfscru.manus.space</span>.</p>
              </div>
            </div>
            <button onClick={dismissPublishBanner} className="text-amber-500 hover:text-amber-700 text-xl font-bold flex-shrink-0" aria-label="Dismiss">×</button>
          </div>
        </div>
      )}
      {/* Header */}
      <section className="bg-primary text-primary-foreground py-10">
        <div className="container">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-6 h-6 text-accent" />
            <Badge className="bg-accent/20 text-accent border-accent/30">Admin Dashboard</Badge>
          </div>
          <h1 className="text-3xl font-extrabold">RI Tennis Academy — Control Center</h1>
          <p className="text-primary-foreground/70 mt-1">Welcome back, {user?.name?.split(" ")[0] || "Coach Mario"}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/admin/schedule">
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 gap-2">
                <Calendar className="w-4 h-4 text-accent" />
                Manage My Schedule
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <div className="container py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Students", value: stats?.totalStudents ?? "—", icon: <Users className="w-5 h-5" />, color: "text-blue-600", tab: "students", hint: "View all students" },
            { label: "Total Bookings", value: stats?.totalBookings ?? "—", icon: <Calendar className="w-5 h-5" />, color: "text-green-600", tab: "bookings", hint: "View all bookings" },
            { label: "Pending Bookings", value: stats?.pendingBookings ?? "—", icon: <Clock className="w-5 h-5" />, color: "text-amber-600", tab: "bookings", hint: "View pending bookings", filter: "pending" },
            { label: "SMS Subscribers", value: stats?.smsSubscribers ?? "—", icon: <MessageSquare className="w-5 h-5" />, color: "text-purple-600", tab: "sms", hint: "Go to SMS broadcast" },
          ].map((stat) => (
            <Card
              key={stat.label}
              className="border border-border cursor-pointer hover:shadow-md hover:border-primary/40 transition-all group"
              onClick={() => {
                if (stat.filter) setBookingFilter(stat.filter);
                setActiveTab(stat.tab);
                setTimeout(() => document.getElementById('admin-tabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
              }}
            >
              <CardContent className="p-4">
                <div className={`${stat.color} mb-2 flex items-center justify-between`}>
                  {stat.icon}
                  <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity font-medium">{stat.hint} →</span>
                </div>
                <div className="text-2xl font-extrabold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Revenue Overview + Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Revenue Breakdown */}
          <Card className="border border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" /> Revenue Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bookings && bookings.length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(
                    bookings.reduce((acc, item) => {
                      const name = (item as any).program?.name || "Other";
                      const amt = (item.booking.totalAmountCents || 0) / 100;
                      acc[name] = (acc[name] || 0) + amt;
                      return acc;
                    }, {} as Record<string, number>)
                  ).sort(([, a], [, b]) => b - a).slice(0, 5).map(([name, total]) => {
                    const max = Math.max(...Object.values(
                      bookings.reduce((acc, item) => {
                        const n = (item as any).program?.name || "Other";
                        acc[n] = (acc[n] || 0) + (item.booking.totalAmountCents || 0) / 100;
                        return acc;
                      }, {} as Record<string, number>)
                    ));
                    return (
                      <div key={name}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground truncate max-w-[60%]">{name}</span>
                          <span className="font-bold text-foreground">${total.toFixed(0)}</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(total / max) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  <div className="pt-2 border-t border-border mt-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground font-medium">Total Revenue</span>
                      <span className="font-extrabold text-primary">
                        ${(bookings.reduce((sum, item) => sum + (item.booking.totalAmountCents || 0), 0) / 100).toFixed(0)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm">No booking data yet.</div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Trophy className="w-4 h-4 text-accent" /> Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { label: "Pending Bookings", count: stats?.pendingBookings as string | number | null | undefined, color: "bg-amber-50 border-amber-200 text-amber-800", action: () => { setBookingFilter("pending"); setActiveTab("bookings"); setTimeout(() => document.getElementById('admin-tabs')?.scrollIntoView({ behavior: 'smooth' }), 50); }, href: undefined },
                  { label: "SMS Broadcast", count: stats?.smsSubscribers ? `${stats.smsSubscribers} subs` : null as string | null | undefined, color: "bg-purple-50 border-purple-200 text-purple-800", action: () => setActiveTab("sms"), href: undefined },
                  { label: "Manage Schedule", count: null as null, color: "bg-blue-50 border-blue-200 text-blue-800", href: "/admin/schedule", action: undefined },
                  { label: "Create Promo Code", count: null as null, color: "bg-green-50 border-green-200 text-green-800", action: () => setActiveTab("promos"), href: undefined },
                  { label: "Newsletter", count: null as null, color: "bg-teal-50 border-teal-200 text-teal-800", href: "/admin/newsletter", action: undefined },
                  { label: "Leaderboard", count: null as null, color: "bg-orange-50 border-orange-200 text-orange-800", href: "/leaderboard", action: undefined },
                ] as Array<{ label: string; count?: string | number | null; color: string; href?: string; action?: () => void }>).map((action) => (
                  action.href ? (
                    <Link key={action.label} href={action.href}>
                      <button className={`w-full p-3 rounded-xl border text-left text-xs font-semibold transition-all hover:shadow-sm hover:-translate-y-0.5 ${action.color}`}>
                        {action.label}
                        {action.count !== null && action.count !== undefined && <div className="font-extrabold text-lg leading-none mt-1">{action.count}</div>}
                      </button>
                    </Link>
                  ) : (
                    <button key={action.label} onClick={action.action} className={`w-full p-3 rounded-xl border text-left text-xs font-semibold transition-all hover:shadow-sm hover:-translate-y-0.5 ${action.color}`}>
                      {action.label}
                      {action.count !== null && action.count !== undefined && <div className="font-extrabold text-lg leading-none mt-1">{action.count}</div>}
                    </button>
                  )
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div id="admin-tabs" />
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex flex-wrap gap-1 h-auto bg-muted p-1 rounded-xl">
            <TabsTrigger value="bookings" onClick={() => setActiveTab("bookings")}><Calendar className="w-4 h-4 mr-1.5" />Bookings</TabsTrigger>
            <TabsTrigger value="students" onClick={() => setActiveTab("students")}><Users className="w-4 h-4 mr-1.5" />Students</TabsTrigger>
            <TabsTrigger value="analytics" onClick={() => setActiveTab("analytics")}><BarChart3 className="w-4 h-4 mr-1.5" />Analytics</TabsTrigger>
            <TabsTrigger value="sms" onClick={() => setActiveTab("sms")}><MessageSquare className="w-4 h-4 mr-1.5" />SMS Broadcast</TabsTrigger>
            <TabsTrigger value="promos" onClick={() => setActiveTab("promos")}><Tag className="w-4 h-4 mr-1.5" />Promo Codes</TabsTrigger>
          </TabsList>

          {/* Bookings Tab */}
          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" /> All Bookings
                  </CardTitle>
                  <Select value={bookingFilter} onValueChange={setBookingFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {!bookings || bookings.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <Calendar className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    No bookings found.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bookings.map((item) => (
                      <div key={item.booking.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-border rounded-xl gap-3 hover:bg-muted/20 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-foreground text-sm capitalize">
                              {(item as any).program?.name || (item.booking.programId ? `Program #${item.booking.programId}` : "Booking")}
                            </span>
                            <Badge className={`text-xs ${statusColors[item.booking.status]}`}>
                              {item.booking.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            <span className="font-medium">{item.user?.name || "Unknown"}</span>
                            {item.user?.email && <span className="ml-2">{item.user.email}</span>}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.booking.sessionDate
                              ? `Session: ${new Date(item.booking.sessionDate).toLocaleDateString()}`
                              : `Booked: ${new Date(item.booking.createdAt).toLocaleDateString()}`}
                            {item.booking.notes && <span className="ml-2 italic">— {item.booking.notes}</span>}
                          </div>
                          {/* Coach Notes inline */}
                          {expandedNotes[item.booking.id] ? (
                            <div className="mt-2 flex gap-2">
                              <Textarea
                                className="text-xs h-16 resize-none"
                                placeholder="Add coaching notes (visible only to you)..."
                                value={noteDrafts[item.booking.id] ?? ((item.booking as any).coachNotes || "")}
                                onChange={(e) => setNoteDrafts(prev => ({ ...prev, [item.booking.id]: e.target.value }))}
                              />
                              <div className="flex flex-col gap-1">
                                <Button size="sm" className="h-7 px-2 text-xs bg-primary" onClick={() => {
                                  updateCoachNotesMutation.mutate({ id: item.booking.id, coachNotes: noteDrafts[item.booking.id] ?? ((item.booking as any).coachNotes || "") });
                                  setExpandedNotes(prev => ({ ...prev, [item.booking.id]: false }));
                                }} disabled={updateCoachNotesMutation.isPending}>
                                  <Save className="w-3 h-3" />
                                </Button>
                                <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setExpandedNotes(prev => ({ ...prev, [item.booking.id]: false }))}>
                                  <ChevronUp className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <button
                              className="mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                              onClick={() => {
                                setExpandedNotes(prev => ({ ...prev, [item.booking.id]: true }));
                                setNoteDrafts(prev => ({ ...prev, [item.booking.id]: (item.booking as any).coachNotes || "" }));
                              }}
                            >
                              <PenLine className="w-3 h-3" />
                              {(item.booking as any).coachNotes ? "Edit coach notes" : "Add coach notes"}
                              {(item.booking as any).coachNotes && <span className="text-primary font-medium"> • has notes</span>}
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-bold text-primary">
                            ${((item.booking.totalAmountCents || 0) / 100).toFixed(0)}
                          </span>
                          <div className="flex gap-1">
                            {item.booking.status === "pending" && (
                              <>
                                <Button size="sm" className="bg-green-600 text-white hover:bg-green-700 h-7 text-xs px-2"
                                  onClick={() => confirmNowMutation.mutate({ id: item.booking.id })}
                                  disabled={confirmNowMutation.isPending}>
                                  <CheckCircle className="w-3 h-3 mr-1" /> Confirm
                                </Button>
                                <Button size="sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 h-7 text-xs px-2"
                                  onClick={() => cancelNowMutation.mutate({ id: item.booking.id })}
                                  disabled={cancelNowMutation.isPending}>
                                  <XCircle className="w-3 h-3 mr-1" /> Cancel
                                </Button>
                              </>
                            )}
                            {item.booking.status === "confirmed" && (
                              <>
                                <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50 h-7 text-xs px-2"
                                  onClick={() => remindNowMutation.mutate({ id: item.booking.id })}
                                  disabled={remindNowMutation.isPending}
                                  title="Send day-before reminder via email & SMS">
                                  <Bell className="w-3 h-3 mr-1" /> Remind
                                </Button>
                                <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700 h-7 text-xs px-2"
                                  onClick={() => updateStatusMutation.mutate({ id: item.booking.id, status: "completed" })}>
                                  <CheckCircle className="w-3 h-3 mr-1" /> Complete
                                </Button>
                                <Button size="sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 h-7 text-xs px-2"
                                  onClick={() => cancelNowMutation.mutate({ id: item.booking.id })}
                                  disabled={cancelNowMutation.isPending}>
                                  <XCircle className="w-3 h-3 mr-1" /> Cancel
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" /> Student Directory
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!students || students.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    No students registered yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-3 text-muted-foreground font-medium">Name</th>
                          <th className="text-left py-2 px-3 text-muted-foreground font-medium">Email</th>
                          <th className="text-left py-2 px-3 text-muted-foreground font-medium">Phone</th>
                          <th className="text-left py-2 px-3 text-muted-foreground font-medium">SMS</th>
                          <th className="text-left py-2 px-3 text-muted-foreground font-medium">Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((student) => (
                          <tr key={student.id} className="border-b border-border/50 hover:bg-muted/20">
                            <td className="py-2.5 px-3 font-medium text-foreground">{student.name || "—"}</td>
                            <td className="py-2.5 px-3 text-muted-foreground">{student.email || "—"}</td>
                            <td className="py-2.5 px-3 text-muted-foreground">{(student as any).phone || "—"}</td>
                            <td className="py-2.5 px-3">
                              {(student as any).smsOptIn ? (
                                <Badge className="bg-green-100 text-green-800 text-xs">Opted In</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">No</Badge>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-muted-foreground text-xs">
                              {new Date(student.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <AnalyticsTab />
          </TabsContent>

          {/* SMS Broadcast Tab */}
          <TabsContent value="sms">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="w-5 h-5 text-primary" /> Send SMS Broadcast
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-primary/5 rounded-lg p-4 flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    <div>
                      <div className="font-semibold text-foreground">{smsCount?.count || 0} Subscribers</div>
                      <div className="text-xs text-muted-foreground">Students opted in to receive SMS</div>
                    </div>
                  </div>

                  <div>
                    <Label>Message</Label>
                    <Textarea
                      value={smsMessage}
                      onChange={(e) => setSmsMessage(e.target.value)}
                      placeholder="Type your message to all opted-in students... (e.g., 'Hi everyone! Court 3 is open today at 4:30 PM. See you out there! — Coach Mario')"
                      rows={5}
                      maxLength={1600}
                    />
                    <div className="text-xs text-muted-foreground mt-1 text-right">{smsMessage.length}/1600</div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                    <strong>Note:</strong> Messages will only be sent to students who have opted in to SMS notifications and have a phone number on file. To enable actual SMS delivery, configure your Twilio credentials in Settings.
                  </div>

                  <Button
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => sendSmsMutation.mutate({ message: smsMessage })}
                    disabled={!smsMessage.trim() || sendSmsMutation.isPending}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {sendSmsMutation.isPending ? "Sending..." : `Send to ${smsCount?.count || 0} Subscribers`}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Broadcasts</CardTitle>
                </CardHeader>
                <CardContent>
                  {!broadcasts || broadcasts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      No broadcasts sent yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {broadcasts.map((b) => (
                        <div key={b.id} className="p-3 border border-border rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <Badge className={b.status === "sent" ? "bg-green-100 text-green-800 text-xs" : "bg-muted text-muted-foreground text-xs"}>
                              {b.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {b.sentAt ? new Date(b.sentAt).toLocaleDateString() : "Draft"}
                            </span>
                          </div>
                          <p className="text-sm text-foreground line-clamp-2">{b.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">{b.recipientCount} recipients</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          {/* Promo Codes Tab */}
          <TabsContent value="promos">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Create Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Plus className="w-5 h-5 text-primary" /> Create Promo Code</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Code (e.g. FREELESSON, SUMMER50)</Label>
                    <Input
                      placeholder="FREELESSON"
                      value={promoForm.code}
                      onChange={(e) => setPromoForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                      className="uppercase font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Discount Type</Label>
                      <Select value={promoForm.discountType} onValueChange={(v) => setPromoForm(f => ({ ...f, discountType: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percent">Percentage Off (%)</SelectItem>
                          <SelectItem value="fixed">Fixed Amount Off ($)</SelectItem>
                          <SelectItem value="free">100% Free</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {promoForm.discountType !== "free" && (
                      <div>
                        <Label>{promoForm.discountType === "percent" ? "Percent Off" : "Dollars Off"}</Label>
                        <Input
                          type="number"
                          placeholder={promoForm.discountType === "percent" ? "50" : "20"}
                          value={promoForm.discountValue}
                          onChange={(e) => setPromoForm(f => ({ ...f, discountValue: e.target.value }))}
                        />
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Max Uses (blank = unlimited)</Label>
                      <Input
                        type="number"
                        placeholder="10"
                        value={promoForm.maxUses}
                        onChange={(e) => setPromoForm(f => ({ ...f, maxUses: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Expires At (optional)</Label>
                      <Input
                        type="date"
                        value={promoForm.expiresAt}
                        onChange={(e) => setPromoForm(f => ({ ...f, expiresAt: e.target.value }))}
                        min={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Applies To (blank = all programs)</Label>
                    <Input
                      placeholder="private_lesson, clinic_105 (comma-separated)"
                      value={promoForm.applicablePrograms}
                      onChange={(e) => setPromoForm(f => ({ ...f, applicablePrograms: e.target.value }))}
                    />
                  </div>
                  <Button
                    className="w-full bg-primary text-primary-foreground"
                    onClick={() => createPromoMutation.mutate({
                      code: promoForm.code,
                      discountType: promoForm.discountType as "percent" | "fixed" | "free",
                      discountValue: promoForm.discountType === "free" ? 100 : Number(promoForm.discountValue),
                      maxUses: promoForm.maxUses ? Number(promoForm.maxUses) : undefined,
                      expiresAt: promoForm.expiresAt ? new Date(promoForm.expiresAt).getTime().toString() : undefined,
                      appliesTo: promoForm.applicablePrograms ? promoForm.applicablePrograms.split(",").map(s => s.trim()) : undefined,
                    })}
                    disabled={!promoForm.code || (promoForm.discountType !== "free" && !promoForm.discountValue) || createPromoMutation.isPending}
                  >
                    {createPromoMutation.isPending ? "Creating..." : "Create Promo Code"}
                  </Button>
                </CardContent>
              </Card>

              {/* Existing Codes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Tag className="w-5 h-5 text-primary" /> Active Promo Codes</CardTitle>
                </CardHeader>
                <CardContent>
                  {!promoCodes || promoCodes.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                      <Tag className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p>No promo codes yet.</p>
                      <p className="text-xs mt-1">Create your first code — try <strong>TESTFREE</strong> (100% free) to test bookings without charges.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {promoCodes.map((p) => (
                        <div key={p.id} className="flex items-start justify-between p-3 border border-border rounded-lg gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-sm text-foreground">{p.code}</span>
                              <Badge className={p.discountType === "free" ? "bg-green-100 text-green-800 text-xs" : "bg-blue-100 text-blue-800 text-xs"}>
                                {p.discountType === "free" ? "FREE" : p.discountType === "percent" ? `${p.discountValue}% off` : `$${p.discountValue} off`}
                              </Badge>
                              {p.isActive ? (
                                <Badge className="bg-green-50 text-green-700 text-xs">Active</Badge>
                              ) : (
                                <Badge className="bg-red-50 text-red-700 text-xs">Expired</Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                              <div>Used: {p.usedCount}{p.maxUses ? ` / ${p.maxUses}` : " (unlimited)"}</div>
                              {p.expiresAt && <div>Expires: {new Date(p.expiresAt).toLocaleDateString()}</div>}
                              {p.appliesTo && <div>Programs: {p.appliesTo}</div>}
                            </div>
                          </div>
                          <button
                            onClick={() => deletePromoMutation.mutate({ id: p.id })}
                            className="text-muted-foreground hover:text-red-500 transition-colors mt-0.5"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
