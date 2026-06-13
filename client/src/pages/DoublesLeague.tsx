import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Users, Calendar, Clock, DollarSign, CheckCircle, Trophy, ChevronRight, Phone, Mail, User, Swords } from "lucide-react";

// ─── Success Screen ───────────────────────────────────────────────────────────
function DoublesLeagueSuccess({ signupId }: { signupId: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-black mb-3">You're In! 🎾</h1>
        <p className="text-muted-foreground mb-6 text-lg">
          Your spot is confirmed. Coach Mario will assign your doubles partner before the session.
        </p>
        <div className="bg-gradient-to-br from-[#0f1f5c] to-[#1a3a8f] rounded-2xl p-6 mb-6 text-white text-left space-y-3">
          <div className="flex items-center gap-2 text-[#ccff00] font-bold text-sm uppercase tracking-wider">
            <Trophy className="w-4 h-4" /> What Happens Next
          </div>
          <ul className="space-y-2 text-sm text-white/90">
            <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-0.5 text-[#ccff00] shrink-0" /> Coach Mario will assign your doubles partner</li>
            <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-0.5 text-[#ccff00] shrink-0" /> Show up 5–10 minutes early to warm up</li>
            <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-0.5 text-[#ccff00] shrink-0" /> All skill levels welcome — just bring your racket!</li>
            <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-0.5 text-[#ccff00] shrink-0" /> Questions? Text Coach Mario: (401) 965-5873</li>
          </ul>
        </div>
        <div className="flex gap-3">
          <a href="/doubles-league" className="flex-1">
            <Button variant="outline" className="w-full">Sign Up for Another Session</Button>
          </a>
          <a href="/programs" className="flex-1">
            <Button className="w-full bg-[#1a3a8f] hover:bg-[#0f1f5c] text-white">
              All Programs
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DoublesLeague() {
  const [location] = useLocation();
  const params = new URLSearchParams(location.split("?")[1] || "");
  const paymentStatus = params.get("payment");
  const signupId = params.get("signup") || "";

  if (paymentStatus === "success" && signupId) {
    return <DoublesLeagueSuccess signupId={signupId} />;
  }

  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [playerEmail, setPlayerEmail] = useState("");
  const [playerPhone, setPlayerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash" | "check">("card");
  const [showForm, setShowForm] = useState(false);

  const { data: sessions = [], isLoading } = trpc.doublesLeague.listSessions.useQuery();

  // Get signups for selected session
  const { data: sessionSignups = [] } = trpc.doublesLeague.getSignups.useQuery(
    { sessionId: selectedSessionId! },
    { enabled: selectedSessionId !== null }
  );

  const signUpMutation = trpc.doublesLeague.signUp.useMutation({
    onSuccess: (data) => {
      if (data.requiresPayment && data.checkoutUrl) {
        toast.success("Redirecting to checkout...");
        window.location.href = data.checkoutUrl;
      } else {
        toast.success("You're signed up! See you on the court 🎾");
        // Redirect to success page
        window.location.href = `/doubles-league?payment=success&signup=${data.signupId}`;
      }
    },
    onError: (err) => {
      toast.error(err.message || "Sign-up failed. Please try again.");
    },
  });

  const selectedSession = sessions.find(s => s.id === selectedSessionId);

  const handleSelectSession = (id: number) => {
    setSelectedSessionId(id);
    setShowForm(true);
    // Scroll to form
    setTimeout(() => {
      document.getElementById("signup-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSessionId) {
      toast.error("Please select a session first");
      return;
    }
    if (!playerName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!playerEmail.trim()) {
      toast.error("Please enter your email");
      return;
    }
    signUpMutation.mutate({
      sessionId: selectedSessionId,
      playerName: playerName.trim(),
      playerEmail: playerEmail.trim(),
      playerPhone: playerPhone.trim() || undefined,
      paymentMethod,
      origin: window.location.origin,
    });
  };

  const dayColors: Record<string, string> = {
    tuesday: "bg-blue-100 text-blue-800",
    thursday: "bg-purple-100 text-purple-800",
    saturday: "bg-amber-100 text-amber-800",
  };

  const dayLabels: Record<string, string> = {
    tuesday: "Tuesday",
    thursday: "Thursday",
    saturday: "Saturday",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0f1f5c] via-[#1a3a8f] to-[#0f1f5c] text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Swords className="h-4 w-4 text-[#ccff00]" />
            <span>New Program</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
            Doubles League
          </h1>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Competitive doubles play with Coach Mario's expert matchmaking. Sign up solo — we pair you with a partner!
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
              <Calendar className="w-4 h-4 text-[#ccff00]" />
              <span>Tue &amp; Thu 6:30–8 PM · Sat 9–11 AM</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
              <DollarSign className="w-4 h-4 text-[#ccff00]" />
              <span>$15 per session</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
              <Users className="w-4 h-4 text-[#ccff00]" />
              <span>All skill levels welcome</span>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-muted/40 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-black text-center mb-8">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: "1", icon: Calendar, title: "Pick a Session", desc: "Choose any upcoming Tuesday, Thursday, or Saturday session below." },
              { step: "2", icon: DollarSign, title: "Pay $15", desc: "Secure your spot with a quick $15 payment. Cash and check also accepted." },
              { step: "3", icon: Trophy, title: "Play Doubles!", desc: "Coach Mario assigns you a partner. Show up, warm up, and compete!" },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-[#1a3a8f] text-white font-black text-lg flex items-center justify-center mx-auto mb-3">
                  {step}
                </div>
                <Icon className="w-6 h-6 text-accent mx-auto mb-2" />
                <h3 className="font-bold mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-black mb-2">Upcoming Sessions</h2>
        <p className="text-muted-foreground mb-6">Select a session to sign up. All sessions are 2 hours of competitive doubles play.</p>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No upcoming sessions scheduled yet.</p>
            <p className="text-sm mt-1">Check back soon or text Coach Mario at (401) 965-5873.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map(session => {
              const isSelected = selectedSessionId === session.id;
              return (
                <div
                  key={session.id}
                  className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                    isSelected
                      ? "border-[#1a3a8f] bg-[#1a3a8f]/5 shadow-md"
                      : "border-border hover:border-[#1a3a8f]/40 hover:shadow-sm bg-card"
                  }`}
                  onClick={() => handleSelectSession(session.id)}
                >
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isSelected ? "bg-[#1a3a8f] text-white" : "bg-muted"}`}>
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-sm">{session.displayDate}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{session.displayTime}</span>
                          <Badge className={`text-xs ${dayColors[session.dayOfWeek] || "bg-gray-100 text-gray-800"}`}>
                            {dayLabels[session.dayOfWeek] || session.dayOfWeek}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-black text-lg text-[#1a3a8f]">$15</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {session.signupCount} signed up
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className={isSelected ? "bg-[#1a3a8f] text-white" : "bg-accent text-accent-foreground"}
                        onClick={(e) => { e.stopPropagation(); handleSelectSession(session.id); }}
                      >
                        {isSelected ? "Selected ✓" : "Sign Up"}
                      </Button>
                    </div>
                  </div>

                  {/* Show who's signed up for selected session */}
                  {isSelected && sessionSignups.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                        <Users className="w-3 h-3" /> Already signed up:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {sessionSignups.map(s => (
                          <span key={s.id} className="bg-[#1a3a8f]/10 text-[#1a3a8f] text-xs font-medium px-2.5 py-1 rounded-full">
                            {s.firstName}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sign-Up Form */}
      {showForm && selectedSession && (
        <div id="signup-form" className="max-w-xl mx-auto px-4 pb-16">
          <div className="bg-card border-2 border-[#1a3a8f]/20 rounded-2xl p-6 shadow-lg">
            <div className="mb-6">
              <h2 className="text-xl font-black mb-1">Sign Up for This Session</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{selectedSession.displayDate} · {selectedSession.displayTime}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="player-name" className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="player-name"
                  placeholder="Your full name"
                  value={playerName}
                  onChange={e => setPlayerName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="player-email" className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="player-email"
                  type="email"
                  placeholder="your@email.com"
                  value={playerEmail}
                  onChange={e => setPlayerEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="player-phone" className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> Phone <span className="text-muted-foreground text-xs">(optional — for session reminders)</span>
                </Label>
                <Input
                  id="player-phone"
                  type="tel"
                  placeholder="(401) 555-0100"
                  value={playerPhone}
                  onChange={e => setPlayerPhone(e.target.value)}
                />
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["card", "cash", "check"] as const).map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`py-2.5 px-3 rounded-lg border-2 text-sm font-semibold capitalize transition-all ${
                        paymentMethod === method
                          ? "border-[#1a3a8f] bg-[#1a3a8f] text-white"
                          : "border-border hover:border-[#1a3a8f]/40"
                      }`}
                    >
                      {method === "card" ? "💳 Card" : method === "cash" ? "💵 Cash" : "📝 Check"}
                    </button>
                  ))}
                </div>
                {paymentMethod !== "card" && (
                  <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                    Please bring exact cash/check ($15) to the session. Your spot is reserved but not confirmed until payment is received.
                  </p>
                )}
              </div>

              {/* Summary */}
              <div className="bg-muted/50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Session</span>
                  <span className="font-medium">{selectedSession.displayDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time</span>
                  <span className="font-medium">{selectedSession.displayTime}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 mt-2">
                  <span className="font-bold">Total</span>
                  <span className="font-black text-[#1a3a8f]">$15.00</span>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#1a3a8f] hover:bg-[#0f1f5c] text-white font-bold py-3 text-base"
                disabled={signUpMutation.isPending}
              >
                {signUpMutation.isPending
                  ? "Processing..."
                  : paymentMethod === "card"
                  ? "Proceed to Payment →"
                  : "Reserve My Spot →"}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Questions? Text Coach Mario at{" "}
                <a href="sms:4019655873" className="text-[#1a3a8f] font-semibold hover:underline">
                  (401) 965-5873
                </a>
              </p>
            </form>
          </div>
        </div>
      )}

      {/* FAQ / Info */}
      <div className="bg-muted/40 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-black mb-6 text-center">About the Doubles League</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { q: "Do I need a partner?", a: "No! Just sign up solo and Coach Mario will pair you with a compatible partner based on skill level and availability." },
              { q: "What skill level is required?", a: "All skill levels are welcome — beginner to advanced. Coach Mario ensures fair and fun matchups for everyone." },
              { q: "What should I bring?", a: "Just your racket and tennis shoes. Balls are provided. Arrive 5–10 minutes early to warm up." },
              { q: "What if it rains?", a: "Coach Mario will contact all signed-up players via text/email if a session is cancelled due to weather." },
            ].map(({ q, a }) => (
              <div key={q} className="bg-card rounded-xl p-4 border border-border">
                <h3 className="font-bold mb-2 text-sm">{q}</h3>
                <p className="text-sm text-muted-foreground">{a}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <p className="text-muted-foreground text-sm mb-3">Have more questions?</p>
            <a href="sms:4019655873">
              <Button variant="outline" className="gap-2">
                <Phone className="w-4 h-4" />
                Text Coach Mario: (401) 965-5873
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
