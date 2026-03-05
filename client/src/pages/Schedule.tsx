import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Users, ChevronLeft, ChevronRight, Trophy, User } from "lucide-react";
import { trpc } from "@/lib/trpc";

type ViewMode = "day" | "week" | "month";

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
  r.setDate(r.getDate() - r.getDay()); // Sunday
  return r;
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

const PROGRAM_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  private_lesson: { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200" },
  clinic_105: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200" },
};

function SlotCard({ slot }: { slot: any }) {
  const isPrivate = slot.programType === "private_lesson";
  const colors = PROGRAM_COLORS[slot.programType] || { bg: "bg-gray-50", text: "text-gray-800", border: "border-gray-200" };
  const spotsLeft = slot.maxParticipants - slot.currentParticipants;
  const isFull = spotsLeft <= 0;

  return (
    <div className={`rounded-lg border p-3 ${colors.bg} ${colors.border}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            {isPrivate ? (
              <User className={`w-3.5 h-3.5 ${colors.text}`} />
            ) : (
              <Users className={`w-3.5 h-3.5 ${colors.text}`} />
            )}
            <span className={`font-semibold text-sm ${colors.text}`}>
              {slot.programName || (isPrivate ? "Private Lesson" : "105 Game Clinic")}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
            <Clock className="w-3 h-3" />
            {slot.startTime?.slice(0, 5)} – {slot.endTime?.slice(0, 5)}
          </div>
          {slot.notes && (
            <p className="text-xs text-gray-500 mb-2">{slot.notes}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          {isPrivate ? (
            <Badge className="bg-blue-100 text-blue-700 text-xs">1-on-1</Badge>
          ) : (
            <div>
              <div className={`text-xs font-bold ${isFull ? "text-red-600" : "text-green-700"}`}>
                {isFull ? "Full" : `${spotsLeft} spot${spotsLeft !== 1 ? "s" : ""} left`}
              </div>
              <div className="text-xs text-gray-400">{slot.currentParticipants}/{slot.maxParticipants}</div>
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        {!isFull ? (
          <Link href={`/book/${slot.programType === "private_lesson" ? "private_lesson" : "clinic_105"}`}>
            <Button size="sm" className="h-7 text-xs bg-primary text-primary-foreground hover:bg-primary/90 px-3">
              Book Now
            </Button>
          </Link>
        ) : (
          <Badge variant="outline" className="text-xs text-red-600 border-red-200">Session Full</Badge>
        )}
      </div>
    </div>
  );
}

function DayView({ date, slots }: { date: Date; slots: any[] }) {
  const daySlots = slots.filter((s) => s.slotDate === isoDate(date));
  const privateSlots = daySlots.filter((s) => s.programType === "private_lesson");
  const clinicSlots = daySlots.filter((s) => s.programType === "clinic_105");

  return (
    <div>
      <h3 className="text-lg font-bold text-foreground mb-4">{formatDateFull(date)}</h3>
      {daySlots.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No sessions scheduled for this day.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
              <User className="w-4 h-4" /> Private Lessons ({privateSlots.length})
            </h4>
            {privateSlots.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No private lessons today</p>
            ) : (
              <div className="flex flex-col gap-2">
                {privateSlots.map((s) => <SlotCard key={s.id} slot={s} />)}
              </div>
            )}
          </div>
          <div>
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" /> 105 Game Clinic ({clinicSlots.length})
            </h4>
            {clinicSlots.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No 105 Game sessions today</p>
            ) : (
              <div className="flex flex-col gap-2">
                {clinicSlots.map((s) => <SlotCard key={s.id} slot={s} />)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function WeekView({ weekStart, slots }: { weekStart: Date; slots: any[] }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  return (
    <div className="space-y-4">
      {days.map((day) => {
        const daySlots = slots.filter((s) => s.slotDate === isoDate(day));
        const isToday = isoDate(day) === isoDate(new Date());
        return (
          <div key={isoDate(day)} className={`rounded-xl border p-4 ${isToday ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
            <div className="flex items-center justify-between mb-3">
              <h4 className={`font-bold ${isToday ? "text-primary" : "text-foreground"}`}>
                {formatDate(day)} {isToday && <span className="text-xs font-normal text-primary ml-1">(Today)</span>}
              </h4>
              {daySlots.length > 0 && (
                <Badge variant="outline" className="text-xs">{daySlots.length} session{daySlots.length !== 1 ? "s" : ""}</Badge>
              )}
            </div>
            {daySlots.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No sessions</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-2">
                {daySlots.map((s) => <SlotCard key={s.id} slot={s} />)}
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
  const startPad = firstDay.getDay(); // 0=Sun
  const totalCells = startPad + lastDay.getDate();
  const rows = Math.ceil(totalCells / 7);

  const slotsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    slots.forEach((s) => {
      if (!map[s.slotDate]) map[s.slotDate] = [];
      map[s.slotDate].push(s);
    });
    return map;
  }, [slots]);

  const today = isoDate(new Date());

  return (
    <div>
      <div className="grid grid-cols-7 mb-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: rows * 7 }, (_, i) => {
          const dayNum = i - startPad + 1;
          if (dayNum < 1 || dayNum > lastDay.getDate()) {
            return <div key={i} className="h-16 rounded-lg bg-muted/20" />;
          }
          const d = new Date(monthStart.getFullYear(), monthStart.getMonth(), dayNum);
          const key = isoDate(d);
          const daySessions = slotsByDate[key] || [];
          const privateCount = daySessions.filter((s) => s.programType === "private_lesson").length;
          const clinicCount = daySessions.filter((s) => s.programType === "clinic_105").length;
          const isToday = key === today;
          return (
            <button
              key={i}
              onClick={() => onDayClick(d)}
              className={`h-16 rounded-lg border p-1.5 text-left transition-all hover:shadow-md hover:border-primary/50 ${
                isToday ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-muted/30"
              }`}
            >
              <div className={`text-xs font-bold mb-1 ${isToday ? "text-primary" : "text-foreground"}`}>{dayNum}</div>
              {privateCount > 0 && (
                <div className="text-[10px] bg-blue-100 text-blue-700 rounded px-1 mb-0.5 truncate">
                  {privateCount} private
                </div>
              )}
              {clinicCount > 0 && (
                <div className="text-[10px] bg-amber-100 text-amber-700 rounded px-1 truncate">
                  {clinicCount} clinic
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
  const [view, setView] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  // Compute date range based on view
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
      if (view === "day") return addDays(prev, dir);
      if (view === "week") return addDays(prev, dir * 7);
      // month
      const d = new Date(prev);
      d.setMonth(d.getMonth() + dir);
      return d;
    });
  };

  const periodLabel = useMemo(() => {
    if (view === "day") return formatDateFull(currentDate);
    if (view === "week") {
      const ws = startOfWeek(currentDate);
      const we = addDays(ws, 6);
      return `${formatDate(ws)} – ${formatDate(we)}`;
    }
    return currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, [view, currentDate]);

  const handleMonthDayClick = (d: Date) => {
    setSelectedDay(d);
    setView("day");
    setCurrentDate(d);
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
            Browse available private lessons and 105 Game Clinic sessions. Book directly from the calendar.
          </p>
          {/* Quick stats */}
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
            <span className="w-3 h-3 rounded bg-blue-200 inline-block" />
            <span className="text-blue-700 font-medium">Private Lesson</span> — 1-on-1 with Coach Mario
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-200 inline-block" />
            <span className="text-amber-700 font-medium">105 Game Clinic</span> — Group competitive play
          </span>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="container py-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          {/* View toggle */}
          <Tabs value={view} onValueChange={(v) => setView(v as ViewMode)}>
            <TabsList>
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Navigation */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-semibold text-foreground min-w-[200px] text-center">{periodLabel}</span>
            <Button variant="outline" size="icon" onClick={() => navigate(1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
              className="ml-2 text-xs"
            >
              Today
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground">
            <Calendar className="w-10 h-10 mx-auto mb-3 animate-pulse opacity-40" />
            <p>Loading schedule...</p>
          </div>
        ) : (
          <>
            {view === "day" && <DayView date={currentDate} slots={slots} />}
            {view === "week" && <WeekView weekStart={startOfWeek(currentDate)} slots={slots} />}
            {view === "month" && (
              <MonthView
                monthStart={startOfMonth(currentDate)}
                slots={slots}
                onDayClick={handleMonthDayClick}
              />
            )}
          </>
        )}

        {/* No slots message */}
        {!isLoading && slots.length === 0 && (
          <Card className="mt-6 border-dashed">
            <CardContent className="py-12 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
              <CardTitle className="text-lg mb-2 text-muted-foreground">No sessions scheduled yet</CardTitle>
              <p className="text-sm text-muted-foreground mb-4">
                Coach Mario hasn't added sessions for this period yet. Check back soon or contact him directly.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <a href="tel:+14019655873">
                  <Button variant="outline" size="sm">📞 (401) 965-5873</Button>
                </a>
                <a href="mailto:ritennismario@gmail.com">
                  <Button variant="outline" size="sm">✉️ ritennismario@gmail.com</Button>
                </a>
              </div>
            </CardContent>
          </Card>
        )}

        {/* CTA */}
        <div className="mt-10 bg-primary/5 border border-primary/20 rounded-xl p-6 text-center">
          <Trophy className="w-8 h-8 mx-auto mb-3 text-primary" />
          <h3 className="font-bold text-lg text-foreground mb-1">Don't see a time that works?</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Contact Coach Mario directly to arrange a custom session time.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="tel:+14019655873">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                📞 Call (401) 965-5873
              </Button>
            </a>
            <a href="mailto:ritennismario@gmail.com">
              <Button variant="outline">✉️ Email Mario</Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
