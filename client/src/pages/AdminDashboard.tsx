import { useState, useMemo } from "react";
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

const PROGRAM_LABELS: Record<string, string> = {
  private_lesson: "Private Lesson",
  clinic_105: "105 Clinic",
  junior_program: "Junior Program",
  summer_camp: "Summer Camp",
  stringing: "Stringing",
  merchandise: "Merchandise",
  tournament: "Tournament",
};

const PROGRAM_COLORS: Record<string, string> = {
  private_lesson: "bg-blue-100 text-blue-800",
  clinic_105: "bg-yellow-100 text-yellow-800",
  junior_program: "bg-purple-100 text-purple-800",
  summer_camp: "bg-orange-100 text-orange-800",
  stringing: "bg-gray-100 text-gray-800",
  merchandise: "bg-pink-100 text-pink-800",
  tournament: "bg-red-100 text-red-800",
};

function TodayTab({ markPaidMutation, refetchBookings }: { markPaidMutation: any; refetchBookings: () => void }) {
  const today = new Date();
  const todayStr = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, "0")}-${String(today.getUTCDate()).padStart(2, "0")}`;

  const { data: bookings, isLoading } = trpc.booking.adminList.useQuery(
    { limit: 200 },
    { refetchInterval: 30000 }
  );

  const todayBookings = (bookings || []).filter(b => {
    const d = b.booking.sessionDate;
    if (!d) return false;
    const ds = typeof d === "string" ? d : `${(d as Date).getUTCFullYear()}-${String((d as Date).getUTCMonth() + 1).padStart(2, "0")}-${String((d as Date).getUTCDate()).padStart(2, "0")}`;
    return ds.startsWith(todayStr) && b.booking.status !== "cancelled";
  });

  // Group by program type
  const grouped: Record<string, typeof todayBookings> = {};
  for (const b of todayBookings) {
    const key = b.program?.type || "other";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(b);
  }

  const paidCount = todayBookings.filter(b => b.booking.paidAt || b.booking.paymentMethod === "card").length;
  const unpaidCount = todayBookings.length - paidCount;

  if (isLoading) {
    return <div className="flex items-center justify-center py-16"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-extrabold text-foreground">{todayBookings.length}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Total Today</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-extrabold text-green-600">{paidCount}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Paid (Card)</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-extrabold text-amber-600">{unpaidCount}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Cash / Check Due</div>
          </CardContent>
        </Card>
      </div>

      {todayBookings.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No sessions scheduled for today.</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped).map(([programType, items]) => (
          <Card key={programType}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${PROGRAM_COLORS[programType] || "bg-gray-100 text-gray-800"}`}>
                  {PROGRAM_LABELS[programType] || programType}
                </span>
                <span className="text-muted-foreground font-normal text-sm">{items.length} student{items.length !== 1 ? "s" : ""}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {items.map(({ booking, user, program }) => {
                  const isPaid = !!(booking.paidAt || booking.paymentMethod === "card");
                  const isCash = booking.paymentMethod === "cash";
                  const isCheck = booking.paymentMethod === "check";
                  const amountDollars = ((booking.totalAmountCents || 0) / 100).toFixed(0);
                  return (
                    <div key={booking.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-foreground truncate">{user?.name || "Guest"}</div>
                        <div className="text-xs text-muted-foreground truncate">{user?.email || ""}{user?.phone ? ` · ${user.phone}` : ""}</div>
                        {booking.sessionStartTime && (
                          <div className="text-xs text-muted-foreground mt-0.5">⏰ {booking.sessionStartTime}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-bold text-foreground">${amountDollars}</span>
                        {isPaid ? (
                          <Badge className="bg-green-100 text-green-800 text-xs px-2 py-0.5">✅ PAID</Badge>
                        ) : isCash ? (
                          <Badge className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5">💵 CASH DUE</Badge>
                        ) : isCheck ? (
                          <Badge className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5">📝 CHECK DUE</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5">PENDING</Badge>
                        )}
                        {(isCash || isCheck) && !booking.paidAt && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 px-2 border-green-500 text-green-700 hover:bg-green-50"
                            onClick={() => markPaidMutation.mutate({ id: booking.id }, { onSuccess: refetchBookings })}
                            disabled={markPaidMutation.isPending}
                          >
                            Mark Paid
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

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
  const [activeTab, setActiveTab] = useState("today");
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

  const markPaidMutation = trpc.booking.markPaid.useMutation({
    onSuccess: () => { toast.success("Booking marked as paid and confirmed!"); refetchBookings(); },
    onError: () => toast.error("Failed to mark booking as paid."),
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
                  { label: "Post Announcement", count: null as null, color: "bg-red-50 border-red-200 text-red-800", href: "/announcements", action: undefined },
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
            <TabsTrigger value="today" onClick={() => setActiveTab("today")}><Clock className="w-4 h-4 mr-1.5" />Today</TabsTrigger>
            <TabsTrigger value="bookings" onClick={() => setActiveTab("bookings")}><Calendar className="w-4 h-4 mr-1.5" />Bookings</TabsTrigger>
            <TabsTrigger value="students" onClick={() => setActiveTab("students")}><Users className="w-4 h-4 mr-1.5" />Students</TabsTrigger>
            <TabsTrigger value="analytics" onClick={() => setActiveTab("analytics")}><BarChart3 className="w-4 h-4 mr-1.5" />Analytics</TabsTrigger>
            <TabsTrigger value="sms" onClick={() => setActiveTab("sms")}><MessageSquare className="w-4 h-4 mr-1.5" />SMS Broadcast</TabsTrigger>
            <TabsTrigger value="promos" onClick={() => setActiveTab("promos")}><Tag className="w-4 h-4 mr-1.5" />Promo Codes</TabsTrigger>
            <TabsTrigger value="roster" onClick={() => setActiveTab("roster")}><Users className="w-4 h-4 mr-1.5" />Roster</TabsTrigger>
            <TabsTrigger value="calendar" onClick={() => setActiveTab("calendar")}><Calendar className="w-4 h-4 mr-1.5" />Calendar Sync</TabsTrigger>
          </TabsList>

          {/* Today Tab */}
          <TabsContent value="today">
            <TodayTab markPaidMutation={markPaidMutation} refetchBookings={refetchBookings} />
          </TabsContent>

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
                            {(item.booking as any).paymentMethod === "cash" && (
                              <Badge className="text-xs bg-green-100 text-green-800 border border-green-300">
                                💵 Cash at Lesson
                              </Badge>
                            )}
                            {(item.booking as any).paymentMethod === "check" && (
                              <Badge className="text-xs bg-blue-100 text-blue-800 border border-blue-300">
                                📝 Check at Lesson
                              </Badge>
                            )}
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
                                {/* Show Mark Paid for cash/check bookings */}
                                {((item.booking as any).paymentMethod === "cash" || (item.booking as any).paymentMethod === "check") && (
                                  <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700 h-7 text-xs px-2"
                                    onClick={() => markPaidMutation.mutate({ id: item.booking.id })}
                                    disabled={markPaidMutation.isPending}
                                    title="Mark as paid and confirm booking">
                                    <CheckCircle className="w-3 h-3 mr-1" /> Mark Paid
                                  </Button>
                                )}
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
          {/* Roster Tab */}
          <TabsContent value="roster">
            <RosterTab />
          </TabsContent>
          {/* Calendar Sync Tab */}
          <TabsContent value="calendar">
            <CalendarSyncTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ─── Roster Tab Component ─────────────────────────────────────────────────────

function SlotRosterRow({ slot }: { slot: {
  slotId: number; slotDate: unknown; startTime: string | null; endTime: string | null;
  maxParticipants: number; enrolled: number; spotsLeft: number;
  programName: string | null; programType: string | null;
}}) {
  const [expanded, setExpanded] = useState(false);
  const { data: enrollees, isLoading } = trpc.schedule.getEnrollees.useQuery(
    { slotId: slot.slotId },
    { enabled: expanded }
  );

  function slotDateStr(raw: unknown): string {
    if (typeof raw === "string") return raw.slice(0, 10);
    const d = new Date(raw as any);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
  }

  function fmtTime(t: string | null | undefined) {
    if (!t) return "";
    const [h, m] = t.split(":");
    const hour = parseInt(h);
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
  }

  const dateStr = slotDateStr(slot.slotDate);
  const dateObj = new Date(dateStr + "T12:00:00");
  const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });
  const dateFmt = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const pct = slot.maxParticipants > 0 ? (slot.enrolled / slot.maxParticipants) * 100 : 0;
  const barColor = pct >= 100 ? "bg-red-500" : pct >= 75 ? "bg-amber-500" : "bg-green-500";
  const typeKey = slot.programType ?? "";
  const badgeClass = PROGRAM_COLORS[typeKey] ?? "bg-gray-100 text-gray-800 border-gray-200";

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center gap-3 p-3 hover:bg-muted/40 transition-colors text-left"
        onClick={() => setExpanded(e => !e)}
      >
        {/* Date */}
        <div className="flex-shrink-0 w-16 text-center">
          <div className="text-xs font-bold text-muted-foreground uppercase">{dayName}</div>
          <div className="text-sm font-bold text-foreground">{dateFmt}</div>
        </div>
        {/* Program badge */}
        <Badge className={`text-xs border flex-shrink-0 ${badgeClass}`}>
          {PROGRAM_LABELS[typeKey] ?? slot.programName ?? typeKey}
        </Badge>
        {/* Time */}
        <div className="text-xs text-muted-foreground flex-shrink-0">
          {fmtTime(slot.startTime)}{slot.endTime ? ` – ${fmtTime(slot.endTime)}` : ""}
        </div>
        {/* Fill bar */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
            <span className="text-xs font-semibold text-foreground flex-shrink-0">
              {slot.enrolled}/{slot.maxParticipants}
            </span>
          </div>
        </div>
        {/* Expand icon */}
        <div className="flex-shrink-0 text-muted-foreground">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border bg-muted/20 px-4 py-3">
          {isLoading ? (
            <div className="text-sm text-muted-foreground py-2">Loading roster…</div>
          ) : !enrollees || enrollees.length === 0 ? (
            <div className="text-sm text-muted-foreground py-2 italic">No sign-ups yet for this session.</div>
          ) : (
            <div className="space-y-2">
              {enrollees.map((e, i) => (
                <div key={e.bookingId} className="flex items-center gap-3 text-sm">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <span className="font-medium text-foreground flex-1">{e.studentName ?? "Guest"}</span>
                  <span className="text-muted-foreground text-xs">{e.studentEmail}</span>
                  {e.studentPhone && <span className="text-muted-foreground text-xs">{e.studentPhone}</span>}
                  <Badge className={`text-xs ${e.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>{e.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RosterTab() {
  const [programFilter, setProgramFilter] = useState("all");
  const [showPast, setShowPast] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const pastFrom = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  }, []);

  const { data: slots, isLoading } = trpc.schedule.getRosterSummary.useQuery({
    programType: programFilter === "all" ? undefined : programFilter,
    from: showPast ? pastFrom : today,
  }, { staleTime: 30_000 });

  // Group by date
  const grouped = useMemo(() => {
    if (!slots) return [];
    const map: Record<string, typeof slots> = {};
    for (const s of slots) {
      const raw: unknown = s.slotDate;
      const dateStr = typeof raw === "string" ? raw.slice(0, 10) : (() => { const d = new Date(raw as any); return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`; })();
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(s);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [slots]);

  const totalEnrolled = slots?.reduce((sum, s) => sum + s.enrolled, 0) ?? 0;
  const totalSlots = slots?.length ?? 0;

  return (
    <div className="space-y-4">
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">Session Roster</h2>
          <p className="text-xs text-muted-foreground">{totalEnrolled} sign-up{totalEnrolled !== 1 ? 's' : ''} across {totalSlots} session{totalSlots !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={programFilter} onValueChange={setProgramFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Programs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs</SelectItem>
              <SelectItem value="clinic_105">105 Clinic</SelectItem>
              <SelectItem value="junior">Junior Program</SelectItem>
              <SelectItem value="private_lesson">Private Lesson</SelectItem>
              <SelectItem value="cardio_tennis">Cardio Tennis</SelectItem>
              <SelectItem value="adult_beginner">Adult Beginner</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPast(p => !p)}
            className={showPast ? "bg-primary/10 border-primary/30" : ""}
          >
            {showPast ? "Hide Past" : "Show Past 30 Days"}
          </Button>
        </div>
      </div>

      {/* Slot list */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No sessions found</p>
            <p className="text-xs mt-1">Try changing the program filter or enabling past sessions.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {grouped.map(([dateStr, daySlots]) => {
            const dateObj = new Date(dateStr + "T12:00:00");
            const dayLabel = dateObj.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
            const dayTotal = daySlots.reduce((s, x) => s + x.enrolled, 0);
            return (
              <div key={dateStr}>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-sm font-bold text-foreground">{dayLabel}</h3>
                  <span className="text-xs text-muted-foreground">· {dayTotal} enrolled</span>
                </div>
                <div className="space-y-2">
                  {daySlots.map(slot => (
                    <SlotRosterRow key={slot.slotId} slot={slot} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Calendar Sync Tab Component ──────────────────────────────────────────────
function CalendarSyncTab() {
  const { data } = trpc.admin.getCalendarUrl.useQuery();
  const calendarUrl = data?.token
    ? `${window.location.origin}/api/calendar/${data.token}/bookings.ics`
    : null;

  const [copied, setCopied] = useState(false);

  function handleCopy() {
    if (!calendarUrl) return;
    navigator.clipboard.writeText(calendarUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Sync Bookings to Your Calendar
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Subscribe to this private calendar URL in Apple Calendar or Google Calendar.
            Every booking will appear automatically and stay up to date.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {calendarUrl ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={calendarUrl}
                  className="flex-1 text-xs font-mono bg-muted border border-border rounded-lg px-3 py-2 text-foreground truncate"
                />
                <Button onClick={handleCopy} size="sm" className="shrink-0">
                  {copied ? "✓ Copied!" : "Copy URL"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This URL is private — only share it with yourself. It contains all your bookings.
              </p>
            </div>
          ) : (
            <div className="animate-pulse h-10 bg-muted rounded-lg" />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">How to Subscribe</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Apple Calendar */}
          <div>
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs">🍎</span>
              Apple Calendar (iPhone, iPad, Mac)
            </h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Copy the URL above</li>
              <li>Open <strong>Apple Calendar</strong> on your Mac</li>
              <li>Click <strong>File → New Calendar Subscription</strong></li>
              <li>Paste the URL and click <strong>Subscribe</strong></li>
              <li>Set <strong>Auto-refresh</strong> to <strong>Every 15 minutes</strong></li>
              <li>Click <strong>OK</strong> — done!</li>
            </ol>
            <p className="text-xs text-muted-foreground mt-2">
              On iPhone: Settings → Calendar → Accounts → Add Account → Other → Add Subscribed Calendar → paste URL.
            </p>
          </div>

          {/* Google Calendar */}
          <div>
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-50 rounded-full flex items-center justify-center text-xs">📅</span>
              Google Calendar
            </h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Copy the URL above</li>
              <li>Open <strong>Google Calendar</strong> at calendar.google.com</li>
              <li>On the left, click <strong>+ Other calendars → From URL</strong></li>
              <li>Paste the URL and click <strong>Add calendar</strong></li>
              <li>Done! Google syncs it automatically (every few hours)</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
