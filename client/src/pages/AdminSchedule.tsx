import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Calendar, Clock, Users, Plus, Trash2, Edit3, Ban,
  ChevronLeft, ChevronRight, Shield, AlertTriangle, CheckCircle, Eye
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Link } from "wouter";

// ── Helpers ──────────────────────────────────────────────────────────────────
function isoWeekStart(d: Date) {
  const day = new Date(d);
  day.setDate(day.getDate() - day.getDay()); // Sunday
  return day;
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function fmtTime(t: string | null | undefined) {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${m} ${ampm}`;
}

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminSchedule() {
  const { user, isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();

  // Week navigation
  const [weekStart, setWeekStart] = useState(() => isoWeekStart(new Date()));
  const weekEnd = addDays(weekStart, 6);

  const fromStr = toInputDate(weekStart);
  const toStr = toInputDate(weekEnd);

  const { data: scheduleData, refetch } = trpc.schedule.adminView.useQuery(
    { from: fromStr, to: toStr },
    { enabled: user?.role === "admin" }
  );

  const { data: programsList } = trpc.programs.list.useQuery(undefined, { enabled: user?.role === "admin" });

  // Mutations
  const createSlotMutation = trpc.schedule.create.useMutation({
    onSuccess: () => { toast.success("Session created!"); refetch(); setCreateOpen(false); resetCreateForm(); },
    onError: (e) => toast.error(e.message),
  });

  const generate105Mutation = trpc.schedule.generate105Slots.useMutation({
    onSuccess: (d) => { toast.success(`Created ${d.created} sessions!`); refetch(); setGenOpen(false); },
    onError: (e) => toast.error(e.message),
  });

  const updateSlotMutation = trpc.schedule.update.useMutation({
    onSuccess: () => { toast.success("Session updated!"); refetch(); setEditSlot(null); },
    onError: (e) => toast.error(e.message),
  });

  const deleteSlotMutation = trpc.schedule.delete.useMutation({
    onSuccess: () => { toast.success("Session deleted."); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const blockTimeMutation = trpc.schedule.blockTime.useMutation({
    onSuccess: () => { toast.success("Time blocked!"); refetch(); setBlockOpen(false); resetBlockForm(); },
    onError: (e) => toast.error(e.message),
  });

  const deleteBlockMutation = trpc.schedule.deleteBlock.useMutation({
    onSuccess: () => { toast.success("Block removed."); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  // Enrollees dialog
  const [enrolleeSlotId, setEnrolleeSlotId] = useState<number | null>(null);
  const { data: enrollees } = trpc.schedule.getEnrollees.useQuery(
    { slotId: enrolleeSlotId! },
    { enabled: enrolleeSlotId !== null }
  );

  // Create slot form
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    programId: "", slotDate: toInputDate(new Date()), startTime: "09:00", endTime: "10:30",
    maxParticipants: "12", title: "", notes: "",
  });
  const resetCreateForm = () => setCreateForm({
    programId: "", slotDate: toInputDate(new Date()), startTime: "09:00", endTime: "10:30",
    maxParticipants: "12", title: "", notes: "",
  });

  // Generate 105 form
  const [genOpen, setGenOpen] = useState(false);
  const [genForm, setGenForm] = useState({
    programId: "",
    fromDate: toInputDate(new Date()), toDate: toInputDate(addDays(new Date(), 30)),
    weekdayCap: "12", sundayCap: "24", startTime: "09:00", endTime: "10:30",
  });

  // Edit slot
  const [editSlot, setEditSlot] = useState<any | null>(null);

  // Block time form
  const [blockOpen, setBlockOpen] = useState(false);
  const [blockForm, setBlockForm] = useState({
    title: "", blockedDate: toInputDate(new Date()), startTime: "", endTime: "",
    isAllDay: true, affectsPrivateLessons: true, affects105Clinic: true,
  });
  const resetBlockForm = () => setBlockForm({
    title: "", blockedDate: toInputDate(new Date()), startTime: "", endTime: "",
    isAllDay: true, affectsPrivateLessons: true, affects105Clinic: true,
  });

  // Build week days array
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  // Group slots and blocks by date string
  const slotsByDate = useMemo(() => {
    const map: Record<string, NonNullable<typeof scheduleData>["slots"]> = {};
    scheduleData?.slots?.forEach(s => {
      const rawDate = s.slotDate as unknown;
      const key = typeof rawDate === "string" ? (rawDate as string).slice(0, 10) : new Date(rawDate as any).toISOString().slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(s);
    });
    return map;
  }, [scheduleData]);

  const blocksByDate = useMemo(() => {
    const map: Record<string, NonNullable<typeof scheduleData>["blocked"]> = {};
    scheduleData?.blocked?.forEach(b => {
      const rawDate = b.blockedDate as unknown;
      const key = typeof rawDate === "string" ? (rawDate as string).slice(0, 10) : new Date(rawDate as any).toISOString().slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(b);
    });
    return map;
  }, [scheduleData]);

  // 105 clinic programs
  const clinic105Programs = programsList?.filter(p => p.type === "clinic_105") || [];
  const privateLessonPrograms = programsList?.filter(p => p.type === "private_lesson") || [];

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  if (!isAuthenticated) return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full text-center p-8">
        <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Admin Access Required</h2>
        <Button className="bg-primary text-primary-foreground" onClick={() => (window.location.href = getLoginUrl())}>Sign In</Button>
      </Card>
    </div>
  );

  if (user?.role !== "admin") return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full text-center p-8">
        <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <Link href="/"><Button variant="outline">Go Home</Button></Link>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-primary text-primary-foreground py-8">
        <div className="container">
          <div className="flex items-center gap-3 mb-1">
            <Calendar className="w-5 h-5 text-accent" />
            <Badge className="bg-accent/20 text-accent border-accent/30">Schedule Manager</Badge>
          </div>
          <h1 className="text-3xl font-extrabold">My Schedule</h1>
          <p className="text-primary-foreground/70 mt-1">View, manage, and block your coaching calendar</p>
          <div className="flex gap-2 mt-4 flex-wrap">
            <Link href="/admin"><Button variant="outline" className="border-white/30 text-white hover:bg-white/10 h-8 text-sm">← Back to Dashboard</Button></Link>
          </div>
        </div>
      </section>

      <div className="container py-6">
        <Tabs defaultValue="calendar">
          <TabsList className="mb-6 h-auto bg-muted p-1 rounded-xl">
            <TabsTrigger value="calendar"><Calendar className="w-4 h-4 mr-1.5" />Week View</TabsTrigger>
            <TabsTrigger value="list"><Clock className="w-4 h-4 mr-1.5" />All Sessions</TabsTrigger>
            <TabsTrigger value="blocked"><Ban className="w-4 h-4 mr-1.5" />Blocked Times</TabsTrigger>
          </TabsList>

          {/* ── CALENDAR TAB ─────────────────────────────────────────────── */}
          <TabsContent value="calendar">
            {/* Week nav + action buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setWeekStart(w => addDays(w, -7))}><ChevronLeft className="w-4 h-4" /></Button>
                <span className="font-semibold text-sm">{fmtDate(weekStart)} – {fmtDate(weekEnd)}</span>
                <Button variant="outline" size="sm" onClick={() => setWeekStart(w => addDays(w, 7))}><ChevronRight className="w-4 h-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => setWeekStart(isoWeekStart(new Date()))}>Today</Button>
              </div>
              <div className="flex gap-2 flex-wrap">
                {/* Generate 105 slots */}
                <Dialog open={genOpen} onOpenChange={setGenOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white"><Plus className="w-4 h-4 mr-1" />Generate 105 Clinic Sessions</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Generate 105 Clinic Sessions</DialogTitle></DialogHeader>
                    <p className="text-sm text-muted-foreground mb-4">Automatically creates sessions on Mon, Wed, Fri (weekday cap) and Sundays (Sunday cap) for the selected date range.</p>
                    <div className="space-y-3">
                      <div>
                        <Label>Program</Label>
                        <Select value={genForm.programId} onValueChange={v => setGenForm(f => ({ ...f, programId: v }))}>
                          <SelectTrigger><SelectValue placeholder="Select 105 Clinic program" /></SelectTrigger>
                          <SelectContent>
                            {clinic105Programs.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                            {clinic105Programs.length === 0 && <SelectItem value="0">Auto-create program</SelectItem>}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label>From Date</Label><Input type="date" value={genForm.fromDate} onChange={e => setGenForm(f => ({ ...f, fromDate: e.target.value }))} /></div>
                        <div><Label>To Date</Label><Input type="date" value={genForm.toDate} onChange={e => setGenForm(f => ({ ...f, toDate: e.target.value }))} /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label>Start Time</Label><Input type="time" value={genForm.startTime} onChange={e => setGenForm(f => ({ ...f, startTime: e.target.value }))} /></div>
                        <div><Label>End Time</Label><Input type="time" value={genForm.endTime} onChange={e => setGenForm(f => ({ ...f, endTime: e.target.value }))} /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label>Mon/Wed/Fri Cap</Label><Input type="number" value={genForm.weekdayCap} onChange={e => setGenForm(f => ({ ...f, weekdayCap: e.target.value }))} /></div>
                        <div><Label>Sunday Cap</Label><Input type="number" value={genForm.sundayCap} onChange={e => setGenForm(f => ({ ...f, sundayCap: e.target.value }))} /></div>
                      </div>
                      <Button className="w-full bg-primary text-primary-foreground" disabled={generate105Mutation.isPending}
                        onClick={() => {
                          const pid = genForm.programId ? parseInt(genForm.programId) : 0;
                          if (!pid) { toast.error("Please select a 105 Clinic program first."); return; }
                          generate105Mutation.mutate({
                            programId: pid,
                            fromDate: genForm.fromDate,
                            toDate: genForm.toDate,
                            weekdayCap: parseInt(genForm.weekdayCap),
                            sundayCap: parseInt(genForm.sundayCap),
                            startTime: genForm.startTime + ":00",
                            endTime: genForm.endTime + ":00",
                          });
                        }}>
                        {generate105Mutation.isPending ? "Generating…" : "Generate Sessions"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Add single slot */}
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-primary text-primary-foreground"><Plus className="w-4 h-4 mr-1" />Add Session</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Add Session</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <div>
                        <Label>Program</Label>
                        <Select value={createForm.programId} onValueChange={v => setCreateForm(f => ({ ...f, programId: v }))}>
                          <SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger>
                          <SelectContent>
                            {programsList?.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name} ({p.type.replace(/_/g, " ")})</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div><Label>Session Label (optional)</Label><Input placeholder="e.g. 105 Clinic – Monday Jan 6" value={createForm.title} onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))} /></div>
                      <div><Label>Date</Label><Input type="date" value={createForm.slotDate} onChange={e => setCreateForm(f => ({ ...f, slotDate: e.target.value }))} /></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label>Start Time</Label><Input type="time" value={createForm.startTime} onChange={e => setCreateForm(f => ({ ...f, startTime: e.target.value }))} /></div>
                        <div><Label>End Time</Label><Input type="time" value={createForm.endTime} onChange={e => setCreateForm(f => ({ ...f, endTime: e.target.value }))} /></div>
                      </div>
                      <div><Label>Max Participants</Label><Input type="number" value={createForm.maxParticipants} onChange={e => setCreateForm(f => ({ ...f, maxParticipants: e.target.value }))} /></div>
                      <div><Label>Notes (optional)</Label><Input value={createForm.notes} onChange={e => setCreateForm(f => ({ ...f, notes: e.target.value }))} /></div>
                      <Button className="w-full bg-primary text-primary-foreground" disabled={createSlotMutation.isPending || !createForm.programId}
                        onClick={() => createSlotMutation.mutate({
                          programId: parseInt(createForm.programId),
                          title: createForm.title || undefined,
                          slotDate: createForm.slotDate,
                          startTime: createForm.startTime + ":00",
                          endTime: createForm.endTime + ":00",
                          maxParticipants: parseInt(createForm.maxParticipants),
                          notes: createForm.notes || undefined,
                        })}>
                        {createSlotMutation.isPending ? "Creating…" : "Create Session"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Block time */}
                <Dialog open={blockOpen} onOpenChange={setBlockOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50"><Ban className="w-4 h-4 mr-1" />Block Time</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Block Time Off</DialogTitle></DialogHeader>
                    <p className="text-sm text-muted-foreground mb-3">Blocked times prevent students from booking those slots.</p>
                    <div className="space-y-3">
                      <div><Label>Reason / Label</Label><Input placeholder="e.g. Vacation, Personal, Court maintenance" value={blockForm.title} onChange={e => setBlockForm(f => ({ ...f, title: e.target.value }))} /></div>
                      <div><Label>Date</Label><Input type="date" value={blockForm.blockedDate} onChange={e => setBlockForm(f => ({ ...f, blockedDate: e.target.value }))} /></div>
                      <div className="flex items-center gap-2">
                        <Checkbox id="allday" checked={blockForm.isAllDay} onCheckedChange={v => setBlockForm(f => ({ ...f, isAllDay: !!v }))} />
                        <Label htmlFor="allday">All day</Label>
                      </div>
                      {!blockForm.isAllDay && (
                        <div className="grid grid-cols-2 gap-3">
                          <div><Label>From</Label><Input type="time" value={blockForm.startTime} onChange={e => setBlockForm(f => ({ ...f, startTime: e.target.value }))} /></div>
                          <div><Label>To</Label><Input type="time" value={blockForm.endTime} onChange={e => setBlockForm(f => ({ ...f, endTime: e.target.value }))} /></div>
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label>Affects</Label>
                        <div className="flex items-center gap-2"><Checkbox id="apl" checked={blockForm.affectsPrivateLessons} onCheckedChange={v => setBlockForm(f => ({ ...f, affectsPrivateLessons: !!v }))} /><Label htmlFor="apl">Private Lessons</Label></div>
                        <div className="flex items-center gap-2"><Checkbox id="a105" checked={blockForm.affects105Clinic} onCheckedChange={v => setBlockForm(f => ({ ...f, affects105Clinic: !!v }))} /><Label htmlFor="a105">105 Clinic</Label></div>
                      </div>
                      <Button className="w-full bg-red-600 hover:bg-red-700 text-white" disabled={blockTimeMutation.isPending || !blockForm.title}
                        onClick={() => blockTimeMutation.mutate({
                          title: blockForm.title,
                          blockedDate: blockForm.blockedDate,
                          startTime: blockForm.isAllDay ? undefined : (blockForm.startTime + ":00"),
                          endTime: blockForm.isAllDay ? undefined : (blockForm.endTime + ":00"),
                          isAllDay: blockForm.isAllDay,
                          affectsPrivateLessons: blockForm.affectsPrivateLessons,
                          affects105Clinic: blockForm.affects105Clinic,
                        })}>
                        {blockTimeMutation.isPending ? "Blocking…" : "Block This Time"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Week grid */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map(day => (
                <div key={day.toISOString()} className="text-center text-xs font-semibold text-muted-foreground py-1">
                  {DOW_LABELS[day.getDay()]}
                  <div className={`text-base font-bold mt-0.5 ${toInputDate(day) === toInputDate(new Date()) ? "text-primary" : "text-foreground"}`}>{day.getDate()}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map(day => {
                const key = toInputDate(day);
                const daySlots = slotsByDate[key] || [];
                const dayBlocks = blocksByDate[key] || [];
                const isToday = key === toInputDate(new Date());
                return (
                  <div key={key} className={`min-h-32 rounded-xl border p-1.5 space-y-1 ${isToday ? "border-primary/50 bg-primary/5" : "border-border bg-card"}`}>
                    {dayBlocks.map(b => (
                      <div key={b.id} className="bg-red-100 border border-red-300 rounded-lg p-1.5 text-xs">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-semibold text-red-700 truncate">{b.title}</span>
                          <button onClick={() => deleteBlockMutation.mutate({ id: b.id })} className="text-red-400 hover:text-red-600 shrink-0"><Trash2 className="w-3 h-3" /></button>
                        </div>
                        <div className="text-red-600 mt-0.5">{b.isAllDay ? "All day" : `${fmtTime(b.startTime)} – ${fmtTime(b.endTime)}`}</div>
                      </div>
                    ))}
                    {daySlots.map(s => {
                      const pct = s.maxParticipants > 0 ? (s.currentParticipants / s.maxParticipants) : 0;
                      const barColor = pct >= 1 ? "bg-red-500" : pct >= 0.75 ? "bg-amber-500" : "bg-green-500";
                      return (
                        <div key={s.id} className={`rounded-lg border p-1.5 text-xs space-y-1 ${s.isAvailable ? "bg-blue-50 border-blue-200" : "bg-gray-100 border-gray-300 opacity-60"}`}>
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-semibold text-blue-800 leading-tight truncate">{s.title || s.programName || s.programType}</span>
                            <div className="flex gap-0.5 shrink-0">
                              <button onClick={() => setEnrolleeSlotId(s.id)} className="text-blue-400 hover:text-blue-700"><Eye className="w-3 h-3" /></button>
                              <button onClick={() => setEditSlot(s)} className="text-blue-400 hover:text-blue-700"><Edit3 className="w-3 h-3" /></button>
                              <button onClick={() => { if (confirm("Delete this session?")) deleteSlotMutation.mutate({ id: s.id }); }} className="text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
                            </div>
                          </div>
                          <div className="text-blue-600">{fmtTime(s.startTime)} – {fmtTime(s.endTime)}</div>
                          <div className="flex items-center gap-1">
                            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(100, pct * 100)}%` }} />
                            </div>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">{s.currentParticipants}/{s.maxParticipants}</span>
                          </div>
                          {s.isFull && <Badge className="bg-red-100 text-red-700 text-[10px] px-1 py-0">FULL</Badge>}
                        </div>
                      );
                    })}
                    {daySlots.length === 0 && dayBlocks.length === 0 && (
                      <div className="text-[10px] text-muted-foreground text-center pt-4 opacity-50">—</div>
                    )}
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* ── ALL SESSIONS TAB ─────────────────────────────────────────── */}
          <TabsContent value="list">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5 text-primary" />All Sessions (Next 60 Days)</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {!scheduleData?.slots?.length ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <Calendar className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p>No sessions scheduled yet.</p>
                    <p className="text-sm mt-1">Use "Generate 105 Clinic Sessions" or "Add Session" to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {scheduleData.slots.map(s => {
                      const spotsLeft = s.maxParticipants - s.currentParticipants;
                      return (
                        <div key={s.id} className="flex flex-col md:flex-row md:items-center justify-between p-3 border border-border rounded-xl gap-3 hover:bg-muted/20 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm">{s.title || s.programName || s.programType}</span>
                              {s.isFull ? <Badge className="bg-red-100 text-red-700 text-xs">Full</Badge> : <Badge className="bg-green-100 text-green-700 text-xs">{spotsLeft} spots left</Badge>}
                              {!s.isAvailable && <Badge className="bg-gray-100 text-gray-600 text-xs">Hidden</Badge>}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {fmtDate(s.slotDate as any)} · {fmtTime(s.startTime)} – {fmtTime(s.endTime)} · {s.currentParticipants}/{s.maxParticipants} enrolled
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEnrolleeSlotId(s.id)}><Eye className="w-3 h-3 mr-1" />Roster</Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditSlot(s)}><Edit3 className="w-3 h-3 mr-1" />Edit</Button>
                            <Button size="sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 h-7 text-xs"
                              onClick={() => { if (confirm("Delete this session?")) deleteSlotMutation.mutate({ id: s.id }); }}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── BLOCKED TIMES TAB ────────────────────────────────────────── */}
          <TabsContent value="blocked">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <CardTitle className="flex items-center gap-2"><Ban className="w-5 h-5 text-red-500" />Blocked Times</CardTitle>
                  <Dialog open={blockOpen} onOpenChange={setBlockOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white"><Plus className="w-4 h-4 mr-1" />Block Time</Button>
                    </DialogTrigger>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {!scheduleData?.blocked?.length ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <Ban className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p>No blocked times. You're wide open!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {scheduleData.blocked.map(b => (
                      <div key={b.id} className="flex items-center justify-between p-3 border border-red-200 bg-red-50 rounded-xl gap-3">
                        <div>
                          <div className="font-semibold text-red-800 text-sm">{b.title}</div>
                          <div className="text-xs text-red-600 mt-0.5">
                            {fmtDate(b.blockedDate as any)} · {b.isAllDay ? "All day" : `${fmtTime(b.startTime)} – ${fmtTime(b.endTime)}`}
                            {" · "}Affects: {[b.affectsPrivateLessons && "Private Lessons", b.affects105Clinic && "105 Clinic"].filter(Boolean).join(", ")}
                          </div>
                        </div>
                        <Button size="sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-100 h-7 text-xs shrink-0"
                          onClick={() => deleteBlockMutation.mutate({ id: b.id })}>
                          <Trash2 className="w-3 h-3 mr-1" />Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Edit Slot Dialog ─────────────────────────────────────────────────── */}
      {editSlot && (
        <Dialog open={!!editSlot} onOpenChange={open => { if (!open) setEditSlot(null); }}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Edit Session</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Label</Label><Input value={editSlot.title || ""} onChange={e => setEditSlot((s: any) => ({ ...s, title: e.target.value }))} /></div>
              <div><Label>Max Participants</Label><Input type="number" value={editSlot.maxParticipants} onChange={e => setEditSlot((s: any) => ({ ...s, maxParticipants: parseInt(e.target.value) }))} /></div>
              <div><Label>Notes</Label><Input value={editSlot.notes || ""} onChange={e => setEditSlot((s: any) => ({ ...s, notes: e.target.value }))} /></div>
              <div className="flex items-center gap-2">
                <Checkbox id="avail" checked={editSlot.isAvailable} onCheckedChange={v => setEditSlot((s: any) => ({ ...s, isAvailable: !!v }))} />
                <Label htmlFor="avail">Visible to students (available for booking)</Label>
              </div>
              <Button className="w-full bg-primary text-primary-foreground" disabled={updateSlotMutation.isPending}
                onClick={() => updateSlotMutation.mutate({
                  id: editSlot.id,
                  title: editSlot.title || undefined,
                  maxParticipants: editSlot.maxParticipants,
                  isAvailable: editSlot.isAvailable,
                  notes: editSlot.notes || undefined,
                })}>
                {updateSlotMutation.isPending ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Enrollees Dialog ─────────────────────────────────────────────────── */}
      {enrolleeSlotId !== null && (
        <Dialog open={enrolleeSlotId !== null} onOpenChange={open => { if (!open) setEnrolleeSlotId(null); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-primary" />Session Roster</DialogTitle>
            </DialogHeader>
            {!enrollees || enrollees.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p>No one enrolled yet.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {enrollees.map((e, i) => (
                  <div key={e.bookingId} className="flex items-center justify-between p-3 border border-border rounded-xl">
                    <div>
                      <div className="font-semibold text-sm">{e.studentName || "Unknown"}</div>
                      <div className="text-xs text-muted-foreground">{e.studentEmail}{e.studentPhone && ` · ${e.studentPhone}`}</div>
                    </div>
                    <Badge className={e.status === "confirmed" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}>{e.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
