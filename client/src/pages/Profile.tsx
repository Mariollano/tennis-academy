import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { User, Phone, Bell, Calendar, CheckCircle, Clock, XCircle, MessageSquare, Trophy, RefreshCw } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Link } from "wouter";

// Map program names to booking routes
const programRoutes: Record<string, string> = {
  "Private Lesson": "/book/private",
  "105 Game Clinic": "/book/clinic_105",
  "Junior Program": "/book/junior",
  "Summer Camp": "/book/summer_camp",
  "Mental Coaching": "/book/mental_coaching",
  "Tournament Attendance": "/book/tournament",
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  completed: "bg-blue-100 text-blue-800",
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="w-3.5 h-3.5" />,
  confirmed: <CheckCircle className="w-3.5 h-3.5" />,
  cancelled: <XCircle className="w-3.5 h-3.5" />,
  completed: <CheckCircle className="w-3.5 h-3.5" />,
};

export default function Profile() {
  const { user, isAuthenticated, loading } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [saved, setSaved] = useState(false);
  const [cancelBookingId, setCancelBookingId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const cancelBookingMutation = trpc.user.cancelBooking.useMutation({
    onSuccess: () => {
      toast.success("Booking cancelled successfully.");
      utils.user.getMyBookings.invalidate();
      setCancelBookingId(null);
    },
    onError: (e) => {
      toast.error(e.message || "Failed to cancel booking.");
      setCancelBookingId(null);
    },
  });

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone((user as any).phone || "");
      setSmsOptIn((user as any).smsOptIn || false);
    }
  }, [user]);

  const { data: bookings, isLoading: bookingsLoading } = trpc.user.getMyBookings.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const updateProfileMutation = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      setSaved(true);
      toast.success("Profile updated successfully!");
      setTimeout(() => setSaved(false), 3000);
    },
    onError: () => toast.error("Failed to update profile."),
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
          <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Sign In Required</h2>
          <p className="text-muted-foreground mb-6">Please sign in to view your profile and bookings.</p>
          <Button
            className="bg-primary text-primary-foreground"
            onClick={() => (window.location.href = getLoginUrl())}
          >
            Sign In
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-primary text-primary-foreground py-10">
        <div className="container">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center text-3xl font-extrabold text-accent-foreground shadow-xl border-4 border-white/20" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                {user?.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-2 border-primary" title="Online" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-extrabold" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{user?.name || "My Profile"}</h1>
              <p className="text-primary-foreground/60 text-sm">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-accent/20 text-accent border-accent/30 text-xs capitalize">
                  {user?.role === "admin" ? "Coach / Admin" : "Student"}
                </Badge>
                <Badge className="bg-white/10 text-primary-foreground/60 border-white/20 text-xs">
                  Member
                </Badge>
              </div>
            </div>
            <Link href="/programs">
              <Button className="bg-accent text-accent-foreground hover:brightness-105 font-bold rounded-full px-6 shrink-0">
                Book a Session
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Next Session Countdown Banner */}
      {bookings && (() => {
        const today = new Date();
        const nextSession = bookings
          .filter(b => (b.status === 'confirmed' || b.status === 'pending') && b.sessionDate)
          .map(b => ({ ...b, date: new Date(b.sessionDate! + 'T12:00:00') }))
          .filter(b => b.date >= today)
          .sort((a, b) => a.date.getTime() - b.date.getTime())[0];
        if (!nextSession) return null;
        const daysUntil = Math.ceil((nextSession.date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return (
          <div className="bg-accent/10 border-b border-accent/20">
            <div className="container py-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Next Session</div>
                    <div className="font-bold text-foreground text-sm">
                      {nextSession.programName || 'Session'} — {nextSession.date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl font-extrabold text-primary" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                    {daysUntil === 0 ? 'TODAY!' : daysUntil === 1 ? 'TOMORROW' : `${daysUntil} DAYS`}
                  </div>
                  <div className="text-xs text-muted-foreground">{nextSession.status === 'confirmed' ? '✓ Confirmed' : 'Pending confirmation'}</div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      <div className="container py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Settings */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="w-5 h-5 text-primary" /> Profile Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Full Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                </div>
                <div>
                  <Label className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> Phone Number
                  </Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (401) 555-0000" type="tel" />
                  <p className="text-xs text-muted-foreground mt-1">Required for SMS updates</p>
                </div>

                <Separator />

                {/* SMS Opt-In */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="flex items-center gap-1.5 font-semibold">
                        <MessageSquare className="w-4 h-4 text-primary" /> SMS Updates
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Daily updates, schedule changes & motivational messages from Coach Mario
                      </p>
                    </div>
                    <Switch
                      checked={smsOptIn}
                      onCheckedChange={setSmsOptIn}
                      disabled={!phone}
                    />
                  </div>
                  {smsOptIn && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-800 flex items-start gap-2">
                      <Bell className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      You'll receive SMS updates from Coach Mario. You can opt out anytime.
                    </div>
                  )}
                  {!phone && (
                    <p className="text-xs text-amber-600">Add a phone number to enable SMS updates.</p>
                  )}
                </div>

                <Button
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => updateProfileMutation.mutate({ name, phone, smsOptIn })}
                  disabled={updateProfileMutation.isPending}
                >
                  {saved ? <><CheckCircle className="w-4 h-4 mr-1" /> Saved!</> : "Save Changes"}
                </Button>
              </CardContent>
            </Card>

            {/* Tennis Stats Card */}
            {bookings && bookings.length > 0 && (() => {
              const completed = bookings.filter(b => b.status === 'completed' || b.status === 'confirmed').length;
              const upcoming = bookings.filter(b => (b.status === 'confirmed' || b.status === 'pending') && b.sessionDate && new Date(b.sessionDate + 'T12:00:00') >= new Date()).length;
              const cancelled = bookings.filter(b => b.status === 'cancelled').length;
              const totalSpent = bookings.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + (b.totalAmountCents || 0), 0);
              // Program type breakdown
              const byType: Record<string, number> = {};
              bookings.filter(b => b.status !== 'cancelled').forEach(b => {
                const t = b.programName || 'Other';
                byType[t] = (byType[t] || 0) + 1;
              });
              const typeEntries = Object.entries(byType).sort((a, b) => b[1] - a[1]).slice(0, 3);
              // Milestones
              const milestones = [
                { label: 'First Session', icon: '🎾', target: 1, achieved: completed >= 1 },
                { label: '5 Sessions', icon: '⭐', target: 5, achieved: completed >= 5 },
                { label: '10 Sessions', icon: '🏆', target: 10, achieved: completed >= 10 },
                { label: '25 Sessions', icon: '🥇', target: 25, achieved: completed >= 25 },
              ];
              const nextMilestone = milestones.find(m => !m.achieved);
              const progressPct = nextMilestone ? Math.min(100, Math.round((completed / nextMilestone.target) * 100)) : 100;
              return (
                <Card className="bg-primary text-primary-foreground border-0 overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-accent" />
                      </div>
                      <h3 className="font-extrabold text-sm uppercase tracking-wider" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>My Progress</h3>
                    </div>
                    {/* Stats grid */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="bg-white/10 rounded-xl p-2.5 text-center">
                        <div className="text-2xl font-extrabold text-accent" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{bookings.length}</div>
                        <div className="text-[10px] text-primary-foreground/60 mt-0.5">Total</div>
                      </div>
                      <div className="bg-white/10 rounded-xl p-2.5 text-center">
                        <div className="text-2xl font-extrabold text-green-300" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{completed}</div>
                        <div className="text-[10px] text-primary-foreground/60 mt-0.5">Done</div>
                      </div>
                      <div className="bg-white/10 rounded-xl p-2.5 text-center">
                        <div className="text-2xl font-extrabold text-accent" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{upcoming}</div>
                        <div className="text-[10px] text-primary-foreground/60 mt-0.5">Upcoming</div>
                      </div>
                    </div>
                    {/* Milestone progress */}
                    {nextMilestone && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-primary-foreground/70">Next: {nextMilestone.icon} {nextMilestone.label}</span>
                          <span className="text-xs font-bold text-accent">{completed}/{nextMilestone.target}</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-accent to-yellow-300 transition-all duration-700" style={{ width: `${progressPct}%` }} />
                        </div>
                      </div>
                    )}
                    {nextMilestone === undefined && (
                      <div className="mb-4 text-center">
                        <span className="text-xs text-accent font-bold">🥇 All milestones achieved! Legend status!</span>
                      </div>
                    )}
                    {/* Milestones row */}
                    <div className="flex items-center justify-between mb-4">
                      {milestones.map(m => (
                        <div key={m.label} className={`flex flex-col items-center gap-0.5 ${m.achieved ? 'opacity-100' : 'opacity-30'}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-base ${m.achieved ? 'bg-accent/30 ring-1 ring-accent' : 'bg-white/10'}`}>{m.icon}</div>
                          <span className="text-[9px] text-primary-foreground/60">{m.target}</span>
                        </div>
                      ))}
                    </div>
                    {/* Program breakdown */}
                    {typeEntries.length > 0 && (
                      <div className="mb-4">
                        <div className="text-[10px] text-primary-foreground/50 uppercase tracking-wider mb-2">Sessions by Program</div>
                        <div className="space-y-1.5">
                          {typeEntries.map(([name, count]) => (
                            <div key={name} className="flex items-center gap-2">
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-0.5">
                                  <span className="text-[10px] text-primary-foreground/70 truncate">{name}</span>
                                  <span className="text-[10px] font-bold text-accent ml-1">{count}</span>
                                </div>
                                <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                                  <div className="h-full rounded-full bg-accent/60" style={{ width: `${Math.round((count / bookings.length) * 100)}%` }} />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Total spent */}
                    {totalSpent > 0 && (
                      <div className="bg-white/10 rounded-xl p-3 mb-4 flex items-center justify-between">
                        <span className="text-xs text-primary-foreground/60">Total Invested</span>
                        <span className="font-extrabold text-accent text-lg" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>${(totalSpent / 100).toFixed(0)}</span>
                      </div>
                    )}
                    <Link href="/programs">
                      <button className="w-full py-2 rounded-xl bg-accent text-accent-foreground font-bold text-xs hover:brightness-105 transition-all">
                        Book Another Session
                      </button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })()}

            {user?.role === "admin" && (
              <Card className="border-accent bg-accent/5">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-foreground mb-2">Admin Access</h3>
                  <p className="text-sm text-muted-foreground mb-3">You have admin access to manage the academy.</p>
                  <Link href="/admin">
                    <Button className="w-full bg-primary text-primary-foreground">Go to Admin Dashboard</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Bookings */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="w-5 h-5 text-primary" /> My Bookings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bookingsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : !bookings || bookings.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
                      <Calendar className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-extrabold text-foreground mb-2" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>NO SESSIONS YET</h3>
                    <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">You haven't booked any sessions yet. Book your first session with Coach Mario and start your tennis journey!</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Link href="/programs">
                        <button className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors">
                          Browse Programs
                        </button>
                      </Link>
                      <Link href="/book/clinic_105">
                        <button className="px-6 py-2.5 rounded-full border border-border text-foreground font-semibold text-sm hover:bg-muted transition-colors">
                          Try the 105 Clinic ($35)
                        </button>
                      </Link>
                    </div>
                    <p className="text-xs text-muted-foreground mt-4">Use code <span className="font-mono font-bold text-primary">TESTFREE</span> for a free test booking</p>
                  </div>
                ) : (
                  <>
                  {/* Separate upcoming and past bookings */}
                  {(() => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const upcoming = bookings.filter(b => {
                      if (!b.sessionDate) return b.status === 'pending' || b.status === 'confirmed';
                      return new Date(b.sessionDate + 'T12:00:00') >= today && b.status !== 'cancelled';
                    });
                    const past = bookings.filter(b => {
                      if (!b.sessionDate) return b.status === 'completed' || b.status === 'cancelled';
                      return new Date(b.sessionDate + 'T12:00:00') < today || b.status === 'cancelled';
                    });

                    const BookingRow = ({ booking }: { booking: typeof bookings[0] }) => (
                      <div key={booking.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border rounded-xl hover:bg-muted/20 transition-colors gap-3">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            booking.status === 'confirmed' ? 'bg-green-100' :
                            booking.status === 'pending' ? 'bg-amber-100' :
                            booking.status === 'cancelled' ? 'bg-red-100' : 'bg-primary/10'
                          }`}>
                            <Calendar className={`w-5 h-5 ${
                              booking.status === 'confirmed' ? 'text-green-600' :
                              booking.status === 'pending' ? 'text-amber-600' :
                              booking.status === 'cancelled' ? 'text-red-400' : 'text-primary'
                            }`} />
                          </div>
                          <div>
                            <div className="font-semibold text-foreground text-sm capitalize">
                              {booking.programName || "Booking"}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {(() => {
                                const formatDate = (d: string | Date | null | undefined) => {
                                  if (!d) return null;
                                  const date = typeof d === 'string' ? new Date(d.includes('T') ? d : d + 'T12:00:00') : new Date(d);
                                  if (isNaN(date.getTime())) return null;
                                  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
                                };
                                return formatDate(booking.sessionDate) || formatDate(booking.createdAt) || 'Date TBD';
                              })()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-13 sm:ml-0">
                          {(booking.totalAmountCents || 0) > 0 && (
                            <span className="font-bold text-primary text-sm">
                              ${((booking.totalAmountCents || 0) / 100).toFixed(0)}
                            </span>
                          )}
                          <Badge className={`text-xs flex items-center gap-1 capitalize ${statusColors[booking.status] || "bg-muted text-muted-foreground"}`}>
                            {statusIcons[booking.status]}
                            {booking.status}
                          </Badge>
                          {(booking.status === "pending" || booking.status === "confirmed") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 h-7"
                              onClick={() => setCancelBookingId(booking.id)}
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" /> Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    );

                    return (
                      <div className="space-y-6">
                        {upcoming.length > 0 && (
                          <div>
                            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                              Upcoming Sessions ({upcoming.length})
                            </h3>
                            <div className="space-y-2">
                              {upcoming.map(b => <BookingRow key={b.id} booking={b} />)}
                            </div>
                          </div>
                        )}
                        {past.length > 0 && (
                          <div>
                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-muted-foreground inline-block" />
                              Past Sessions ({past.length})
                            </h3>
                            <div className="space-y-2 opacity-70">
                              {past.map(b => <BookingRow key={b.id} booking={b} />)}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Cancel confirmation dialog */}
                  <AlertDialog open={cancelBookingId !== null} onOpenChange={(open) => { if (!open) setCancelBookingId(null); }}>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will cancel your booking. If you paid, please contact Coach Mario at ritennismario@gmail.com to arrange a refund.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-600 hover:bg-red-700 text-white"
                          onClick={() => cancelBookingId !== null && cancelBookingMutation.mutate({ id: cancelBookingId })}
                        >
                          Yes, Cancel Booking
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
