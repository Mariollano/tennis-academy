import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

type DayStatus = "available" | "limited" | "full" | "blocked" | "past" | "empty";

interface DayInfo {
  date: string; // YYYY-MM-DD
  status: DayStatus;
  spotsLeft: number;
  totalSlots: number;
}

function getDayStyle(status: DayStatus): string {
  switch (status) {
    case "available":
      return "bg-green-500/20 text-green-400 border border-green-500/40 hover:bg-green-500/30 cursor-pointer";
    case "limited":
      return "bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30 cursor-pointer";
    case "full":
      return "bg-red-500/15 text-red-400/60 border border-red-500/20 cursor-not-allowed";
    case "blocked":
      return "bg-muted/20 text-muted-foreground/40 border border-border/20 cursor-not-allowed line-through";
    case "past":
      return "text-muted-foreground/30 cursor-default";
    default:
      return "cursor-default";
  }
}

export default function AvailabilityCalendar({ compact = false }: { compact?: boolean }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1); // 1-12
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { data: availability, isLoading } = trpc.schedule.getMonthAvailability.useQuery(
    { year: viewYear, month: viewMonth },
    { staleTime: 60_000 }
  );

  // Build a map from date string to availability info
  const availMap = useMemo(() => {
    const m: Record<string, { status: string; spotsLeft: number; totalSlots: number }> = {};
    if (availability) {
      for (const d of availability) {
        m[d.date] = { status: d.status, spotsLeft: d.spotsLeft, totalSlots: d.totalSlots };
      }
    }
    return m;
  }, [availability]);

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth - 1, 1);
    const lastDay = new Date(viewYear, viewMonth, 0);
    const startDow = firstDay.getDay(); // 0=Sun
    const daysInMonth = lastDay.getDate();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

    const cells: Array<{ day: number | null; dateStr: string | null; status: DayStatus; spotsLeft: number; totalSlots: number }> = [];

    // Leading empty cells
    for (let i = 0; i < startDow; i++) {
      cells.push({ day: null, dateStr: null, status: "empty", spotsLeft: 0, totalSlots: 0 });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${viewYear}-${String(viewMonth).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const isPast = dateStr < todayStr;
      const info = availMap[dateStr];
      let status: DayStatus = "past";
      if (!isPast) {
        if (!info) {
          status = "past"; // no slots scheduled = treat as unavailable
        } else {
          status = info.status as DayStatus;
        }
      }
      cells.push({
        day: d,
        dateStr,
        status,
        spotsLeft: info?.spotsLeft ?? 0,
        totalSlots: info?.totalSlots ?? 0,
      });
    }

    return cells;
  }, [viewYear, viewMonth, availMap, today]);

  const prevMonth = () => {
    if (viewMonth === 1) { setViewMonth(12); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 12) { setViewMonth(1); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const selectedInfo = selectedDate ? availMap[selectedDate] : null;

  return (
    <div className={`rounded-3xl border border-white/10 overflow-hidden ${compact ? '' : ''}`}
      style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-white/10">
        <button
          onClick={prevMonth}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-center">
          <h3 className="font-extrabold text-white text-lg" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            {MONTHS[viewMonth - 1].toUpperCase()} {viewYear}
          </h3>
        </div>
        <button
          onClick={nextMonth}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 px-4 pt-3 pb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs font-bold text-white/30 uppercase tracking-wider py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      {isLoading ? (
        <div className="grid grid-cols-7 gap-1 p-4">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-9 rounded-lg bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1 p-4">
          {calendarDays.map((cell, i) => (
            <div
              key={i}
              className={`relative h-9 rounded-lg flex items-center justify-center text-sm font-semibold transition-all
                ${cell.day === null ? '' : getDayStyle(cell.status)}
                ${selectedDate === cell.dateStr ? 'ring-2 ring-accent ring-offset-1 ring-offset-transparent' : ''}
              `}
              onClick={() => {
                if (cell.dateStr && (cell.status === 'available' || cell.status === 'limited')) {
                  setSelectedDate(selectedDate === cell.dateStr ? null : cell.dateStr);
                }
              }}
            >
              {cell.day}
              {/* Dot indicator for limited spots */}
              {cell.status === 'limited' && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-400" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Selected date info */}
      {selectedDate && selectedInfo && (
        <div className="mx-4 mb-4 p-4 rounded-2xl border border-accent/30 bg-accent/10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-white font-bold text-sm">
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <Badge className={`text-xs font-bold border ${
              selectedInfo.status === 'available' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
              'bg-amber-500/20 text-amber-400 border-amber-500/30'
            }`}>
              {selectedInfo.spotsLeft} spot{selectedInfo.spotsLeft !== 1 ? 's' : ''} left
            </Badge>
          </div>
          <p className="text-white/60 text-xs mb-3">{selectedInfo.totalSlots} session{selectedInfo.totalSlots !== 1 ? 's' : ''} scheduled</p>
          <Link href={`/schedule`}>
            <Button size="sm" className="w-full rounded-xl text-white font-bold text-xs" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
              <Calendar className="w-3.5 h-3.5 mr-1.5" />
              View & Book This Day
            </Button>
          </Link>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 px-4 pb-4 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-green-500/30 border border-green-500/50" />
          <span className="text-white/40 text-xs">Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-amber-500/30 border border-amber-500/50" />
          <span className="text-white/40 text-xs">Limited</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-red-500/20 border border-red-500/30" />
          <span className="text-white/40 text-xs">Full</span>
        </div>
      </div>
    </div>
  );
}
