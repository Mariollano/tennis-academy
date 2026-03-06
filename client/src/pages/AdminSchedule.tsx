import { useState, useMemo, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, ChevronLeft, ChevronRight, Plus, Ban, Zap,
  Users, CalendarDays, CalendarRange, LayoutGrid, Loader2, Trash2, Edit2, Eye,
  CreditCard, CheckCircle, RefreshCw,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// ─── Date helpers ─────────────────────────────────────────────────────────────
function startOfWeek(d: Date) {
  const c = new Date(d); c.setHours(0,0,0,0);
  c.setDate(c.getDate() - c.getDay()); return c;
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function addDays(d: Date, n: number) {
  const c = new Date(d); c.setDate(c.getDate() + n); return c;
}
function isoDate(d: Date) { return d.toISOString().slice(0, 10); }
function fmtMonthYear(d: Date) {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
function fmtWeekRange(start: Date) {
  const end = addDays(start, 6);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", { ...opts, year: "numeric" })}`;
}
function fmtDayFull(d: Date) {
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}
function fmtTime(t: string | null | undefined) {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hour = parseInt(h);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
}
function getDateKey(raw: any): string {
  if (!raw) return "";
  if (typeof raw === "string") return raw.slice(0, 10);
  return new Date(raw).toISOString().slice(0, 10);
}

// ─── Event types ──────────────────────────────────────────────────────────────
type CalEvent = {
  id: string;
  kind: "slot" | "booking" | "blocked";
  title: string;
  dateKey: string;   // YYYY-MM-DD
  startTime?: string;
  endTime?: string;
  color: string;
  badge?: string;
  raw: any;
};

// ─── Mini event chip ──────────────────────────────────────────────────────────
function EventChip({ ev, onClick }: { ev: CalEvent; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left text-[11px] font-medium px-1.5 py-0.5 rounded truncate ${ev.color} hover:opacity-80 transition-opacity`}
    >
      {ev.startTime ? `${fmtTime(ev.startTime)} ` : ""}{ev.title}
    </button>
  );
}

// ─── Event detail dialog ──────────────────────────────────────────────────────
function EventDetailDialog({
  ev, onClose, onDelete, onRefetch,
}: {
  ev: CalEvent | null;
  onClose: () => void;
  onDelete: (ev: CalEvent) => void;
  onRefetch: () => void;
}) {
  const updateSlot = trpc.schedule.update.useMutation({
    onSuccess: () => { toast.success("Session updated!"); onRefetch(); onClose(); },
    onError: () => toast.error("Update failed."),
  });
  const confirmNow = trpc.booking.confirmNow.useMutation({
    onSuccess: () => { toast.success("Booking confirmed!"); onRefetch(); onClose(); },
    onError: (e) => toast.error(e.message || "Failed to confirm."),
  });
  const sendPaymentLink = trpc.booking.sendPaymentLink.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, "_blank");
        toast.success("Stripe checkout opened — share this link with the student or complete payment now.");
      }
    },
    onError: (e) => toast.error(e.message || "Failed to create payment link."),
  });
  const [editCap, setEditCap] = useState<number | null>(null);

  if (!ev) return null;
  const r = ev.raw;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full inline-block ${ev.color.split(" ")[0]}`} />
            {ev.title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          {ev.kind === "slot" && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Date:</span> {new Date(r.slotDate).toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric" })}</div>
                <div><span className="text-muted-foreground">Time:</span> {fmtTime(r.startTime)} – {fmtTime(r.endTime)}</div>
                <div><span className="text-muted-foreground">Capacity:</span> {r.currentParticipants}/{r.maxParticipants}</div>
                <div><span className="text-muted-foreground">Spots left:</span> {r.spotsLeft}</div>
              </div>
              <div>
                <Label className="text-xs">Adjust capacity</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="number" min={1} max={100}
                    defaultValue={r.maxParticipants}
                    onChange={e => setEditCap(parseInt(e.target.value))}
                    className="w-24"
                  />
                  <Button size="sm" onClick={() => {
                    if (editCap && editCap !== r.maxParticipants) {
                      updateSlot.mutate({ id: r.id, maxParticipants: editCap });
                    }
                  }} disabled={updateSlot.isPending}>
                    {updateSlot.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                  </Button>
                </div>
              </div>
              {r.notes && <div className="text-muted-foreground text-xs">{r.notes}</div>}
            </>
          )}
          {ev.kind === "booking" && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Student:</span> {r.studentName || "—"}</div>
                <div><span className="text-muted-foreground">Email:</span> {r.studentEmail || "—"}</div>
                <div><span className="text-muted-foreground">Program:</span> {r.programName || r.programType || "—"}</div>
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge className={`text-xs ${
                    r.status === "confirmed" ? "bg-green-100 text-green-800" :
                    r.status === "pending" ? "bg-amber-100 text-amber-800" :
                    r.status === "cancelled" ? "bg-red-100 text-red-800" : ""
                  }`}>{r.status}</Badge>
                </div>
                <div><span className="text-muted-foreground">Amount:</span> <span className="font-semibold">${((r.totalAmountCents || 0) / 100).toFixed(2)}</span></div>
              </div>
              {r.notes && <div className="text-muted-foreground text-xs">Notes: {r.notes}</div>}
              {r.status === "pending" && (
                <div className="border border-amber-200 bg-amber-50 rounded-lg p-3 space-y-2">
                  <p className="text-xs font-semibold text-amber-800">This booking is pending payment.</p>
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white w-full gap-1.5"
                      onClick={() => sendPaymentLink.mutate({ bookingId: r.id, origin: window.location.origin })}
                      disabled={sendPaymentLink.isPending || confirmNow.isPending}
                    >
                      {sendPaymentLink.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
                      Charge via Stripe
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full gap-1.5 border-green-300 text-green-700 hover:bg-green-50"
                      onClick={() => confirmNow.mutate({ id: r.id })}
                      disabled={confirmNow.isPending || sendPaymentLink.isPending}
                    >
                      {confirmNow.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                      Mark Confirmed (cash/check paid)
                    </Button>
                  </div>
                  <p className="text-[10px] text-amber-700">“Charge via Stripe” opens a checkout page you can share with the student or complete yourself. “Mark Confirmed” is for cash or check payments already received.</p>
                </div>
              )}
              {r.status === "confirmed" && (
                <div className="border border-green-200 bg-green-50 rounded-lg p-2 text-xs text-green-800 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" /> Booking confirmed and paid.
                </div>
              )}
            </>
          )}
          {ev.kind === "blocked" && (
            <div className="grid grid-cols-2 gap-2">
              <div><span className="text-muted-foreground">Date:</span> {new Date(r.blockedDate).toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric" })}</div>
              <div><span className="text-muted-foreground">All day:</span> {r.isAllDay ? "Yes" : "No"}</div>
              {!r.isAllDay && <><div><span className="text-muted-foreground">From:</span> {fmtTime(r.startTime)}</div><div><span className="text-muted-foreground">To:</span> {fmtTime(r.endTime)}</div></>}
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          {ev.kind !== "booking" && (
            <Button variant="destructive" size="sm" onClick={() => onDelete(ev)}>
              <Trash2 className="w-3 h-3 mr-1" /> Delete
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Add Session dialog ───────────────────────────────────────────────────────
function AddSessionDialog({ onClose, onRefetch }: { onClose: () => void; onRefetch: () => void }) {
  const { data: programList } = trpc.admin.listPrograms.useQuery();
  const [form, setForm] = useState({ programId: "", title: "", slotDate: "", startTime: "09:00", endTime: "10:30", maxParticipants: "12", notes: "" });
  const createSlot = trpc.schedule.create.useMutation({
    onSuccess: () => { toast.success("Session created!"); onRefetch(); onClose(); },
    onError: (e) => toast.error(e.message || "Failed to create session."),
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Add Session</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Program</Label>
            <Select value={form.programId} onValueChange={v => set("programId", v)}>
              <SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger>
              <SelectContent>
                {(programList as any[] | undefined)?.map((p: any) => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                ))}
                {!programList && <SelectItem value="0">Loading…</SelectItem>}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Title (optional)</Label><Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. 105 Clinic – Monday" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Date</Label><Input type="date" value={form.slotDate} onChange={e => set("slotDate", e.target.value)} /></div>
            <div><Label>Max spots</Label><Input type="number" min={1} max={100} value={form.maxParticipants} onChange={e => set("maxParticipants", e.target.value)} /></div>
            <div><Label>Start time</Label><Input type="time" value={form.startTime} onChange={e => set("startTime", e.target.value)} /></div>
            <div><Label>End time</Label><Input type="time" value={form.endTime} onChange={e => set("endTime", e.target.value)} /></div>
          </div>
          <div><Label>Notes (optional)</Label><Input value={form.notes} onChange={e => set("notes", e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => {
            if (!form.programId || !form.slotDate) { toast.error("Program and date are required."); return; }
            createSlot.mutate({ programId: parseInt(form.programId), title: form.title || undefined, slotDate: form.slotDate, startTime: form.startTime + ":00", endTime: form.endTime + ":00", maxParticipants: parseInt(form.maxParticipants), notes: form.notes || undefined });
          }} disabled={createSlot.isPending}>
            {createSlot.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Block Time dialog ────────────────────────────────────────────────────────
function BlockTimeDialog({ onClose, onRefetch }: { onClose: () => void; onRefetch: () => void }) {
  const [form, setForm] = useState({ title: "", blockedDate: "", isAllDay: true });
  const [selectedHours, setSelectedHours] = useState<Set<number>>(new Set());
  const blockTime = trpc.schedule.blockTime.useMutation({
    onSuccess: () => { toast.success("Time blocked!"); onRefetch(); onClose(); },
    onError: (e) => toast.error(e.message || "Failed to block time."),
  });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const toggleHour = (h: number) => setSelectedHours(prev => {
    const next = new Set(prev);
    next.has(h) ? next.delete(h) : next.add(h);
    return next;
  });

  const handleBlock = () => {
    if (!form.title || !form.blockedDate) { toast.error("Reason and date are required."); return; }
    if (!form.isAllDay && selectedHours.size === 0) { toast.error("Please select at least one hour to block."); return; }
    if (form.isAllDay) {
      blockTime.mutate({ title: form.title, blockedDate: form.blockedDate, isAllDay: true, affectsPrivateLessons: true, affects105Clinic: true });
    } else {
      // Block each selected hour as a separate 1-hour block
      const hours = Array.from(selectedHours).sort();
      let pending = hours.length;
      hours.forEach(h => {
        const startTime = `${String(h).padStart(2, "0")}:00`;
        const endTime = `${String(h + 1).padStart(2, "0")}:00`;
        blockTime.mutate({ title: form.title, blockedDate: form.blockedDate, startTime, endTime, isAllDay: false, affectsPrivateLessons: true, affects105Clinic: false },
          { onSettled: () => { pending--; if (pending === 0) { onRefetch(); onClose(); } } }
        );
      });
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Block Time Off</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Reason / Label</Label><Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Vacation, Tournament" /></div>
          <div><Label>Date</Label><Input type="date" value={form.blockedDate} onChange={e => set("blockedDate", e.target.value)} /></div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="allday" checked={form.isAllDay} onChange={e => { set("isAllDay", e.target.checked); setSelectedHours(new Set()); }} className="w-4 h-4" />
            <Label htmlFor="allday">Block entire day</Label>
          </div>
          {!form.isAllDay && (
            <div>
              <Label className="text-sm font-semibold mb-2 block">Select hours to block (6 AM – 7 PM)</Label>
              <p className="text-xs text-muted-foreground mb-2">Tap each hour you want to block. Students won't be able to book these times.</p>
              <div className="grid grid-cols-4 gap-1.5">
                {Array.from({ length: 14 }, (_, i) => {
                  const h = i + 6;
                  const ampm = h < 12 ? "AM" : "PM";
                  const h12 = h > 12 ? h - 12 : h;
                  const label = `${h12}:00 ${ampm}`;
                  const isSelected = selectedHours.has(h);
                  return (
                    <button key={h} type="button" onClick={() => toggleHour(h)}
                      className={`py-1.5 px-1 rounded border-2 text-center text-xs font-medium transition-all ${
                        isSelected ? "border-destructive bg-destructive text-destructive-foreground" : "border-border bg-card hover:border-destructive/60 hover:bg-destructive/5"
                      }`}>
                      {label}
                    </button>
                  );
                })}
              </div>
              {selectedHours.size > 0 && (
                <p className="text-xs text-destructive mt-2">{selectedHours.size} hour{selectedHours.size > 1 ? "s" : ""} will be blocked</p>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={handleBlock} disabled={blockTime.isPending}>
            {blockTime.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Block
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Generate 105 Clinic dialog ───────────────────────────────────────────────
const CLINIC_PREFS_KEY = "ri_tennis_clinic_prefs";
function getClinicPrefs() {
  try { return JSON.parse(localStorage.getItem(CLINIC_PREFS_KEY) || "{}"); } catch { return {}; }
}
function saveClinicPrefs(prefs: Record<string, string>) {
  try { localStorage.setItem(CLINIC_PREFS_KEY, JSON.stringify({ ...getClinicPrefs(), ...prefs })); } catch {}
}

function Generate105Dialog({ onClose, onRefetch }: { onClose: () => void; onRefetch: () => void }) {
  const { data: programList } = trpc.admin.listPrograms.useQuery();
  const prefs = getClinicPrefs();
  const [form, setForm] = useState({
    programId: prefs.programId || "",
    fromDate: isoDate(new Date()),
    toDate: isoDate(addDays(new Date(), 30)),
    weekdayCap: prefs.weekdayCap || "12",
    sundayCap: prefs.sundayCap || "24",
    startTime: prefs.startTime || "09:00",
    endTime: prefs.endTime || "10:30",
  });
  const gen = trpc.schedule.generate105Slots.useMutation({
    onSuccess: (d) => { toast.success(`Created ${d.created} sessions!`); onRefetch(); onClose(); },
    onError: (e) => toast.error(e.message || "Failed to generate sessions."),
  });
  const set = (k: string, v: string) => {
    setForm(f => ({ ...f, [k]: v }));
    saveClinicPrefs({ [k]: v });
  };
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Generate 105 Clinic Sessions</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">Creates sessions for <strong>Mon, Wed, Fri &amp; Sun</strong> in the selected date range. Weekday cap applies to Mon/Wed/Fri; Sunday cap applies to Sundays.</p>
        <div className="space-y-3">
          <div>
            <Label>Program</Label>
            <Select value={form.programId} onValueChange={v => set("programId", v)}>
              <SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger>
              <SelectContent>
                {(programList as any[] | undefined)?.map((p: any) => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                ))}
                {!programList && <SelectItem value="0">Loading…</SelectItem>}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>From date</Label><Input type="date" value={form.fromDate} onChange={e => set("fromDate", e.target.value)} /></div>
            <div><Label>To date</Label><Input type="date" value={form.toDate} onChange={e => set("toDate", e.target.value)} /></div>
            <div><Label>Mon / Wed / Fri cap (spots)</Label><Input type="number" min={1} max={100} value={form.weekdayCap} onChange={e => set("weekdayCap", e.target.value)} /></div>
            <div><Label>Sunday cap</Label><Input type="number" min={1} max={100} value={form.sundayCap} onChange={e => set("sundayCap", e.target.value)} /></div>
            <div><Label>Start time</Label><Input type="time" value={form.startTime} onChange={e => set("startTime", e.target.value)} /></div>
            <div><Label>End time</Label><Input type="time" value={form.endTime} onChange={e => set("endTime", e.target.value)} /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => {
            if (!form.programId) { toast.error("Select a program first."); return; }
            gen.mutate({ programId: parseInt(form.programId), fromDate: form.fromDate, toDate: form.toDate, weekdayCap: parseInt(form.weekdayCap), sundayCap: parseInt(form.sundayCap), startTime: form.startTime + ":00", endTime: form.endTime + ":00" });
          }} disabled={gen.isPending}>
            {gen.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Month View ───────────────────────────────────────────────────────────────
function MonthView({ anchor, events, onEventClick }: { anchor: Date; events: CalEvent[]; onEventClick: (ev: CalEvent) => void }) {
  const monthStart = startOfMonth(anchor);
  const monthEnd = endOfMonth(anchor);
  const gridStart = startOfWeek(monthStart);
  const days: Date[] = [];
  const cur = new Date(gridStart);
  while (cur <= monthEnd || days.length % 7 !== 0) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
    if (days.length > 42) break;
  }
  const evByDate = useMemo(() => {
    const m: Record<string, CalEvent[]> = {};
    events.forEach(ev => { if (!m[ev.dateKey]) m[ev.dateKey] = []; m[ev.dateKey].push(ev); });
    return m;
  }, [events]);
  const today = isoDate(new Date());
  return (
    <div className="flex-1 overflow-auto">
      <div className="grid grid-cols-7 border-b border-border">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
          <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7" style={{ gridAutoRows: "minmax(100px, 1fr)" }}>
        {days.map((day, i) => {
          const key = isoDate(day);
          const dayEvs = evByDate[key] || [];
          const isToday = key === today;
          const isCurrentMonth = day.getMonth() === anchor.getMonth();
          return (
            <div key={i} className={`border-b border-r border-border p-1 min-h-[100px] ${!isCurrentMonth ? "bg-muted/30" : ""}`}>
              <div className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-primary text-primary-foreground" : "text-foreground"} ${!isCurrentMonth ? "text-muted-foreground" : ""}`}>
                {day.getDate()}
              </div>
              <div className="space-y-0.5">
                {dayEvs.slice(0, 3).map(ev => <EventChip key={ev.id} ev={ev} onClick={() => onEventClick(ev)} />)}
                {dayEvs.length > 3 && (
                  <div className="text-[10px] text-muted-foreground pl-1">+{dayEvs.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Shared time-grid helpers ─────────────────────────────────────────────────
const HOUR_HEIGHT = 64; // px per hour
const DAY_START = 7;    // 7 AM
const DAY_END = 22;     // 10 PM
const TOTAL_HOURS = DAY_END - DAY_START;

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

function evTop(startTime: string | undefined): number {
  if (!startTime) return 0;
  const mins = timeToMinutes(startTime) - DAY_START * 60;
  return Math.max(0, (mins / 60) * HOUR_HEIGHT);
}

function evHeight(startTime: string | undefined, endTime: string | undefined): number {
  if (!startTime) return HOUR_HEIGHT;
  const startMins = timeToMinutes(startTime);
  const endMins = endTime ? timeToMinutes(endTime) : startMins + 60;
  const durationMins = Math.max(30, endMins - startMins);
  return (durationMins / 60) * HOUR_HEIGHT;
}

// ─── Time grid column (shared by Day and Week) ────────────────────────────────
function TimeGridColumn({ dayEvs, onEventClick, compact = false }: {
  dayEvs: CalEvent[];
  onEventClick: (ev: CalEvent) => void;
  compact?: boolean;
}) {
  const allDay = dayEvs.filter(ev => !ev.startTime);
  const timed = dayEvs.filter(ev => !!ev.startTime);
  const totalPx = TOTAL_HOURS * HOUR_HEIGHT;

  return (
    <div className="flex flex-col flex-1 min-w-0">
      {/* All-day events */}
      {allDay.length > 0 && (
        <div className="border-b border-border p-1 space-y-0.5 bg-muted/20">
          {allDay.map(ev => (
            <button key={ev.id} onClick={() => onEventClick(ev)}
              className={`w-full text-left rounded px-1.5 py-0.5 text-[11px] font-medium ${ev.color} hover:opacity-80`}>
              {ev.title}
            </button>
          ))}
        </div>
      )}
      {/* Timed events grid */}
      <div className="relative" style={{ height: totalPx }}>
        {timed.map(ev => {
          const top = evTop(ev.startTime);
          const height = evHeight(ev.startTime, ev.endTime);
          return (
            <button
              key={ev.id}
              onClick={() => onEventClick(ev)}
              style={{ top, height, left: 2, right: 2, position: "absolute" }}
              className={`rounded-lg px-2 py-1 text-left overflow-hidden ${ev.color} hover:opacity-80 transition-opacity border border-white/30`}
            >
              <div className={`font-semibold leading-tight ${compact ? "text-[10px]" : "text-xs"} truncate`}>{ev.title}</div>
              {height >= 36 && (
                <div className={`opacity-80 ${compact ? "text-[9px]" : "text-[11px]"} leading-tight`}>
                  {fmtTime(ev.startTime)}{ev.endTime ? ` – ${fmtTime(ev.endTime)}` : ""}
                </div>
              )}
              {height >= 52 && ev.badge && (
                <div className="text-[10px] opacity-70 mt-0.5">{ev.badge}</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Hour labels column ───────────────────────────────────────────────────────
function HourLabels() {
  return (
    <div className="w-14 shrink-0 relative" style={{ height: TOTAL_HOURS * HOUR_HEIGHT }}>
      {Array.from({ length: TOTAL_HOURS }, (_, i) => ({ hour: DAY_START + i, i })).map(({ hour, i }) => (
        <div
          key={hour}
          className="absolute right-2 text-[11px] text-muted-foreground"
          style={{ top: i * HOUR_HEIGHT - 8 }}
        >
          {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
        </div>
      ))}
    </div>
  );
}

//// ─── Hour grid lines ──────────────────────────────────────────────────
function HourLines() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {Array.from({ length: TOTAL_HOURS }, (_, i) => (
        <div key={i} className="absolute w-full border-t border-border/50" style={{ top: i * HOUR_HEIGHT }} />
      ))}
    </div>
  );
}

// ─── Current time red line ──────────────────────────────────────────────
function CurrentTimeLine({ forDate }: { forDate: Date }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Only show on today's column
  const todayKey = isoDate(new Date());
  const colKey = isoDate(forDate);
  if (colKey !== todayKey) return null;

  const nowMins = now.getHours() * 60 + now.getMinutes();
  const startMins = DAY_START * 60;
  const endMins = DAY_END * 60;
  if (nowMins < startMins || nowMins > endMins) return null;

  const top = ((nowMins - startMins) / 60) * HOUR_HEIGHT;
  return (
    <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top }}>
      <div className="relative flex items-center">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1.5 shrink-0" />
        <div className="flex-1 h-px bg-red-500" />
      </div>
    </div>
  );
}

// ─── Week View ────────────────────────────────────────────────────────────────
function WeekView({ anchor, events, onEventClick }: { anchor: Date; events: CalEvent[]; onEventClick: (ev: CalEvent) => void }) {
  const weekStart = startOfWeek(anchor);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const evByDate = useMemo(() => {
    const m: Record<string, CalEvent[]> = {};
    events.forEach(ev => { if (!m[ev.dateKey]) m[ev.dateKey] = []; m[ev.dateKey].push(ev); });
    return m;
  }, [events]);
  const today = isoDate(new Date());

  return (
    <div className="flex-1 overflow-auto">
      {/* Day headers */}
      <div className="flex border-b border-border sticky top-0 bg-card z-10">
        <div className="w-14 shrink-0" />
        {days.map((day, i) => {
          const key = isoDate(day);
          const isToday = key === today;
          return (
            <div key={i} className="flex-1 text-center py-2 border-l border-border first:border-l-0">
              <div className="text-xs text-muted-foreground">{day.toLocaleDateString("en-US", { weekday: "short" })}</div>
              <div className={`text-base font-bold mx-auto w-8 h-8 flex items-center justify-center rounded-full ${
                isToday ? "bg-primary text-primary-foreground" : "text-foreground"
              }`}>{day.getDate()}</div>
            </div>
          );
        })}
      </div>
      {/* Time grid */}
      <div className="flex">
        <HourLabels />
        <div className="flex flex-1 relative">
          <HourLines />
          {days.map((day, i) => {
            const key = isoDate(day);
            const dayEvs = evByDate[key] || [];
            return (
              <div key={i} className="flex-1 border-l border-border first:border-l-0 relative">
                <CurrentTimeLine forDate={day} />
                <TimeGridColumn dayEvs={dayEvs} onEventClick={onEventClick} compact />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Day View ─────────────────────────────────────────────────────────────────
function DayView({ anchor, events, onEventClick }: { anchor: Date; events: CalEvent[]; onEventClick: (ev: CalEvent) => void }) {
  const key = isoDate(anchor);
  const dayEvs = events.filter(ev => ev.dateKey === key);

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <div className="text-center py-3 border-b border-border sticky top-0 bg-card z-10">
        <div className="text-lg font-bold text-foreground">{fmtDayFull(anchor)}</div>
        <div className="text-sm text-muted-foreground">{dayEvs.length} event{dayEvs.length !== 1 ? "s" : ""}</div>
      </div>
      {/* Time grid */}
      <div className="flex">
        <HourLabels />
        <div className="flex-1 relative border-l border-border">
          <HourLines />
          <CurrentTimeLine forDate={anchor} />
          <TimeGridColumn dayEvs={dayEvs} onEventClick={onEventClick} />
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
type ViewMode = "day" | "week" | "month";

export default function AdminSchedule() {
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [anchor, setAnchor] = useState(() => new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null);
  const [showAddSession, setShowAddSession] = useState(false);
  const [showBlockTime, setShowBlockTime] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);

  // Compute date range to fetch based on view
  const { from, to } = useMemo(() => {
    if (viewMode === "day") {
      return { from: isoDate(anchor), to: isoDate(anchor) };
    } else if (viewMode === "week") {
      const ws = startOfWeek(anchor);
      return { from: isoDate(ws), to: isoDate(addDays(ws, 6)) };
    } else {
      const ms = startOfMonth(anchor);
      const gridStart = startOfWeek(ms);
      const me = endOfMonth(anchor);
      return { from: isoDate(gridStart), to: isoDate(addDays(me, 6)) };
    }
  }, [viewMode, anchor]);

  const { data: calData, refetch, isLoading } = trpc.schedule.adminCalendar.useQuery(
    { from, to },
    { refetchOnWindowFocus: false }
  );

  const deleteSlot = trpc.schedule.delete.useMutation({
    onSuccess: () => { toast.success("Session deleted."); refetch(); setSelectedEvent(null); },
    onError: () => toast.error("Delete failed."),
  });
  const deleteBlock = trpc.schedule.deleteBlock.useMutation({
    onSuccess: () => { toast.success("Block removed."); refetch(); setSelectedEvent(null); },
    onError: () => toast.error("Delete failed."),
  });
  const syncCounts = trpc.schedule.syncParticipantCounts.useMutation({
    onSuccess: () => { toast.success("Participant counts recalculated successfully."); refetch(); },
    onError: () => toast.error("Failed to recalculate counts."),
  });

  // Build unified event list
  const events: CalEvent[] = useMemo(() => {
    if (!calData) return [];
    const evs: CalEvent[] = [];

    // Schedule slots
    (calData.slots || []).forEach((s: any) => {
      evs.push({
        id: `slot-${s.id}`,
        kind: "slot",
        title: s.title || s.programName || "Session",
        dateKey: getDateKey(s.slotDate),
        startTime: s.startTime,
        endTime: s.endTime,
        color: s.isFull
          ? "bg-red-100 text-red-800"
          : s.spotsLeft <= 2
          ? "bg-amber-100 text-amber-800"
          : "bg-blue-100 text-blue-800",
        badge: s.isFull ? "Full" : `${s.spotsLeft} left`,
        raw: s,
      });
    });

    // Bookings
    (calData.bookings || []).forEach((b: any) => {
      const dateKey = b.sessionDate ? getDateKey(b.sessionDate) : getDateKey(b.createdAt);
      evs.push({
        id: `booking-${b.id}`,
        kind: "booking",
        title: `${b.studentName || "Student"} — ${b.programName || b.programType || "Booking"}`,
        dateKey,
        startTime: undefined,
        endTime: undefined,
        color: b.status === "confirmed"
          ? "bg-green-100 text-green-800"
          : "bg-purple-100 text-purple-800",
        badge: b.status,
        raw: b,
      });
    });

    // Blocked times
    (calData.blocked || []).forEach((bl: any) => {
      evs.push({
        id: `blocked-${bl.id}`,
        kind: "blocked",
        title: `🚫 ${bl.title}`,
        dateKey: getDateKey(bl.blockedDate),
        startTime: bl.startTime,
        endTime: bl.endTime,
        color: "bg-gray-200 text-gray-600",
        raw: bl,
      });
    });

    return evs;
  }, [calData]);

  // Navigation
  function navigate(dir: 1 | -1) {
    setAnchor(prev => {
      const d = new Date(prev);
      if (viewMode === "day") d.setDate(d.getDate() + dir);
      else if (viewMode === "week") d.setDate(d.getDate() + dir * 7);
      else d.setMonth(d.getMonth() + dir);
      return d;
    });
  }
  function goToday() { setAnchor(new Date()); }

  function headerLabel() {
    if (viewMode === "day") return fmtDayFull(anchor);
    if (viewMode === "week") return fmtWeekRange(startOfWeek(anchor));
    return fmtMonthYear(anchor);
  }

  function handleDeleteEvent(ev: CalEvent) {
    if (ev.kind === "slot") deleteSlot.mutate({ id: ev.raw.id });
    else if (ev.kind === "blocked") deleteBlock.mutate({ id: ev.raw.id });
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center gap-3">
        <Link href="/admin">
          <Button variant="ghost" size="sm" className="text-primary-foreground/80 hover:text-primary-foreground gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Button>
        </Link>
        <span className="text-lg font-bold">Schedule Manager</span>
      </div>

      {/* Calendar toolbar */}
      <div className="border-b border-border bg-card px-4 py-2 flex flex-wrap items-center gap-2">
        {/* View switcher */}
        <div className="flex rounded-lg border border-border overflow-hidden">
          {([["day", "Day", CalendarDays], ["week", "Week", CalendarRange], ["month", "Month", LayoutGrid]] as const).map(([v, label, Icon]) => (
            <button key={v} onClick={() => setViewMode(v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${viewMode === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}><ChevronLeft className="w-4 h-4" /></Button>
          <Button variant="outline" size="sm" className="h-8 px-3 text-xs" onClick={goToday}>Today</Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate(1)}><ChevronRight className="w-4 h-4" /></Button>
        </div>

        <span className="font-semibold text-foreground text-sm flex-1 text-center">{headerLabel()}</span>

        {/* Legend */}
        <div className="hidden md:flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block" />Session</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block" />Booking</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />Full</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-gray-400 inline-block" />Blocked</span>
        </div>

        {/* Actions */}
        <div className="flex gap-1.5 ml-auto">
          <Button size="sm" className="h-8 bg-green-600 hover:bg-green-700 text-white gap-1 text-xs" onClick={() => setShowGenerate(true)}>
            <Zap className="w-3.5 h-3.5" /> Generate 105
          </Button>
          <Button size="sm" className="h-8 bg-primary text-primary-foreground gap-1 text-xs" onClick={() => setShowAddSession(true)}>
            <Plus className="w-3.5 h-3.5" /> Add Session
          </Button>
          <Button size="sm" variant="outline" className="h-8 border-red-300 text-red-600 hover:bg-red-50 gap-1 text-xs" onClick={() => setShowBlockTime(true)}>
            <Ban className="w-3.5 h-3.5" /> Block Time
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 border-amber-300 text-amber-700 hover:bg-amber-50 gap-1 text-xs"
            onClick={() => syncCounts.mutate()}
            disabled={syncCounts.isPending}
            title="Recalculate all slot participant counts from actual bookings"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncCounts.isPending ? "animate-spin" : ""}`} />
            {syncCounts.isPending ? "Syncing…" : "Recalculate Counts"}
          </Button>
        </div>
      </div>

      {/* Calendar body */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading calendar…
        </div>
      ) : (
        <>
          {viewMode === "month" && <MonthView anchor={anchor} events={events} onEventClick={setSelectedEvent} />}
          {viewMode === "week" && <WeekView anchor={anchor} events={events} onEventClick={setSelectedEvent} />}
          {viewMode === "day" && <DayView anchor={anchor} events={events} onEventClick={setSelectedEvent} />}
        </>
      )}

      {/* Dialogs */}
      {selectedEvent && (
        <EventDetailDialog
          ev={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onDelete={handleDeleteEvent}
          onRefetch={refetch}
        />
      )}
      {showAddSession && <AddSessionDialog onClose={() => setShowAddSession(false)} onRefetch={refetch} />}
      {showBlockTime && <BlockTimeDialog onClose={() => setShowBlockTime(false)} onRefetch={refetch} />}
      {showGenerate && <Generate105Dialog onClose={() => setShowGenerate(false)} onRefetch={refetch} />}
    </div>
  );
}
