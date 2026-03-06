import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Users, ChevronLeft, ChevronRight, User } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

type ViewMode = "day" | "week" | "month";

// Hours Mario works: 7 AM to 8 PM
const DAY_START_HOUR = 7;
const DAY_END_HOUR = 20; // 8 PM (exclusive, so last slot is 7 PM)

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}
function formatDateFull(d: Date) {
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}
// Use local date components (not UTC) to avoid off-by-one when browser is behind UTC
function isoDate(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
function startOfWeek(d: Date) {
  const r = new Date(d);
  r.setDate(r.getDate() - r.getDay());
  return r;
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function formatHour(h: number) {
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}
// Parse "HH:MM:SS" or "HH:MM" to hour number
function parseHour(timeStr: string): number {
  return parseInt(timeStr.split(":")[0], 10);
}
// Normalize a slotDate value that may be a full ISO timestamp or a plain YYYY-MM-DD string.
// DB dates are stored as midnight UTC (e.g. 2026-03-06T00:00:00.000Z), so we MUST use UTC
// components to recover the correct calendar date — local components would shift the date
// backward by the UTC offset (e.g. midnight UTC = 7 PM EST the previous day).
function normalizeSlotDate(d: string | Date | null | undefined): string {
  if (!d) return "";
  if (d instanceof Date) {
    // Use UTC components: DB stores all slot/session dates as midnight UTC
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  const s = d as string;
  return s.split("T")[0];
}

// Human-readable labels for all program types
function getProgramLabel(programType: string | null | undefined): string {
  switch (programType) {
    case "private_lesson": return "Private Lesson";
    case "clinic_105": return "105 Game Clinic";
    case "junior_daily": return "Junior Program";
    case "junior_weekly": return "Junior Program (Week)";
    case "summer_camp_daily": return "Summer Camp";
    case "summer_camp_weekly": return "Summer Camp (Week)";
    case "after_camp": return "After Camp";
    case "mental_coaching": return "Mental Coaching";
    case "tournament_attendance": return "Tournament";
    case "stringing": return "Stringing";
    case "merchandise": return "Merchandise";
    default: return programType ? programType.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : "Session";
  }
}

// Color scheme for each program type
function getProgramColors(programType: string | null | undefined) {
  switch (programType) {
    case "private_lesson":
      return { light: "bg-blue-50 border-blue-300", text: "text-blue-800", dot: "bg-blue-500" };
    case "clinic_105":
      return { light: "bg-amber-50 border-amber-300", text: "text-amber-800", dot: "bg-amber-500" };
    case "junior_daily":
    case "junior_weekly":
      return { light: "bg-purple-50 border-purple-300", text: "text-purple-800", dot: "bg-purple-500" };
    case "summer_camp_daily":
    case "summer_camp_weekly":
    case "after_camp":
      return { light: "bg-orange-50 border-orange-300", text: "text-orange-800", dot: "bg-orange-500" };
    case "mental_coaching":
      return { light: "bg-teal-50 border-teal-300", text: "text-teal-800", dot: "bg-teal-500" };
    default:
      return { light: "bg-gray-50 border-gray-300", text: "text-gray-800", dot: "bg-gray-500" };
  }
}

function SlotBlock({ slot }: { slot: any }) {
  const isMyBooking = !!slot.isMyBooking;
  const programType = slot.programType as string | null;
  const colors = getProgramColors(programType);
  const isPrivate = programType === "private_lesson";
  const isClinic = programType === "clinic_105";
  const spotsLeft = (slot.maxParticipants ?? 0) - (slot.currentParticipants ?? 0);
  const isFull = spotsLeft <= 0;
  const label = getProgramLabel(programType);

  // For user's own bookings, use a green tint
  const containerClass = isMyBooking
    ? "rounded-lg border-2 px-3 py-2 bg-green-50 border-green-300 flex items-center justify-between gap-2"
    : `rounded-lg border-2 px-3 py-2 ${colors.light} flex items-center justify-between gap-2`;

  return (
    <div className={containerClass}>
      <div className="flex items-center gap-2 min-w-0">
        {isPrivate ? (
          <User className={`w-4 h-4 shrink-0 ${isMyBooking ? "text-green-700" : colors.text}`} />
        ) : (
          <Users className={`w-4 h-4 shrink-0 ${isMyBooking ? "text-green-700" : colors.text}`} />
        )}
        <div className="min-w-0">
          <div className={`font-semibold text-sm truncate ${isMyBooking ? "text-green-800" : colors.text}`}>
            {label}
            {isMyBooking && <span className="ml-1 text-xs font-normal text-green-600">(you)</span>}
          </div>
          <div className="text-xs text-gray-500">
            {slot.startTime ? `${slot.startTime?.slice(0, 5)} – ${slot.endTime?.slice(0, 5)}` : "All day"}
            {isClinic && !isMyBooking && (
              <span className={`ml-2 font-medium ${isFull ? "text-red-600" : "text-green-700"}`}>
                {isFull ? "Full" : `${spotsLeft} spot${spotsLeft !== 1 ? "s" : ""} left`}
              </span>
            )}
          </div>
        </div>
      </div>
      {isMyBooking ? (
        <Badge variant="outline" className="text-xs text-green-700 border-green-400 bg-green-100 shrink-0">Booked</Badge>
      ) : isClinic && !isFull ? (
        <Link href="/book/clinic_105">
          <Button size="sm" className="h-7 text-xs px-3 shrink-0">Book</Button>
        </Link>
      ) : isPrivate && !isFull ? (
        <Link href="/book/private_lesson">
          <Button size="sm" className="h-7 text-xs px-3 shrink-0">Book</Button>
        </Link>
      ) : (
        <Badge variant="outline" className="text-xs text-red-600 border-red-300 shrink-0">Full</Badge>
      )}
    </div>
  );
}

function HourlyDayView({ date, slots }: { date: Date; slots: any[] }) {
  const dateKey = isoDate(date);
  const daySlots = slots.filter((s) => normalizeSlotDate(s.slotDate) === dateKey);
  const hours = Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, i) => DAY_START_HOUR + i);

  // Map each slot to its start hour
  const slotsByHour: Record<number, any[]> = {};
  // Slots without a startTime get placed at 9 AM by default
  daySlots.forEach((s) => {
    const h = s.startTime ? parseHour(s.startTime) : 9;
    if (!slotsByHour[h]) slotsByHour[h] = [];
    slotsByHour[h].push(s);
  });

  return (
    <div>
      <h3 className="text-lg font-bold text-foreground mb-4">{formatDateFull(date)}</h3>
      <div className="border border-border rounded-xl overflow-hidden">
        {hours.map((hour, idx) => {
          const hourSlots = slotsByHour[hour] || [];
          const isEmpty = hourSlots.length === 0;
          const isLast = idx === hours.length - 1;
          return (
            <div
              key={hour}
              className={`flex gap-0 ${!isLast ? "border-b border-border" : ""} ${isEmpty ? "bg-card" : "bg-white"}`}
            >
              {/* Hour label */}
              <div className="w-20 shrink-0 flex items-start justify-end pr-3 pt-3 pb-3">
                <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                  {formatHour(hour)}
                </span>
              </div>
              {/* Divider line */}
              <div className="w-px bg-border shrink-0" />
              {/* Slot content */}
              <div className="flex-1 min-w-0 px-3 py-2.5 min-h-[52px] flex items-center">
                {isEmpty ? (
                  <span className="text-xs font-medium text-muted-foreground/40 select-none uppercase tracking-widest">
                    Free
                  </span>
                ) : (
                  <div className="flex flex-col gap-1.5 w-full">
                    {hourSlots.map((s) => (
                      <SlotBlock key={s.id} slot={s} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({ weekStart, slots, onDayClick }: { weekStart: Date; slots: any[]; onDayClick: (d: Date) => void }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = isoDate(new Date());

  return (
    <div className="space-y-3">
      {days.map((day) => {
        const dayKey = isoDate(day);
        const daySlots = slots.filter((s) => normalizeSlotDate(s.slotDate) === dayKey);
        const isToday = dayKey === today;

        return (
          <div
            key={dayKey}
            className={`rounded-xl border p-4 ${isToday ? "border-primary bg-primary/5" : "border-border bg-card"}`}
          >
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => onDayClick(day)}
                className={`font-bold text-sm hover:underline ${isToday ? "text-primary" : "text-foreground"}`}
              >
                {formatDate(day)} {isToday && <span className="text-xs font-normal text-primary ml-1">(Today)</span>}
              </button>
              {daySlots.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {daySlots.length} session{daySlots.length !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>
            {daySlots.length === 0 ? (
              <p className="text-xs text-muted-foreground/50 uppercase tracking-widest font-medium">No sessions</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-2">
                {daySlots.map((s) => <SlotBlock key={s.id} slot={s} />)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MonthView({ monthStart, slots, onDayClick }: { monthStart: Date; slots: any[]; onDayClick: (d: Date) => void }) {
  const firstDay = startOfMonth(monthStart);
  const lastDay = endOfMonth(monthStart);
  const startPad = firstDay.getDay();
  const totalCells = startPad + lastDay.getDate();
  const rows = Math.ceil(totalCells / 7);
  const today = isoDate(new Date());

  const slotsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    slots.forEach((s) => {
      const key = normalizeSlotDate(s.slotDate);
      if (!map[key]) map[key] = [];
      map[key].push(s);
    });
    return map;
  }, [slots]);

  return (
    <div>
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">{d}</div>
        ))}
      </div>
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: rows * 7 }, (_, i) => {
          const dayNum = i - startPad + 1;
          if (dayNum < 1 || dayNum > lastDay.getDate()) {
            return <div key={i} className="h-20 rounded-lg bg-muted/20" />;
          }
          const d = new Date(monthStart.getFullYear(), monthStart.getMonth(), dayNum);
          const key = isoDate(d);
          const daySessions = slotsByDate[key] || [];
          const privateCount = daySessions.filter((s) => s.programType === "private_lesson").length;
          const clinicCount = daySessions.filter((s) => s.programType === "clinic_105").length;
          const juniorCount = daySessions.filter((s) => s.programType === "junior_daily" || s.programType === "junior_weekly").length;
          const otherCount = daySessions.filter((s) =>
            s.programType !== "private_lesson" && s.programType !== "clinic_105" &&
            s.programType !== "junior_daily" && s.programType !== "junior_weekly"
          ).length;
          const isToday = key === today;
          const hasAny = daySessions.length > 0;

          return (
            <button
              key={i}
              onClick={() => onDayClick(d)}
              className={`h-20 rounded-lg border p-1.5 text-left transition-all hover:shadow-md hover:border-primary/50 flex flex-col ${
                isToday
                  ? "border-primary bg-primary/10"
                  : hasAny
                  ? "border-border bg-card"
                  : "border-border/50 bg-card/50"
              }`}
            >
              {/* Day number */}
              <div className={`text-xs font-bold mb-1 ${isToday ? "text-primary" : "text-foreground"}`}>
                {dayNum}
              </div>
              {/* Session indicators */}
              {hasAny ? (
                <div className="flex flex-col gap-0.5 flex-1">
                  {privateCount > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      <span className="text-[10px] text-blue-700 font-medium truncate">
                        {privateCount} private
                      </span>
                    </div>
                  )}
                  {clinicCount > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      <span className="text-[10px] text-amber-700 font-medium truncate">
                        {clinicCount} clinic
                      </span>
                    </div>
                  )}
                  {juniorCount > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                      <span className="text-[10px] text-purple-700 font-medium truncate">
                        {juniorCount} junior
                      </span>
                    </div>
                  )}
                  {otherCount > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-gray-500 shrink-0" />
                      <span className="text-[10px] text-gray-700 font-medium truncate">
                        {otherCount} other
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex items-end">
                  <span className="text-[9px] text-muted-foreground/30 uppercase tracking-widest font-medium">free</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Schedule() {
  const [view, setView] = useState<ViewMode>("day");
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const { fromDate, toDate } = useMemo(() => {
    if (view === "day") {
      return { fromDate: isoDate(currentDate), toDate: isoDate(currentDate) };
    } else if (view === "week") {
      const ws = startOfWeek(currentDate);
      return { fromDate: isoDate(ws), toDate: isoDate(addDays(ws, 6)) };
    } else {
      const ms = startOfMonth(currentDate);
      const me = endOfMonth(currentDate);
      return { fromDate: isoDate(ms), toDate: isoDate(me) };
    }
  }, [view, currentDate]);

  const { isAuthenticated } = useAuth();

  const { data: slots = [], isLoading } = trpc.schedule.listAvailableMulti.useQuery({
    from: fromDate,
    to: toDate,
    programTypes: ["private_lesson", "clinic_105"],
  });

  // Fetch the logged-in user's own bookings (all types) and merge them into the calendar
  const { data: myBookings = [] } = trpc.schedule.listMyPrivateLessons.useQuery(
    { from: fromDate, to: toDate },
    { enabled: isAuthenticated }
  );

  // Merge: public 105 Clinic slots + all of the user's own bookings (any program type)
  const allSlots = useMemo(() => {
    const clinicSlots = slots.filter((s) => s.programType === "clinic_105");
    // Ensure every user booking has a startTime so it can be placed on the hour grid
    const myBookingsNormalized = myBookings.map((b) => ({
      ...b,
      startTime: b.startTime || "09:00:00", // default to 9 AM for non-timed programs
    }));
    return [...clinicSlots, ...myBookingsNormalized];
  }, [slots, myBookings]);

  const navigate = (dir: 1 | -1) => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (view === "day") return addDays(d, dir);
      if (view === "week") return addDays(d, dir * 7);
      d.setMonth(d.getMonth() + dir);
      return d;
    });
  };

  const goToToday = () => setCurrentDate(new Date());

  const periodLabel = useMemo(() => {
    if (view === "day") return formatDateFull(currentDate);
    if (view === "week") {
      const ws = startOfWeek(currentDate);
      const we = addDays(ws, 6);
      return `${formatDate(ws)} – ${formatDate(we)}`;
    }
    return currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, [view, currentDate]);

  const handleDayClick = (d: Date) => {
    setCurrentDate(d);
    setView("day");
  };

  const totalPrivate = allSlots.filter((s) => s.programType === "private_lesson").length;
  const totalClinic = allSlots.filter((s) => s.programType === "clinic_105").length;
  const totalSpotsLeft = allSlots
    .filter((s) => s.programType === "clinic_105")
    .reduce((sum, s) => sum + Math.max(0, (s.maxParticipants ?? 0) - (s.currentParticipants ?? 0)), 0);
  const totalMyBookings = myBookings.length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-primary text-primary-foreground py-12">
        <div className="container">
          <Badge className="mb-3 bg-accent/20 text-accent border-accent/30">Live Schedule</Badge>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2">Session Schedule</h1>
          <p className="text-primary-foreground/80 max-w-xl">
            Browse available private lessons and 105 Game Clinic sessions. Click any session to book directly.
          </p>
          <div className="flex flex-wrap gap-4 mt-5">
            <div className="bg-white/10 rounded-lg px-4 py-2 text-sm">
              <span className="font-bold text-accent">{totalPrivate}</span>
              <span className="text-primary-foreground/70 ml-1">private lesson{totalPrivate !== 1 ? "s" : ""} this period</span>
            </div>
            <div className="bg-white/10 rounded-lg px-4 py-2 text-sm">
              <span className="font-bold text-accent">{totalClinic}</span>
              <span className="text-primary-foreground/70 ml-1">105 Game session{totalClinic !== 1 ? "s" : ""} this period</span>
            </div>
            <div className="bg-white/10 rounded-lg px-4 py-2 text-sm">
              <span className="font-bold text-accent">{totalSpotsLeft}</span>
              <span className="text-primary-foreground/70 ml-1">clinic spots available</span>
            </div>
            {isAuthenticated && totalMyBookings > 0 && (
              <div className="bg-green-500/20 rounded-lg px-4 py-2 text-sm">
                <span className="font-bold text-green-300">{totalMyBookings}</span>
                <span className="text-primary-foreground/70 ml-1">your booking{totalMyBookings !== 1 ? "s" : ""} this period</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Legend */}
      <div className="bg-muted/30 border-b border-border py-2">
        <div className="container flex flex-wrap items-center gap-4 text-xs">
          <span className="text-muted-foreground font-medium">Legend:</span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
            <span className="text-blue-700 font-medium">Private Lesson</span> — 1-on-1 with Coach Mario
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
            <span className="text-amber-700 font-medium">105 Game Clinic</span> — Group competitive play
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-purple-500 inline-block" />
            <span className="text-purple-700 font-medium">Junior Program</span> — Youth training
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
            <span className="text-green-700 font-medium">Your Booking</span> — Sessions you've booked
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-muted-foreground/40 font-medium uppercase tracking-widest text-[10px]">Free</span>
            <span className="text-muted-foreground">= open hour slot</span>
          </span>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="container py-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <Tabs value={view} onValueChange={(v) => setView(v as ViewMode)}>
            <TabsList>
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={goToToday} className="text-xs">Today</Button>
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-semibold text-foreground min-w-[180px] text-center">{periodLabel}</span>
            <Button variant="outline" size="icon" onClick={() => navigate(1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            {/* Jump-to-date input */}
            <input
              type="date"
              value={isoDate(currentDate)}
              onChange={(e) => {
                if (e.target.value) {
                  // Parse as local date to avoid UTC offset shifting
                  const [y, m, d] = e.target.value.split("-").map(Number);
                  setCurrentDate(new Date(y, m - 1, d));
                  if (view === "month") setView("day");
                }
              }}
              className="text-xs border border-border rounded-md px-2 py-1.5 bg-background text-foreground cursor-pointer hover:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary"
              title="Jump to date"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Clock className="w-6 h-6 animate-spin mr-2" />
            Loading schedule...
          </div>
        ) : (
          <>
            {view === "day" && <HourlyDayView date={currentDate} slots={allSlots} />}
            {view === "week" && <WeekView weekStart={startOfWeek(currentDate)} slots={allSlots} onDayClick={handleDayClick} />}
            {view === "month" && <MonthView monthStart={startOfMonth(currentDate)} slots={allSlots} onDayClick={handleDayClick} />}
          </>
        )}

        {/* Bottom CTA */}
        <div className="mt-10 text-center border-t border-border pt-8">
          <p className="text-muted-foreground mb-3">Don't see a time that works for you?</p>
          <a href="mailto:ritennismario@gmail.com">
            <Button variant="outline" className="mr-2">
              Email Coach Mario
            </Button>
          </a>
          <a href="tel:+14019655873">
            <Button>Call 401-965-5873</Button>
          </a>
        </div>
      </div>
    </div>
  );
}
