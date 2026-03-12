import { useState, useEffect, useRef } from "react";
import { useParams, Link, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar as CalendarIcon, Clock, CreditCard, ArrowLeft, CheckCircle, Loader2, Share2, Copy, Check, Users, AlertCircle, CheckCircle2, Tag, X, ChevronLeft, ChevronRight, User, ArrowRight } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { StoryCard } from "@/components/StoryCard";
// ── Junior multi-day date picker (must be a proper component to use useState) ───
function JuniorDatePicker({
  selectedDates,
  onChange,
}: {
  selectedDates: string[];
  onChange: (dates: string[]) => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [calMonth, setCalMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const daysInMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0).getDate();
  const firstDow = new Date(calMonth.getFullYear(), calMonth.getMonth(), 1).getDay();

  const toggleDate = (iso: string) => {
    onChange(
      selectedDates.includes(iso)
        ? selectedDates.filter((d) => d !== iso)
        : selectedDates.length < 5
        ? [...selectedDates, iso]
        : selectedDates
    );
  };

  return (
    <div className="border border-border rounded-xl p-3 bg-card">
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1))} className="p-1 rounded hover:bg-muted">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold">{calMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
        <button type="button" onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1))} className="p-1 rounded hover:bg-muted">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: firstDow }).map((_, i) => <div key={`pad-${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const date = new Date(calMonth.getFullYear(), calMonth.getMonth(), day);
          const iso = `${calMonth.getFullYear()}-${String(calMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isPast = date < today;
          const isSelected = selectedDates.includes(iso);
          return (
            <button
              key={iso}
              type="button"
              disabled={isPast}
              onClick={() => toggleDate(iso)}
              className={`aspect-square rounded-lg text-xs font-semibold transition-all ${
                isPast
                  ? "text-muted-foreground/30 cursor-not-allowed"
                  : isSelected
                  ? "bg-green-500 text-white shadow-sm"
                  : "hover:bg-primary/10 text-foreground"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

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
    pricing: [{ label: "$35 per 1.5-hour session", value: "session", cents: 3500 }],
    timeInfo: "Runs Monday, Wednesday, Friday & Sunday — select an available session below.",
  },
  junior_daily: {
    title: "Junior Program — Daily",
    type: "junior_daily",
    description: "Single daily junior session (Fall/Spring).",
    pricing: [{ label: "$80 per session (3:30–6:30 PM)", value: "daily", cents: 8000 }],
    timeInfo: "3:30 PM – 6:30 PM",
  },
  junior_weekly: {
    title: "Junior Program — Weekly Package",
    type: "junior_weekly",
    description: "Full week junior program (5 sessions, Fall/Spring).",
    pricing: [{ label: "$350 per week (5 sessions)", value: "weekly", cents: 35000 }],
    timeInfo: "3:30 PM – 6:30 PM, Monday–Friday",
  },
  summer_camp_daily: {
    title: "Summer Camp — Daily",
    type: "summer_camp_daily",
    description: "Single day summer camp session.",
    pricing: [
      { label: "$90 per day (9 AM–2 PM)", value: "daily", cents: 9000 },
      { label: "+ $20 After Camp add-on (2:30–5 PM)", value: "after_camp", cents: 2000 },
    ],
    timeInfo: "9:00 AM – 2:00 PM (After Camp: 2:30–5 PM)",
  },
  summer_camp_weekly: {
    title: "Summer Camp — Weekly Package",
    type: "summer_camp_weekly",
    description: "Full week summer camp (all 5 days must be in the same week).",
    pricing: [
      { label: "$420 per week (Mon–Fri, same week)", value: "weekly", cents: 42000 },
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
// Outer guard: renders nothing for unsupported program types WITHOUT calling any hooks
function AvailabilityPanel(props: {
  programType: string;
  onSelectSlot: (slotId: number, date: string, times?: { startTime: string; endTime: string }) => void;
  selectedSlotId: number | null;
  programId: number;
  isAuthenticated: boolean;
  initialDate?: string; // YYYY-MM-DD from voice booking
}) {
  if (props.programType !== "clinic_105" && props.programType !== "private_lesson") return null;
  return <AvailabilityPanelInner {...props} />;
}

function AvailabilityPanelInner({
  programType,
  onSelectSlot,
  selectedSlotId,
  programId,
  isAuthenticated,
  initialDate,
}: {
  programType: string;
  onSelectSlot: (slotId: number, date: string, times?: { startTime: string; endTime: string }) => void;
  selectedSlotId: number | null;
  programId: number;
  isAuthenticated: boolean;
  initialDate?: string;
}) {
  // Use local date strings to avoid UTC offset issues
  const [fromDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  });
  const [toDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  });
  // Pre-select the date from voice booking if provided
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(() => {
    if (!initialDate) return undefined;
    const [y, m, d] = initialDate.split("-").map(Number);
    return new Date(y, m - 1, d);
  });
  const timeSlotsRef = useRef<HTMLDivElement>(null);
  const didAutoSelect = useRef(false);

  // Auto-trigger onSelectSlot for private lesson when initialDate is provided
  useEffect(() => {
    if (initialDate && programType === "private_lesson" && !didAutoSelect.current) {
      didAutoSelect.current = true;
      onSelectSlot(0, initialDate);
    }
  }, [initialDate, programType, onSelectSlot]);

  const { data: slots, isLoading } = trpc.schedule.listAvailable.useQuery(
    { programType: programType as "clinic_105" | "private_lesson", from: fromDate, to: toDate },
    { enabled: true }
  );

  const isSupported = true; // guard above ensures this is always true here

  // Private lessons are flexible — no fixed slots, just let the user pick any future date
  if (programType === "private_lesson") {
    return (
      <Card className="border-2 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarIcon className="w-4 h-4 text-primary" />
            Pick a Preferred Date
          </CardTitle>
          <p className="text-xs text-muted-foreground">Private lessons are scheduled directly with Coach Mario. Choose your preferred date below and he'll confirm availability.</p>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDay}
              onSelect={(day) => {
                setSelectedDay(day);
                if (day) {
                  const dateStr = `${day.getFullYear()}-${String(day.getMonth()+1).padStart(2,'0')}-${String(day.getDate()).padStart(2,'0')}`;
                  onSelectSlot(0, dateStr); // 0 = no fixed slot (private lesson)
                }
              }}
              disabled={(date) => {
                const today = new Date();
                today.setHours(0,0,0,0);
                return date < today;
              }}
              className="w-full"
            />
          </div>
          {selectedDay && (
            <p className="text-center text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg py-2 px-3 mt-2">
              ✓ Preferred date set to {selectedDay.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}. Mario will confirm your time.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  function fmtTime(t: string | null | undefined) {
    if (!t) return "";
    const [h, m] = t.split(":");
    const hour = parseInt(h);
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
  }

  // Build a set of date strings that have available slots (for calendar dot indicators)
  const availableDates = new Set<string>();
  const fullDates = new Set<string>();
  // Normalize a slot date to local YYYY-MM-DD string (avoids UTC offset issues)
  function toLocalDateStr(raw: unknown): string {
    if (typeof raw === "string") return (raw as string).slice(0, 10);
    const d = new Date(raw as any);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  (slots || []).forEach(slot => {
    const dateStr = toLocalDateStr(slot.slotDate);
    if (slot.isFull) fullDates.add(dateStr);
    else availableDates.add(dateStr);
  });

  // Slots for the selected day — use local date string for comparison
  const selectedDayStr = selectedDay
    ? `${selectedDay.getFullYear()}-${String(selectedDay.getMonth()+1).padStart(2,'0')}-${String(selectedDay.getDate()).padStart(2,'0')}`
    : null;
  const daySlots = (slots || []).filter(slot => toLocalDateStr(slot.slotDate) === selectedDayStr);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarIcon className="w-4 h-4 text-primary" />
          Pick a Date &amp; Time
        </CardTitle>
        <p className="text-xs text-muted-foreground">Tap a highlighted date on the left to see available times on the right.</p>
      </CardHeader>
      <CardContent className="p-3 pt-0">
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
          <div className="flex flex-col md:flex-row gap-6">
            {/* LEFT: Calendar */}
            <div className="flex-shrink-0">
              <Calendar
                mode="single"
                selected={selectedDay}
                onSelect={(day) => setSelectedDay(day)}
                disabled={(date) => {
                  const ds = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
                  return date < today || (!availableDates.has(ds) && !fullDates.has(ds));
                }}
                modifiers={{
                  available: (date) => {
                    const ds = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
                    return availableDates.has(ds);
                  },
                  full: (date) => {
                    const ds = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
                    return fullDates.has(ds);
                  },
                }}
                modifiersClassNames={{
                  available: "!font-bold after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-green-500",
                  full: "!font-bold after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-red-400 opacity-60",
                }}
              />
              {/* Legend */}
              <div className="flex items-center gap-4 justify-center mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Available</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Full</span>
              </div>
            </div>

            {/* RIGHT: Time slots */}
            <div className="flex-1 min-w-0">
              {!selectedDay ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center text-muted-foreground gap-2">
                  <CalendarIcon className="w-10 h-10 opacity-20" />
                  <p className="text-sm font-medium">Select a date</p>
                  <p className="text-xs">Tap any highlighted date on the calendar to see available times.</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-bold mb-3 text-foreground">
                    {selectedDay.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                  </p>
                  {daySlots.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-3">No sessions on this day.</p>
                  ) : (
                    <div className="space-y-2">
                      {daySlots.map(slot => {
                        const isSelected = selectedSlotId === slot.id;
                        const isFull = slot.isFull;
                        return (
                          <div key={slot.id}>
                            <button
                              disabled={isFull}
                              onClick={() => onSelectSlot(slot.id, toLocalDateStr(slot.slotDate), slot.startTime && slot.endTime ? { startTime: slot.startTime, endTime: slot.endTime } : undefined)}
                              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                                isFull
                                  ? "cursor-not-allowed border-border bg-muted opacity-60"
                                  : isSelected
                                  ? "border-primary bg-primary/10 ring-2 ring-primary/30 shadow-md"
                                  : "border-border bg-card hover:border-primary hover:bg-primary/5 hover:shadow-sm cursor-pointer"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-5 h-5 text-primary shrink-0" />
                                  <span className="font-bold text-base">
                                    {fmtTime(slot.startTime)} – {fmtTime(slot.endTime)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  {isFull ? (
                                    <Badge className="bg-red-100 text-red-700">Full</Badge>
                                  ) : slot.spotsLeft <= 2 ? (
                                    <Badge className="bg-red-50 text-red-700 border border-red-200 animate-pulse font-bold">
                                      🔥 Only {slot.spotsLeft} left!
                                    </Badge>
                                  ) : slot.spotsLeft <= 4 ? (
                                    <Badge className="bg-amber-100 text-amber-700">
                                      ⚡ {slot.spotsLeft} spots left
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-green-100 text-green-700">
                                      {slot.spotsLeft} spots open
                                    </Badge>
                                  )}
                                  {isSelected && <CheckCircle2 className="w-5 h-5 text-primary" />}
                                </div>
                              </div>
                              {isSelected && (
                                <p className="text-xs text-primary font-semibold mt-1">✓ Selected — scroll down to complete booking</p>
                              )}
                            </button>
                            {isFull && (
                              <WaitlistButton slotId={slot.id} programId={programId} isAuthenticated={isAuthenticated} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Newsletter opt-in widget shown on booking confirmation
function NewsletterOptIn({ userId }: { userId: number }) {
  const [optedIn, setOptedIn] = useState(false);
  const [done, setDone] = useState(false);
  const updateProfile = trpc.user.updateProfile.useMutation();

  if (done) {
    return (
      <div className="flex items-center justify-center gap-2 text-sm text-green-600 font-medium mb-4">
        <CheckCircle className="w-4 h-4" />
        You're subscribed to the RI Tennis Academy newsletter!
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 bg-accent/10 border border-accent/30 rounded-xl p-3 mb-4 text-left">
      <Checkbox
        id="newsletter-optin"
        checked={optedIn}
        onCheckedChange={async (checked) => {
          setOptedIn(!!checked);
          if (checked) {
            try {
              await updateProfile.mutateAsync({ newsletterOptIn: true });
              setDone(true);
              toast.success("Subscribed to the newsletter!");
            } catch {
              setOptedIn(false);
            }
          }
        }}
        className="mt-0.5"
      />
      <label htmlFor="newsletter-optin" className="text-sm cursor-pointer">
        <span className="font-semibold text-foreground">Subscribe to our newsletter</span>
        <span className="text-muted-foreground"> — get weekly tennis tips, Coach Mario's insights, and exclusive offers.</span>
      </label>
    </div>
  );
}

export default function BookingPage() {
  const params = useParams<{ programType: string }>();
  const programType = params.programType || "private_lesson";
  const config = PROGRAM_CONFIG[programType] || PROGRAM_CONFIG["private_lesson"];

  const { user, isAuthenticated } = useAuth();

  // Read voice-booking pre-fill params from URL (date=YYYY-MM-DD, time=HH:MM)
  const searchStringInit = useSearch();
  const searchParamsInit = new URLSearchParams(searchStringInit);
  const urlDate = searchParamsInit.get("date") || "";
  // Normalize urlTime to zero-padded HH:MM so it matches time picker button values ("09:00" not "9:00")
  const rawUrlTime = searchParamsInit.get("time") || "";
  const urlTime = rawUrlTime ? (() => {
    const parts = rawUrlTime.split(":");
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1] || "0", 10);
    if (isNaN(h)) return rawUrlTime;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  })() : "";

  const [selectedPricing, setSelectedPricing] = useState(config.pricing[0].value);
  const [sessionDate, setSessionDate] = useState(urlDate);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [selectedSlotTimes, setSelectedSlotTimes] = useState<{ startTime: string; endTime: string } | null>(null);
  const [afterCamp, setAfterCamp] = useState(false);
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showStoryCard, setShowStoryCard] = useState(false);
  const { data: referralInfo } = trpc.user.getReferralInfo.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const [promoCode, setPromoCode] = useState("");
  const [promoInput, setPromoInput] = useState("");
  const [promoResult, setPromoResult] = useState<{
    valid: boolean;
    message?: string;
    discountDescription?: string;
    discountedAmountCents?: number;
    isFree?: boolean;
  } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [timePreference, setTimePreference] = useState(urlTime);
  // Sync timePreference and sessionDate when URL params change (e.g. voice booking redirect)
  useEffect(() => {
    if (urlTime && urlTime !== timePreference) {
      setTimePreference(urlTime);
    }
    if (urlDate && urlDate !== sessionDate) {
      setSessionDate(urlDate);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlTime, urlDate]);
  const [juniorDays, setJuniorDays] = useState(1);
  const [juniorSelectedDates, setJuniorSelectedDates] = useState<string[]>([]);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash" | "check">("card");

  // Fetch booked + blocked hours for the selected date (private lesson only)
  const { data: unavailableHours } = trpc.schedule.getUnavailableHours.useQuery(
    { date: sessionDate },
    { enabled: programType === "private_lesson" && sessionDate.length === 10 }
  );
  const bookedHours = new Set(unavailableHours?.bookedHours ?? []);
  const blockedHours = new Set(unavailableHours?.blockedHours ?? []);
  const allDayBlocked = unavailableHours?.allDayBlocked ?? false;

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

  const markPromoUsed = trpc.promoCodes.markUsed.useMutation();

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
    onSuccess: (data, variables) => {
      const isCashOrCheck = data.paymentMethod === "cash" || data.paymentMethod === "check";
      // Cash/check: spot is reserved immediately, no Stripe needed
      if (isCashOrCheck) {
        setSubmitted(true);
        const payLabel = data.paymentMethod === "check" ? "check" : "cash";
        toast.success(`Your spot is reserved! Please bring ${payLabel} to the lesson.`);
        return;
      }
      // After booking is created, immediately launch Stripe checkout
      if (variables.totalAmountCents > 0) {
        createCheckoutMutation.mutate({
          bookingId: data.bookingId,  // ✅ FIX: use the actual booking ID so the webhook can confirm it
          programName: config.title,
          amountCents: variables.totalAmountCents,
          origin: window.location.origin,
          successPath: `/book/${programType}`, // ✅ FIX: redirect back to booking page so confirmation screen shows
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
  const baseCents = selectedPrice?.cents || 0;
  const effectiveJuniorDays = programType === "junior_daily" && juniorSelectedDates.length > 0 ? juniorSelectedDates.length : juniorDays;
  const totalCents = (programType === "junior_daily" ? baseCents * effectiveJuniorDays : baseCents) + (afterCamp ? 2000 : 0);

  // Promo code validation query - placed after totalCents is declared
  const validatePromoQuery = trpc.promoCodes.validate.useQuery(
    { code: promoCode, programType: config.type, originalAmountCents: totalCents },
    { enabled: promoCode.length > 0 && totalCents > 0 }
  );

  // Sync promo result when query data changes
  const promoData = validatePromoQuery.data;

  const finalAmountCents = promoData?.valid && promoData.discountedAmountCents !== undefined
    ? promoData.discountedAmountCents
    : totalCents;

  const applyPromoCode = () => {
    if (!promoInput.trim()) return;
    setPromoCode(promoInput.trim().toUpperCase());
  };

  const clearPromoCode = () => {
    setPromoCode("");
    setPromoInput("");
    setPromoResult(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      if (!guestName.trim() || !guestEmail.trim()) {
        toast.error("Please enter your name and email to book.");
        return;
      }
    }
    // Require date for clinic and private lesson
    if ((programType === "clinic_105" || programType === "private_lesson") && !sessionDate) {
      toast.error("Please pick a date from the calendar above before booking.");
      return;
    }
    // Require a time slot for clinic_105
    if (programType === "clinic_105" && (!selectedSlotId || selectedSlotId <= 0)) {
      toast.error("Please select a time slot from the calendar above.");
      return;
    }
    // Require a preferred time for private lessons
    if (programType === "private_lesson" && !timePreference) {
      toast.error("Please select your preferred lesson time from the time picker above.");
      return;
    }
    const chargeAmount = finalAmountCents;

    const fullNotes = timePreference && programType === "private_lesson"
      ? `[Preferred time: ${timePreference}]${notes ? " " + notes : ""}`
      : notes;

    // For private lessons, store the preferred start time so it shows as "Booked" for future students
    // For clinic_105, use the selected slot's actual start/end time so it appears in the confirmation email
    // For all other types (including voice-booking redirects), use timePreference if available
    const sessionStartTime = programType === "clinic_105" && selectedSlotTimes
      ? selectedSlotTimes.startTime
      : timePreference ? (timePreference.includes(":") ? timePreference + ":00" : timePreference + ":00:00") : undefined;
    const sessionEndTime = programType === "clinic_105" && selectedSlotTimes
      ? selectedSlotTimes.endTime
      : timePreference ? (() => {
          const parts = timePreference.split(":");
          const h = parseInt(parts[0]);
          const m = parseInt(parts[1] || "0");
          const endH = (h + 1) % 24;
          return `${String(endH).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
        })() : undefined;
    const guestFields = !isAuthenticated ? {
      guestName: guestName.trim(),
      guestEmail: guestEmail.trim(),
      guestPhone: guestPhone.trim() || undefined,
    } : {};

    if (programType === "junior_daily" && juniorSelectedDates.length > 0) {
      // Create one booking per selected date; charge the full total on the first one
      juniorSelectedDates.forEach((date, idx) => {
        createBookingMutation.mutate({
          programType: config.type,
          sessionDate: date,
          pricingOption: selectedPricing,
          notes: fullNotes,
          totalAmountCents: idx === 0 ? chargeAmount : 0,
          paymentMethod,
          ...guestFields,
        });
      });
    } else {
      createBookingMutation.mutate({
        programType: config.type,
        sessionDate: sessionDate || undefined,
        scheduleSlotId: selectedSlotId || undefined,
        sessionStartTime,
        sessionEndTime,
        pricingOption: selectedPricing,
        afterCampAddon: afterCamp,
        notes: fullNotes,
        totalAmountCents: chargeAmount,
        paymentMethod,
        ...guestFields,
      });
    }

    // If free via promo, mark it used
    if (promoData?.isFree && promoCode) {
      markPromoUsed.mutate({ code: promoCode });
    }
  };

  // Social sharing helpers
  const shareText = `🎾 Just booked a ${config.title} at RI Tennis Academy with Coach Mario Llano! Ready to elevate my game and master my mind. #RITennisAcademy #DeleteFear #Tennis`;
  const shareUrl = "https://tennispromario.com";
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
    // SMS share hidden until Twilio is fully configured
    // { name: "Text a Friend", url: `sms:?body=...` },
  ];

  if (submitted) {
    return (
      <>
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-lg w-full space-y-4">
          {/* Confirmation Card */}
          <Card className="text-center overflow-hidden">
            {/* Top accent bar */}
            <div className="h-2 bg-gradient-to-r from-accent via-green-400 to-accent" />
            <div className="p-8">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5 relative">
                <CheckCircle className="w-10 h-10 text-green-500" />
                <div className="absolute inset-0 rounded-full border-4 border-green-200 animate-ping opacity-30" />
              </div>
              <h2 className="text-3xl font-extrabold text-foreground mb-2" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                {paymentStatus === "success" ? "YOU'RE BOOKED!" : (paymentMethod === "cash" || paymentMethod === "check") ? "SPOT RESERVED!" : "REQUEST SENT!"}
              </h2>
              <p className="text-muted-foreground mb-2 text-sm">
                {paymentStatus === "success"
                  ? <>Payment received! Your <strong className="text-foreground">{config.title}</strong> is confirmed. Check your email for details.</>
                  : (paymentMethod === "cash" || paymentMethod === "check")
                  ? <>Your spot for <strong className="text-foreground">{config.title}</strong> is reserved! Please bring <strong>{paymentMethod === "check" ? "a check" : "cash"}</strong> to the lesson. A confirmation email has been sent.</>
                  : <>Your <strong className="text-foreground">{config.title}</strong> request is submitted. Mario will confirm shortly.</>
                }
              </p>
              {(paymentMethod === "cash" || paymentMethod === "check") && (
                <div className="mb-4 inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-full text-xs text-amber-800 font-semibold">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  Payment due at lesson: {paymentMethod === "check" ? "Check payable to RI Tennis Academy" : "Cash"}
                </div>
              )}
              <p className="text-xs text-muted-foreground/70 mb-6">A confirmation email has been sent to your inbox.</p>

              {/* Newsletter opt-in */}
              {user && <NewsletterOptIn userId={user.id} />
              }

              <div className="flex gap-3 justify-center mt-4">
                <Link href="/programs">
                  <Button variant="outline" className="rounded-full">Browse Programs</Button>
                </Link>
                <Link href="/profile">
                  <Button className="bg-primary text-primary-foreground rounded-full">My Bookings</Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* Refer a Friend Card */}
          <Card className="border-2 border-green-400/50 bg-gradient-to-br from-green-50/50 to-emerald-50/30 dark:from-green-950/30 dark:to-emerald-950/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="w-4 h-4 text-green-500" />
                Refer a Friend — Both Save!
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Share your unique referral link. When a friend books their first session, you both get a discount on your next one.
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 bg-background rounded-lg border border-border p-3">
                <span className="text-sm text-muted-foreground flex-1 truncate font-mono text-xs">
                  {referralInfo?.referralLink ?? `https://tennispromario.com?ref=...`}
                </span>
                <button
                  onClick={() => {
                    const link = referralInfo?.referralLink ?? `https://tennispromario.com?ref=${user?.id ?? ''}`;
                    navigator.clipboard.writeText(link);
                    toast.success('Referral link copied! Share it with friends.');
                  }}
                  className="shrink-0 flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-md transition-colors"
                >
                  <Copy className="w-3 h-3" /> Copy Link
                </button>
              </div>
              {referralInfo && (
                <div className="flex items-center justify-between mt-2 px-1">
                  <p className="text-xs text-muted-foreground">
                    Your code: <span className="font-mono font-bold text-green-600">{referralInfo.referralCode}</span>
                  </p>
                  {referralInfo.rewardedReferrals > 0 && (
                    <p className="text-xs text-green-600 font-semibold">
                      🎉 {referralInfo.rewardedReferrals} reward{referralInfo.rewardedReferrals !== 1 ? 's' : ''} earned!
                    </p>
                  )}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1 text-center">
                When a friend books their first session, you automatically get a <strong>20% discount code</strong> by email &amp; SMS.
              </p>
            </CardContent>
          </Card>

          {/* Share to Stories Card */}
          <Card className="border-2 border-purple-400/40 bg-gradient-to-br from-purple-50/30 to-pink-50/20 dark:from-purple-950/20 dark:to-pink-950/10">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-foreground text-sm mb-1">Share to Instagram & Facebook Stories 📸</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Generate a custom story card with your booking details. Tag Coach Mario and inspire your followers!
                  </p>
                  <button
                    onClick={() => setShowStoryCard(true)}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] text-white text-sm font-semibold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity"
                  >
                    <Share2 className="w-4 h-4" />
                    Create My Story Card
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Social Sharing Card */}
          <Card className="border-2 border-accent/40">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Share2 className="w-4 h-4 text-accent" />
                Tell Your Friends You're Training! 🎾
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                You just took a step toward elevating your game. Share it — inspire someone else to do the same!
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
          {/* Google Review Card */}
          <Card className="border-2 border-yellow-400/40 bg-yellow-50/30 dark:bg-yellow-900/10">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#FBBF24" stroke="#F59E0B" strokeWidth="1.5" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-foreground text-sm mb-1">Leave a Google Review ⭐</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Loved your experience? A 5-star Google review helps Coach Mario reach more students in Rhode Island.
                  </p>
                  <a
                    href="https://search.google.com/local/writereview?placeid=ChIJu-YB0d7NyokRREI0Nqjfgj0"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-white dark:bg-card border border-yellow-400 text-foreground text-sm font-semibold py-2 px-4 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors shadow-sm"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Write a Google Review
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Story Card Modal */}
      {showStoryCard && (
        <StoryCard
          programName={config.title}
          sessionDate={sessionDate || undefined}
          timePreference={timePreference || undefined}
          userName={user?.name || undefined}
          onClose={() => setShowStoryCard(false)}
        />
      )}
      </>
    );
  }
  // Determine booking step for the wizard indicatorr
  const bookingStep = !isAuthenticated ? 0 :
    ((programType === 'clinic_105' || programType === 'private_lesson') && !sessionDate) ? 1 :
    (programType === 'clinic_105' && (!selectedSlotId || selectedSlotId <= 0)) ? 1 :
    (programType === 'junior_daily' && juniorSelectedDates.length === 0) ? 1 :
    2;

  const steps = [
    { label: "Sign In", icon: User },
    { label: "Pick Date", icon: CalendarIcon },
    { label: "Confirm & Pay", icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-primary text-primary-foreground pt-8 pb-0">
        <div className="container">
          <Link href="/programs">
            <Button variant="ghost" size="sm" className="text-primary-foreground/70 hover:text-primary-foreground mb-4 -ml-2">
              <ArrowLeft className="w-4 h-4 mr-1" /> All Programs
            </Button>
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold mb-1" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{config.title}</h1>
              <p className="text-primary-foreground/70 text-sm">{config.description}</p>
            </div>
            {config.pricing[0].cents > 0 && (
              <div className="shrink-0 text-right">
                <div className="text-accent font-extrabold text-3xl" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                  ${(config.pricing[0].cents / 100).toFixed(0)}
                </div>
                <div className="text-primary-foreground/50 text-xs">{config.pricing[0].label.split(" — ")[0]}</div>
              </div>
            )}
          </div>

          {/* Step Indicator */}
          <div className="flex items-center gap-0 border-t border-white/10">
            {steps.map((step, i) => {
              const Icon = step.icon;
              const isCompleted = i < bookingStep;
              const isCurrent = i === bookingStep;
              return (
                <div key={step.label} className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all border-b-2 ${
                  isCompleted ? 'border-accent/60 text-primary-foreground/60' :
                  isCurrent ? 'border-accent text-accent' :
                  'border-transparent text-primary-foreground/30'
                }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isCompleted ? 'bg-accent/20 text-accent' :
                    isCurrent ? 'bg-accent text-accent-foreground' :
                    'bg-white/10 text-primary-foreground/30'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className="w-3 h-3" />}
                  </div>
                  <span className="hidden sm:inline">{step.label}</span>
                </div>
              );
            })}
          </div>
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
                initialDate={urlDate || undefined}
                onSelectSlot={(slotId, date, times) => {
                  setSelectedSlotId(slotId);
                  setSessionDate(date);
                  if (times) setSelectedSlotTimes(times);
                }}
              />
            </div>
          )}

          {/* Booking Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-primary" />
                  Booking Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Voice booking pre-fill banner */}
                    {urlDate && (
                      <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                        <span className="text-2xl">🎙️</span>
                        <div>
                          <p className="text-sm font-semibold text-green-800">Date pre-filled from your voice request</p>
                          <p className="text-xs text-green-700">
                            {new Date(urlDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                            {urlTime ? ` at ${(() => { const h = parseInt(urlTime.split(":")[0]); const m = urlTime.split(":")[1] || "00"; const ampm = h < 12 ? "AM" : "PM"; const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h; return `${h12}:${m} ${ampm}`; })()}` : ""}
                          </p>
                        </div>
                      </div>
                    )}
                    {/* Student Info */}
                    {!isAuthenticated && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700 mb-1">
                        <strong>No account needed!</strong> Just enter your name and email below to book.
                        <a href={getLoginUrl()} className="ml-2 underline font-semibold">Sign in</a> if you have an account.
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Name {!isAuthenticated && <span className="text-red-500">*</span>}</Label>
                        <Input
                          value={isAuthenticated ? (user?.name || "") : guestName}
                          onChange={!isAuthenticated ? (e) => setGuestName(e.target.value) : undefined}
                          disabled={isAuthenticated}
                          className={isAuthenticated ? "bg-muted" : ""}
                          placeholder={!isAuthenticated ? "Your full name" : ""}
                          required={!isAuthenticated}
                        />
                      </div>
                      <div>
                        <Label>Email {!isAuthenticated && <span className="text-red-500">*</span>}</Label>
                        <Input
                          value={isAuthenticated ? (user?.email || "") : guestEmail}
                          onChange={!isAuthenticated ? (e) => setGuestEmail(e.target.value) : undefined}
                          disabled={isAuthenticated}
                          className={isAuthenticated ? "bg-muted" : ""}
                          placeholder={!isAuthenticated ? "your@email.com" : ""}
                          type="email"
                          required={!isAuthenticated}
                        />
                      </div>
                    </div>
                    {!isAuthenticated && (
                      <div>
                        <Label>Phone (optional — for SMS reminders)</Label>
                        <Input
                          value={guestPhone}
                          onChange={(e) => setGuestPhone(e.target.value)}
                          placeholder="+1 (401) 555-0000"
                          type="tel"
                        />
                      </div>
                    )}

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

                    {/* Date — hidden for clinic/private/junior_daily (calendar above handles it) */}
                    {(programType !== "clinic_105" && programType !== "private_lesson" && programType !== "junior_daily") && (
                      <div>
                        <Label>Preferred Date</Label>
                        <Input
                          type="date"
                          value={sessionDate}
                          onChange={(e) => setSessionDate(e.target.value)}
                          min={new Date().toISOString().split("T")[0]}
                        />
                      </div>
                    )}
                    {(programType === "clinic_105" || programType === "private_lesson") && sessionDate && (
                      <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                        <CalendarIcon className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-sm font-medium text-foreground">
                          {new Date(sessionDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                        </span>
                        {selectedSlotId !== null && selectedSlotId > 0 && (
                          <span className="ml-auto text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full font-semibold">Slot selected ✓</span>
                        )}
                      </div>
                    )}
                    {(programType === "clinic_105" || programType === "private_lesson") && !sessionDate && (
                      <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <CalendarIcon className="w-4 h-4 text-amber-500 shrink-0" />
                        <span className="text-sm text-amber-700">Please pick a date from the calendar above.</span>
                      </div>
                    )}

                    {/* Time Preference — private lesson only */}
                    {programType === "private_lesson" && sessionDate && (
                      <div>
                        <Label className="text-sm font-semibold">Preferred Start Time</Label>
                        {allDayBlocked ? (
                          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                            This date is fully blocked by Coach Mario. Please pick a different date.
                          </div>
                        ) : (
                          <>
                            <p className="text-xs text-muted-foreground mb-2">Select your preferred lesson start time. Grayed-out slots are already booked or unavailable.</p>
                            <div className="grid grid-cols-4 gap-2 mt-1">
                              {Array.from({ length: 14 }, (_, i) => {
                                const hour24 = i + 6; // 6 AM to 7 PM
                                const ampm = hour24 < 12 ? "AM" : "PM";
                                const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
                                const label = `${hour12}:00 ${ampm}`;
                                const value = `${String(hour24).padStart(2, "0")}:00`;
                                const isSelected = timePreference === value;
                                const isBooked = bookedHours.has(hour24);
                                const isBlocked = blockedHours.has(hour24);
                                const isUnavailable = isBooked || isBlocked;
                                return (
                                  <button
                                    key={value}
                                    type="button"
                                    disabled={isUnavailable}
                                    onClick={() => !isUnavailable && setTimePreference(value)}
                                    title={isBooked ? "Already booked" : isBlocked ? "Unavailable" : label}
                                    className={`py-2 px-1 rounded-lg border-2 text-center text-xs font-medium transition-all relative ${
                                      isUnavailable
                                        ? "border-muted bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                                        : isSelected
                                          ? "border-primary bg-primary text-primary-foreground shadow-md"
                                          : "border-border bg-card hover:border-primary/60 hover:bg-primary/5 text-foreground"
                                    }`}
                                  >
                                    <span className="block">{label}</span>
                                    {isBooked && <span className="block text-[10px] leading-tight text-red-500 font-semibold">Booked</span>}
                                    {isBlocked && !isBooked && <span className="block text-[10px] leading-tight text-orange-500 font-semibold">Blocked</span>}
                                  </button>
                                );
                              })}
                            </div>
                            {timePreference && (
                              <p className="text-xs text-green-700 mt-2">✓ Preferred start time: {(() => { const h = parseInt(timePreference); const ampm = h < 12 ? "AM" : "PM"; const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h; return `${h12}:00 ${ampm}`; })()}</p>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {/* Junior Multi-Day Date Picker */}
                    {programType === "junior_daily" && (
                      <div>
                        <Label className="text-sm font-semibold">Select Your Days</Label>
                        <p className="text-xs text-muted-foreground mb-3">Tap each day you want to attend ($80 per day). You can pick up to 5 days.</p>
                        <JuniorDatePicker
                          selectedDates={juniorSelectedDates}
                          onChange={setJuniorSelectedDates}
                        />
                        {juniorSelectedDates.length > 0 && (
                          <div className="mt-3 space-y-1.5">
                            <p className="text-xs font-semibold text-foreground">Selected days:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {[...juniorSelectedDates].sort().map((d) => (
                                <span key={d} className="flex items-center gap-1 bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full">
                                  {new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                                  <button type="button" onClick={() => setJuniorSelectedDates((p) => p.filter((x) => x !== d))} className="ml-0.5 hover:text-red-600"><X className="w-3 h-3" /></button>
                                </span>
                              ))}
                            </div>
                            <p className="text-xs text-green-700 font-medium">
                              {juniorSelectedDates.length} day{juniorSelectedDates.length !== 1 ? "s" : ""} × $80 = <strong>${juniorSelectedDates.length * 80}</strong>
                            </p>
                          </div>
                        )}
                        {juniorSelectedDates.length === 0 && (
                          <p className="text-xs text-muted-foreground mt-2">No days selected yet — tap dates above to add them.</p>
                        )}
                      </div>
                    )}

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

                    {/* Promo Code */}
                    {totalCents > 0 && (
                      <div>
                        <Label className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> Promo Code</Label>
                        {promoData?.valid ? (
                          <div className="flex items-center gap-2 mt-1.5 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                            <div className="flex-1">
                              <span className="font-semibold text-green-700 text-sm">{promoCode}</span>
                              <span className="text-green-600 text-sm ml-2">— {promoData.discountDescription}</span>
                              {promoData.isFree && <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">FREE</span>}
                            </div>
                            <button onClick={clearPromoCode} className="text-muted-foreground hover:text-foreground">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2 mt-1.5">
                            <Input
                              placeholder="Enter promo code"
                              value={promoInput}
                              onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyPromoCode())}
                              className="uppercase"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={applyPromoCode}
                              disabled={validatePromoQuery.isFetching}
                            >
                              {validatePromoQuery.isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                            </Button>
                          </div>
                        )}
                        {promoCode && promoData && !promoData.valid && (
                          <p className="text-xs text-red-500 mt-1">{promoData.message}</p>
                        )}
                      </div>
                    )}

                    {config.note && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                        <strong>Important:</strong> {config.note}
                      </div>
                    )}

                    {/* Payment Method Selector — only show when there is a charge */}
                    {finalAmountCents > 0 && (
                      <div>
                        <Label className="text-sm font-semibold mb-2 block">Payment Method</Label>
                        <div className="grid grid-cols-1 gap-2">
                          {/* Pay Online */}
                          <button
                            type="button"
                            onClick={() => setPaymentMethod("card")}
                            className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                              paymentMethod === "card"
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/40"
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                              paymentMethod === "card" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                            }`}>
                              <CreditCard className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-sm text-foreground">Pay Online (Credit / Debit Card)</div>
                              <div className="text-xs text-muted-foreground">Secure checkout via Stripe — pay now to confirm your spot</div>
                            </div>
                            {paymentMethod === "card" && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                          </button>

                          {/* Pay Cash */}
                          <button
                            type="button"
                            onClick={() => setPaymentMethod("cash")}
                            className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                              paymentMethod === "cash"
                                ? "border-green-600 bg-green-50"
                                : "border-border hover:border-green-400"
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                              paymentMethod === "cash" ? "bg-green-600 text-white" : "bg-muted text-muted-foreground"
                            }`}>
                              <span className="text-sm font-bold">$</span>
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-sm text-foreground">Pay Cash at Lesson</div>
                              <div className="text-xs text-muted-foreground">Reserve your spot now — bring cash to the lesson</div>
                            </div>
                            {paymentMethod === "cash" && <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />}
                          </button>

                          {/* Pay by Check */}
                          <button
                            type="button"
                            onClick={() => setPaymentMethod("check")}
                            className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                              paymentMethod === "check"
                                ? "border-blue-600 bg-blue-50"
                                : "border-border hover:border-blue-400"
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                              paymentMethod === "check" ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground"
                            }`}>
                              <span className="text-xs font-bold">CHK</span>
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-sm text-foreground">Pay by Check at Lesson</div>
                              <div className="text-xs text-muted-foreground">Reserve your spot now — bring a check made out to RI Tennis Academy</div>
                            </div>
                            {paymentMethod === "check" && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />}
                          </button>
                        </div>

                        {/* Cash/Check reminder banner */}
                        {(paymentMethod === "cash" || paymentMethod === "check") && (
                          <div className="mt-2 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                            <span>
                              Your spot will be <strong>reserved immediately</strong>. Please bring{" "}
                              {paymentMethod === "check" ? "a check made out to RI Tennis Academy" : "cash"}{" "}
                              for <strong>${(finalAmountCents / 100).toFixed(0)}</strong> to the lesson.
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                      <Button
                      type="submit"
                      size="lg"
                      className="w-full bg-accent text-accent-foreground hover:brightness-105 font-bold py-4 text-base rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99]"
                      disabled={createBookingMutation.isPending || createCheckoutMutation.isPending}
                    >
                      {createBookingMutation.isPending || createCheckoutMutation.isPending ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                      ) : finalAmountCents === 0 && totalCents > 0 ? (
                        <><CheckCircle2 className="w-4 h-4 mr-2" /> Book for FREE (Promo Applied)</>
                      ) : finalAmountCents > 0 && paymentMethod === "card" ? (
                        <><CreditCard className="w-4 h-4 mr-2" /> Book & Pay ${(finalAmountCents / 100).toFixed(0)}</>
                      ) : finalAmountCents > 0 && paymentMethod === "cash" ? (
                        <><CheckCircle2 className="w-4 h-4 mr-2" /> Reserve Spot — Pay Cash at Lesson</>
                      ) : finalAmountCents > 0 && paymentMethod === "check" ? (
                        <><CheckCircle2 className="w-4 h-4 mr-2" /> Reserve Spot — Pay by Check at Lesson</>
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
                  {promoData?.valid && (
                    <div className="flex justify-between text-sm py-1 text-green-600">
                      <span>Promo ({promoCode})</span>
                      <span>-{promoData.discountDescription}</span>
                    </div>
                  )}
                  {totalCents > 0 && (
                    <div className="flex justify-between font-bold text-foreground pt-2 border-t border-border mt-2">
                      <span>Total</span>
                      {promoData?.valid ? (
                        <span>
                          <span className="line-through text-muted-foreground text-sm mr-2">${(totalCents / 100).toFixed(0)}</span>
                          <span className="text-green-600">{finalAmountCents === 0 ? "FREE" : `$${(finalAmountCents / 100).toFixed(0)}`}</span>
                        </span>
                      ) : (
                        <span className="text-primary">${(totalCents / 100).toFixed(0)}</span>
                      )}
                    </div>
                  )}
                </div>
                {paymentMethod === "card" ? (
                  <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 text-xs text-foreground">
                    <CreditCard className="w-3.5 h-3.5 inline mr-1 text-accent" />
                    <strong>Secure payment via Stripe.</strong> You'll be redirected to complete payment after submitting.
                  </div>
                ) : paymentMethod === "cash" ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-800">
                    <span className="font-bold">💵 Pay Cash at Lesson.</span> Your spot is reserved — bring cash when you arrive.
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
                    <span className="font-bold">📝 Pay by Check at Lesson.</span> Make check payable to <em>RI Tennis Academy</em>.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Social proof */}
            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex -space-x-1">
                  {['S','J','M','L'].map((l) => (
                    <div key={l} className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center border-2 border-background">{l}</div>
                  ))}
                </div>
                <span className="text-green-700 dark:text-green-400 text-xs font-semibold">12+ booked this week</span>
              </div>
              <p className="text-xs text-green-600 dark:text-green-500">Join other Rhode Island players already on the court with Coach Mario.</p>
            </div>

            {/* Cancellation Policy */}
            <div className="bg-muted/50 border border-border rounded-xl p-4 text-xs text-muted-foreground">
              <div className="font-semibold text-foreground mb-2 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> Cancellation Policy
              </div>
              <p className="leading-relaxed">To cancel or reschedule, please contact Coach Mario at least 24 hours in advance at <a href="mailto:ritennismario@gmail.com" className="text-primary underline">ritennismario@gmail.com</a> or <a href="tel:+14019655873" className="text-primary underline">(401) 965-5873</a>.</p>
            </div>

            {/* What to Bring */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <div className="font-semibold text-blue-800 dark:text-blue-300 mb-2 text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> What to Bring
              </div>
              <ul className="space-y-1 text-xs text-blue-700 dark:text-blue-400">
                {['Tennis racquet', 'Water bottle', 'Athletic shoes', 'Positive attitude!'].map(item => (
                  <li key={item} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

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
