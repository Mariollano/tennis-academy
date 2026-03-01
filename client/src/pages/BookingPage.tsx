import { useState, useEffect } from "react";
import { useParams, Link, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Clock, CreditCard, ArrowLeft, CheckCircle, Loader2, Share2, Copy, Check, Users, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const PROGRAM_CONFIG: Record<string, {
  title: string;
  type: string;
  description: string;
  pricing: { label: string; value: string; cents: number }[];
  timeInfo?: string;
  note?: string;
}> = {
  private_lesson: {
    title: "Private Lesson",
    type: "private_lesson",
    description: "One-on-one session with Coach Mario — $120/hour.",
    pricing: [{ label: "$120 per hour", value: "per_hour", cents: 12000 }],
    timeInfo: "Flexible scheduling — contact Mario for available times.",
  },
  clinic_105: {
    title: "105 Game Adult Clinic",
    type: "clinic_105",
    description: "Signature adult group play session — 1.5 hours.",
    pricing: [{ label: "$30 per 1.5-hour session", value: "session", cents: 3000 }],
    timeInfo: "Runs Monday, Wednesday, Friday & Sunday — select an available session below.",
  },
  junior_daily: {
    title: "Junior Program — Daily",
    type: "junior_daily",
    description: "Single daily junior session (Fall/Spring).",
    pricing: [{ label: "$80 per session (4:30–6:30 PM)", value: "daily", cents: 8000 }],
    timeInfo: "4:30 PM – 6:30 PM",
  },
  junior_weekly: {
    title: "Junior Program — Weekly Package",
    type: "junior_weekly",
    description: "Full week junior program (5 sessions, Fall/Spring).",
    pricing: [{ label: "$350 per week (5 sessions)", value: "weekly", cents: 35000 }],
    timeInfo: "4:30 PM – 6:30 PM, Monday–Friday",
  },
  summer_camp_daily: {
    title: "Summer Camp — Daily",
    type: "summer_camp_daily",
    description: "Single day summer camp session.",
    pricing: [
      { label: "$100 per day (9 AM–2 PM)", value: "daily", cents: 10000 },
      { label: "+ $20 After Camp add-on (2:30–5 PM)", value: "after_camp", cents: 2000 },
    ],
    timeInfo: "9:00 AM – 2:00 PM (After Camp: 2:30–5 PM)",
  },
  summer_camp_weekly: {
    title: "Summer Camp — Weekly Package",
    type: "summer_camp_weekly",
    description: "Full week summer camp (all 5 days must be in the same week).",
    pricing: [
      { label: "$450 per week (Mon–Fri, same week)", value: "weekly", cents: 45000 },
      { label: "+ $20/day After Camp add-on (2:30–5 PM)", value: "after_camp_daily", cents: 2000 },
    ],
    timeInfo: "9:00 AM – 2:00 PM, Monday–Friday",
    note: "Weekly package requires all 5 days to be used within the same calendar week. Days cannot be split across different weeks.",
  },
  mental_coaching: {
    title: "Mental Coaching Session",
    type: "mental_coaching",
    description: "Dedicated mental performance coaching with Mario.",
    pricing: [{ label: "Per Session — contact for pricing", value: "session", cents: 0 }],
  },
}// ── Waitlist button for a single full slot ──────────────────────────────────────────────
function WaitlistButton({ slotId, programId, isAuthenticated }: { slotId: number; programId: number; isAuthenticated: boolean }) {
  const utils = trpc.useUtils();
  const { data: myStatus, isLoading: statusLoading } = trpc.waitlist.myStatus.useQuery(
    { scheduleSlotId: slotId },
    { enabled: isAuthenticated }
  );
  const { data: count } = trpc.waitlist.countForSlot.useQuery({ scheduleSlotId: slotId });
  const joinWaitlist = trpc.waitlist.join.useMutation({
    onSuccess: () => {
      toast.success("You're on the waitlist! Mario will notify you if a spot opens.");
      utils.waitlist.myStatus.invalidate({ scheduleSlotId: slotId });
      utils.waitlist.countForSlot.invalidate({ scheduleSlotId: slotId });
    },
    onError: (e) => toast.error(e.message || "Could not join waitlist."),
  });
  const leaveWaitlist = trpc.waitlist.leave.useMutation({
    onSuccess: () => {
      toast.success("You've been removed from the waitlist.");
      utils.waitlist.myStatus.invalidate({ scheduleSlotId: slotId });
      utils.waitlist.countForSlot.invalidate({ scheduleSlotId: slotId });
    },
    onError: (e) => toast.error(e.message || "Could not leave waitlist."),
  });

  if (!isAuthenticated) {
    return (
      <a href={getLoginUrl()} className="text-xs text-primary underline mt-1 block">Sign in to join waitlist</a>
    );
  }
  if (statusLoading) return <div className="text-xs text-muted-foreground mt-1">Checking waitlist…</div>;
  if (myStatus) {
    return (
      <div className="mt-2 flex items-center gap-2">
        <Badge className="bg-blue-100 text-blue-700 text-xs">On waitlist ({count || 1} waiting)</Badge>
        <button
          className="text-xs text-red-500 underline"
          onClick={(e) => { e.stopPropagation(); leaveWaitlist.mutate({ scheduleSlotId: slotId }); }}
          disabled={leaveWaitlist.isPending}
        >
          {leaveWaitlist.isPending ? "Leaving…" : "Leave"}
        </button>
      </div>
    );
  }
  return (
    <button
      className="mt-2 w-full text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg py-1.5 px-3 transition-colors"
      onClick={(e) => { e.stopPropagation(); joinWaitlist.mutate({ scheduleSlotId: slotId, programId }); }}
      disabled={joinWaitlist.isPending}
    >
      {joinWaitlist.isPending ? <><Loader2 className="w-3 h-3 animate-spin inline mr-1" />Joining…</> : `🔔 Join Waitlist${count ? ` (${count} waiting)` : ""}`}
    </button>
  );
}

// ── Availability Panel (for clinic_105 and private_lesson) ──────────────────────
function AvailabilityPanel({
  programType,
  onSelectSlot,
  selectedSlotId,
  programId,
  isAuthenticated,
}: {
  programType: string;
  onSelectSlot: (slotId: number, date: string) => void;
  selectedSlotId: number | null;
  programId: number;
  isAuthenticated: boolean;
}) {
  const isSupported = programType === "clinic_105" || programType === "private_lesson";
  const [fromDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [toDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 60);
    return d.toISOString().slice(0, 10);
  });

  const { data: slots, isLoading } = trpc.schedule.listAvailable.useQuery(    { programType: programType as "clinic_105" | "private_lesson", from: fromDate, to: toDate },
    { enabled: isSupported }
  );

  if (!isSupported) return null;

  function fmtDate(d: any) {
    return new Date(d).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  }
  function fmtTime(t: string | null | undefined) {
    if (!t) return "";
    const [h, m] = t.split(":");
    const hour = parseInt(h);
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
  }

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="w-4 h-4 text-primary" />
          Available Sessions
        </CardTitle>
        <p className="text-xs text-muted-foreground">Select a session to pre-fill your booking date. Spots update in real time.</p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading schedule…
          </div>
        ) : !slots || slots.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No sessions scheduled yet.</p>
            <p className="text-xs mt-1">Contact Coach Mario to arrange a time.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {slots.map(slot => {
              const isSelected = selectedSlotId === slot.id;
              const isFull = slot.isFull;
              return (
                <div key={slot.id}>
                  <button
                    disabled={isFull}
                    onClick={() => {
                      const rawDate = slot.slotDate as unknown;
                      const dateStr = typeof rawDate === "string" ? (rawDate as string).slice(0, 10) : new Date(rawDate as any).toISOString().slice(0, 10);
                      onSelectSlot(slot.id, dateStr);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      isFull
                        ? "cursor-not-allowed border-border bg-muted"
                        : isSelected
                        ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                        : "border-border bg-card hover:border-primary/50 hover:bg-primary/5"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="font-semibold text-sm text-foreground">
                          {fmtDate(slot.slotDate)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {fmtTime(slot.startTime)} – {fmtTime(slot.endTime)}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {isFull ? (
                          <Badge className="bg-red-100 text-red-700 text-xs">Full</Badge>
                        ) : (
                          <Badge className={`text-xs ${
                            slot.spotsLeft <= 2 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                          }`}>
                            {slot.spotsLeft} spot{slot.spotsLeft !== 1 ? "s" : ""} left
                          </Badge>
                        )}
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />}
                      </div>
                    </div>
                  </button>
                  {isFull && (
                    <WaitlistButton slotId={slot.id} programId={programId} isAuthenticated={isAuthenticated} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function BookingPage() {
  const params = useParams<{ programType: string }>();
  const programType = params.programType || "private_lesson";
  const config = PROGRAM_CONFIG[programType] || PROGRAM_CONFIG["private_lesson"];

  const { user, isAuthenticated } = useAuth();
  const [selectedPricing, setSelectedPricing] = useState(config.pricing[0].value);
  const [sessionDate, setSessionDate] = useState("");
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [afterCamp, setAfterCamp] = useState(false);
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const paymentStatus = searchParams.get("payment");

  // Show payment result if redirected back from Stripe
  useEffect(() => {
    if (paymentStatus === "success") {
      setSubmitted(true);
    } else if (paymentStatus === "cancelled") {
      toast.info("Payment was cancelled. Your booking was not confirmed.");
    }
  }, [paymentStatus]);

  const createCheckoutMutation = trpc.stripe.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        toast.success("Redirecting to secure payment...");
        window.open(data.url, "_blank");
      }
    },
    onError: (err) => toast.error(err.message || "Payment setup failed. Please try again."),
  });

  const createBookingMutation = trpc.booking.create.useMutation({
    onSuccess: (_, variables) => {
      // After booking is created, immediately launch Stripe checkout
      if (variables.totalAmountCents > 0) {
        createCheckoutMutation.mutate({
          bookingId: 0, // will be updated by webhook
          programName: config.title,
          amountCents: variables.totalAmountCents,
          origin: window.location.origin,
        });
      } else {
        // Free / contact-for-pricing: just show confirmation
        setSubmitted(true);
        toast.success("Booking request submitted! Mario will be in touch shortly.");
      }
    },
    onError: (err) => toast.error(err.message || "Booking failed. Please try again."),
  });

  const selectedPrice = config.pricing.find((p) => p.value === selectedPricing);
  const totalCents = (selectedPrice?.cents || 0) + (afterCamp ? 2000 : 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    createBookingMutation.mutate({
      programType: config.type,
      sessionDate: sessionDate || undefined,
      scheduleSlotId: selectedSlotId || undefined,
      pricingOption: selectedPricing,
      afterCampAddon: afterCamp,
      notes,
      totalAmountCents: totalCents,
    });
  };

  // Social sharing helpers
  const shareText = `🎾 Just booked a ${config.title} at RI Tennis Academy with Coach Mario Llano! Ready to elevate my game and master my mind. #RITennisAcademy #DeleteFear #Tennis`;
  const shareUrl = typeof window !== "undefined" ? window.location.origin : "https://ritennisacademy.com";
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${shareText}\n${shareUrl}`).then(() => {
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const shareLinks = [
    {
      name: "X / Twitter",
      color: "bg-black hover:bg-neutral-800",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.258 5.63 5.906-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "Facebook",
      color: "bg-[#1877F2] hover:bg-[#166FE5]",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
    },
    {
      name: "WhatsApp",
      color: "bg-[#25D366] hover:bg-[#20BD5C]",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      ),
      url: `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`,
    },
    {
      name: "Instagram",
      color: "bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] hover:opacity-90",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
      ),
      url: null, // Instagram doesn't support direct URL sharing; copy text instead
    },
  ];

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-lg w-full space-y-4">
          {/* Confirmation Card */}
          <Card className="text-center p-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Booking Confirmed!</h2>
            <p className="text-muted-foreground mb-6">
              {paymentStatus === "success"
                ? <>Payment received! Your <strong>{config.title}</strong> booking is confirmed. Mario will be in touch with session details.</>
                : <>Your <strong>{config.title}</strong> booking request has been submitted. Mario will be in touch shortly.</>
              }
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/programs">
                <Button variant="outline">View Programs</Button>
              </Link>
              <Link href="/profile">
                <Button className="bg-primary text-primary-foreground">My Bookings</Button>
              </Link>
            </div>
          </Card>

          {/* Social Sharing Card */}
          <Card className="border-2 border-accent/40">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Share2 className="w-4 h-4 text-accent" />
                Share Your Upcoming Lesson
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Let your friends know you're leveling up your game!
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Preview text */}
              <div className="bg-muted rounded-lg p-3 text-sm text-foreground leading-relaxed border border-border">
                {shareText}
              </div>

              {/* Share buttons */}
              <div className="grid grid-cols-2 gap-2">
                {shareLinks.map((platform) =>
                  platform.url ? (
                    <a
                      key={platform.name}
                      href={platform.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-center gap-2 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-all ${platform.color}`}
                    >
                      {platform.icon}
                      {platform.name}
                    </a>
                  ) : (
                    <button
                      key={platform.name}
                      onClick={() => {
                        handleCopyLink();
                        toast.info("Instagram doesn't support direct sharing — text copied! Paste it in your Instagram story or post.");
                      }}
                      className={`flex items-center justify-center gap-2 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-all ${platform.color}`}
                    >
                      {platform.icon}
                      {platform.name}
                    </button>
                  )
                )}
              </div>

              {/* Copy to clipboard */}
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center justify-center gap-2 border border-border rounded-lg py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy text to clipboard"}
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-primary text-primary-foreground py-12">
        <div className="container">
          <Link href="/programs">
            <Button variant="ghost" size="sm" className="text-primary-foreground/70 hover:text-primary-foreground mb-4">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Programs
            </Button>
          </Link>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2">{config.title}</h1>
          <p className="text-primary-foreground/80">{config.description}</p>
        </div>
      </section>

      <div className="container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Availability Panel for clinic + private lesson */}
          {(programType === "clinic_105" || programType === "private_lesson") && (
            <div className="lg:col-span-3 mb-2">
              <AvailabilityPanel
                programType={programType}
                selectedSlotId={selectedSlotId}
                programId={0}
                isAuthenticated={isAuthenticated}
                onSelectSlot={(slotId, date) => {
                  setSelectedSlotId(slotId);
                  setSessionDate(date);
                }}
              />
            </div>
          )}

          {/* Booking Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Booking Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!isAuthenticated ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">Please sign in to book a session.</p>
                    <Button
                      className="bg-primary text-primary-foreground"
                      onClick={() => (window.location.href = getLoginUrl())}
                    >
                      Sign In to Book
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Student Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Name</Label>
                        <Input value={user?.name || ""} disabled className="bg-muted" />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input value={user?.email || ""} disabled className="bg-muted" />
                      </div>
                    </div>

                    {/* Pricing Option */}
                    {config.pricing.length > 1 && (
                      <div>
                        <Label>Select Package</Label>
                        <Select value={selectedPricing} onValueChange={setSelectedPricing}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {config.pricing.map((p) => (
                              <SelectItem key={p.value} value={p.value}>
                                {p.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Date */}
                    <div>
                      <Label>Preferred Date</Label>
                      <Input
                        type="date"
                        value={sessionDate}
                        onChange={(e) => setSessionDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                      />
                    </div>

                    {/* After Camp Add-on */}
                    {(programType === "summer_camp_daily" || programType === "summer_camp_weekly") && (
                      <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <Checkbox
                          id="afterCamp"
                          checked={afterCamp}
                          onCheckedChange={(v) => setAfterCamp(!!v)}
                        />
                        <div>
                          <Label htmlFor="afterCamp" className="font-semibold cursor-pointer">
                            Add After Camp Program (+$20{programType === "summer_camp_weekly" ? "/day" : ""})
                          </Label>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            Extended afternoon supervision from 2:30 PM – 5:00 PM
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    <div>
                      <Label>Additional Notes (optional)</Label>
                      <Textarea
                        placeholder="Any special requests, skill level, or questions for Coach Mario..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                      />
                    </div>

                    {config.note && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                        <strong>Important:</strong> {config.note}
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold py-3 text-base"
                      disabled={createBookingMutation.isPending || createCheckoutMutation.isPending}
                    >
                      {createBookingMutation.isPending || createCheckoutMutation.isPending ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                      ) : totalCents > 0 ? (
                        <><CreditCard className="w-4 h-4 mr-2" /> Book & Pay ${(totalCents / 100).toFixed(0)}</>
                      ) : (
                        "Submit Booking Request"
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="font-semibold text-foreground">{config.title}</div>
                  {config.timeInfo && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                      <Clock className="w-3.5 h-3.5" />
                      {config.timeInfo}
                    </div>
                  )}
                </div>
                <div className="border-t border-border pt-3">
                  {config.pricing.map((p) => (
                    <div key={p.value} className="flex justify-between text-sm py-1">
                      <span className="text-muted-foreground">{p.label.split(" — ")[0]}</span>
                      <span className="font-medium">{p.cents > 0 ? `$${(p.cents / 100).toFixed(0)}` : "TBD"}</span>
                    </div>
                  ))}
                  {afterCamp && (
                    <div className="flex justify-between text-sm py-1">
                      <span className="text-muted-foreground">After Camp add-on</span>
                      <span className="font-medium">+$20</span>
                    </div>
                  )}
                  {totalCents > 0 && (
                    <div className="flex justify-between font-bold text-foreground pt-2 border-t border-border mt-2">
                      <span>Total</span>
                      <span className="text-primary">${(totalCents / 100).toFixed(0)}</span>
                    </div>
                  )}
                </div>
                <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 text-xs text-foreground">
                  <CreditCard className="w-3.5 h-3.5 inline mr-1 text-accent" />
                  <strong>Secure payment via Stripe.</strong> You'll be redirected to complete payment after submitting.
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary text-primary-foreground">
              <CardContent className="p-4 text-sm">
                <div className="font-semibold text-accent mb-1">Questions?</div>
                <p className="text-primary-foreground/80">
                  Use the chat button in the bottom-right corner to ask Coach Mario's AI assistant any questions about programs or scheduling.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
