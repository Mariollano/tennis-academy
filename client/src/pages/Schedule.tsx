import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Users, ChevronLeft, ChevronRight, User } from "lucide-react";
import { trpc } from "@/lib/trpc";

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
function isoDate(d: Date) {
  return d.toISOString().split("T")[0];
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
// Normalize a slotDate value that may be a full ISO timestamp or a plain YYYY-MM-DD string
function normalizeSlotDate(d: string | Date | null | undefined): string {
  if (!d) return "";
  const s = typeof d === "string" ? d : d.toISOString();
  return s.split("T")[0];
}

const PROGRAM_COLORS = {
  private_lesson: {
    bg: "bg-blue-500",
    light: "bg-blue-50 border-blue-300",
    text: "text-blue-800",
    dot: "bg-blue-500",
    label: "Private Lesson",
  },
  clinic_105: {
    bg: "bg-amber-500",
    light: "bg-amber-50 border-amber-300",
    text: "text-amber-800",
    dot: "bg-amber-500",
    label: "105 Game Clinic",
  },
} as const;

function SlotBlock({ slot }: { slot: any }) {
  const colors = PROGRAM_COLORS[slot.programType as keyof typeof PROGRAM_COLORS] || {
    light: "bg-gray-50 border-gray-300", text: "text-gray-800", label: "Session",
  };
  const isPrivate = slot.programType === "private_lesson";
  const spotsLeft = slot.maxParticipants - slot.currentParticipants;
  const isFull = spotsLeft <= 0;

  return (
    <div className={`rounded-lg border-2 px-3 py-2 ${colors.light} flex items-center justify-between gap-2`}>
      <div className="flex items-center gap-2 min-w-0">
        {isPrivate ? (
          <User className={`w-4 h-4 shrink-0 ${colors.text}`} />
        ) : (
          <Users className={`w-4 h-4 shrink-0 ${colors.text}`} />
        )}
        <div className="min-w-0">
          <div className={`font-semibold text-sm truncate ${colors.text}`}>
            {isPrivate ? "Private Lesson" : "105 Game Clinic"}
          </div>
          <div className="text-xs text-gray-500">
            {slot.startTime?.slice(0, 5)} – {slot.endTime?.slice(0, 5)}
            {!isPrivate && (
              <span className={`ml-2 font-medium ${isFull ? "text-red-600" : "text-green-700"}`}>
                {isFull ? "Full" : `${spotsLeft} spot${spotsLeft !== 1 ? "s" : ""} left`}
              </span>
            )}
          </div>
        </div>
      </div>
      {!isFull ? (
        <Link href={`/book/${isPrivate ? "private_lesson" : "clinic_105"}`}>
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
  daySlots.forEach((s) => {
    const h = parseHour(s.startTime || "0:00");
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
        const privateSlots = daySlots.filter((s) => s.programType === "private_lesson");
        const clinicSlots = daySlots.filter((s) => s.programType === "clinic_105");

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
                {privateSlots.map((s) => <SlotBlock key={s.id} slot={s} />)}
                {clinicSlots.map((s) => <SlotBlock key={s.id} slot={s} />)}
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

  const { data: slots = [], isLoading } = trpc.schedule.listAvailableMulti.useQuery({
    from: fromDate,
    to: toDate,
    programTypes: ["private_lesson", "clinic_105"],
  });

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

  const totalPrivate = slots.filter((s) => s.programType === "private_lesson").length;
  const totalClinic = slots.filter((s) => s.programType === "clinic_105").length;
  const totalSpotsLeft = slots
    .filter((s) => s.programType === "clinic_105")
    .reduce((sum, s) => sum + Math.max(0, s.maxParticipants - s.currentParticipants), 0);

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

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday} className="text-xs">Today</Button>
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-semibold text-foreground min-w-[220px] text-center">{periodLabel}</span>
            <Button variant="outline" size="icon" onClick={() => navigate(1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Clock className="w-6 h-6 animate-spin mr-2" />
            Loading schedule...
          </div>
        ) : (
          <>
            {view === "day" && <HourlyDayView date={currentDate} slots={slots} />}
            {view === "week" && <WeekView weekStart={startOfWeek(currentDate)} slots={slots} onDayClick={handleDayClick} />}
            {view === "month" && <MonthView monthStart={startOfMonth(currentDate)} slots={slots} onDayClick={handleDayClick} />}
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
