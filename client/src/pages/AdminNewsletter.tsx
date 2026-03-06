import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Mail, Send, Sparkles, Eye, Users, Clock, Trash2, Plus,
  Trophy, Brain, Dumbbell, Calendar, RefreshCw
} from "lucide-react";

interface DraftForm {
  id?: number;
  subject: string;
  headline: string;
  bodyHtml: string;
  tennisTip: string;
  mentalTip: string;
  winnerSpotlight: string;
  programScheduleHtml: string;
}

const EMPTY_FORM: DraftForm = {
  subject: "",
  headline: "",
  bodyHtml: "",
  tennisTip: "",
  mentalTip: "",
  winnerSpotlight: "",
  programScheduleHtml: "",
};

export default function AdminNewsletter() {
  const [tab, setTab] = useState<"compose" | "history" | "subscribers">("compose");
  const [form, setForm] = useState<DraftForm>(EMPTY_FORM);
  const [edition, setEdition] = useState<"tuesday" | "friday" | "special">("tuesday");
  const [customNote, setCustomNote] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const { data: newsletters = [], isLoading: loadingList } = trpc.newsletter.list.useQuery();
  const { data: subData } = trpc.newsletter.subscriberCount.useQuery();
  const { data: subscribers = [] } = trpc.newsletter.listSubscribers.useQuery();

  const saveDraft = trpc.newsletter.saveDraft.useMutation({
    onSuccess: (data) => {
      setForm(f => ({ ...f, id: data.id }));
      toast.success("Draft saved successfully.");
      utils.newsletter.list.invalidate();
    },
    onError: (e) => toast.error(`Save failed: ${e.message}`),
  });

  const sendMutation = trpc.newsletter.send.useMutation({
    onSuccess: (data) => {
      toast.success(`Newsletter sent! Delivered to ${data.sent} subscriber${data.sent !== 1 ? "s" : ""}.${data.failed ? ` (${data.failed} failed)` : ""}`);
      setForm(EMPTY_FORM);
      utils.newsletter.list.invalidate();
    },
    onError: (e) => toast.error(`Send failed: ${e.message}`),
  });

  const deleteMutation = trpc.newsletter.delete.useMutation({
    onSuccess: () => {
      toast.success("Draft deleted.");
      utils.newsletter.list.invalidate();
    },
    onError: (e) => toast.error(`Delete failed: ${e.message}`),
  });

  const getPreviewHtml = trpc.newsletter.getPreviewHtml.useMutation({
    onSuccess: (data) => {
      setPreviewHtml(data.html);
      setShowPreview(true);
    },
    onError: (e) => toast.error(`Preview failed: ${e.message}`),
  });

  const autoGenerate = trpc.newsletter.autoGenerate.useMutation({
    onSuccess: (data) => {
      setForm(f => ({
        ...f,
        subject: data.subject || f.subject,
        headline: data.headline || f.headline,
        tennisTip: data.tennisTip || f.tennisTip,
        mentalTip: data.mentalTip || f.mentalTip,
        bodyHtml: data.bodyIntro || f.bodyHtml,
        programScheduleHtml: data.programScheduleHtml || f.programScheduleHtml,
      }));
      toast.success("Content generated! Review and edit before sending.");
    },
    onError: (e) => toast.error(`Generation failed: ${e.message}`),
  });

  const handlePreview = () => {
    getPreviewHtml.mutate({
      subject: form.subject,
      headline: form.headline,
      bodyHtml: form.bodyHtml,
      tennisTip: form.tennisTip,
      mentalTip: form.mentalTip,
      winnerSpotlight: form.winnerSpotlight,
      programScheduleHtml: form.programScheduleHtml || undefined,
    });
  };

  const handleSaveDraft = () => {
    if (!form.subject.trim() || !form.bodyHtml.trim()) {
      toast.error("Subject and body are required.");
      return;
    }
    saveDraft.mutate(form);
  };

  const handleSend = () => {
    if (!form.id) {
      toast.error("Please save the draft before sending.");
      return;
    }
    if (!confirm(`Send this newsletter to ${subData?.count ?? 0} subscriber${(subData?.count ?? 0) !== 1 ? "s" : ""}?`)) return;
    sendMutation.mutate({ id: form.id });
  };

  const loadDraft = (nl: typeof newsletters[0]) => {
    setForm({
      id: nl.id,
      subject: nl.subject,
      headline: nl.headline || "",
      bodyHtml: nl.bodyHtml,
      tennisTip: nl.tennisTip || "",
      mentalTip: nl.mentalTip || "",
      winnerSpotlight: nl.winnerSpotlight || "",
      programScheduleHtml: nl.programScheduleHtml || "",
    });
    setTab("compose");
  };

  const subscriberCount = subData?.count ?? 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Mail className="w-8 h-8 text-blue-600" />
            Newsletter Manager
          </h1>
          <p className="text-muted-foreground mt-1">Compose, preview, and send newsletters to your students</p>
        </div>
        <div className="flex items-center gap-3">
          <Card className="px-4 py-2 flex items-center gap-2 bg-blue-50 border-blue-200">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-blue-700">{subscriberCount}</span>
            <span className="text-blue-600 text-sm">subscribers</span>
          </Card>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList className="mb-6">
          <TabsTrigger value="compose" className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Compose
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Clock className="w-4 h-4" /> History ({newsletters.length})
          </TabsTrigger>
          <TabsTrigger value="subscribers" className="flex items-center gap-2">
            <Users className="w-4 h-4" /> Subscribers ({subscriberCount})
          </TabsTrigger>
        </TabsList>

        {/* ── Compose Tab ── */}
        <TabsContent value="compose">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main form */}
            <div className="lg:col-span-2 space-y-5">
              {/* AI Generate */}
              <Card className="border-purple-200 bg-purple-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-purple-700">
                    <Sparkles className="w-4 h-4" /> AI Auto-Generate Content
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    {(["tuesday", "friday", "special"] as const).map(e => (
                      <button
                        key={e}
                        onClick={() => setEdition(e)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          edition === e
                            ? "bg-purple-600 text-white"
                            : "bg-white text-purple-600 border border-purple-300 hover:bg-purple-100"
                        }`}
                      >
                        {e.charAt(0).toUpperCase() + e.slice(1)}
                      </button>
                    ))}
                  </div>
                  <Input
                    placeholder="Optional: winner to spotlight this week (e.g. 'Sarah W. won her first tournament!')"
                    value={customNote}
                    onChange={e => setCustomNote(e.target.value)}
                    className="bg-white"
                  />
                  <Button
                    onClick={() => autoGenerate.mutate({ edition, customNote: customNote || undefined, winnerSpotlight: form.winnerSpotlight || undefined })}
                    disabled={autoGenerate.isPending}
                    className="bg-purple-600 hover:bg-purple-700 text-white w-full"
                  >
                    {autoGenerate.isPending ? (
                      <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Generating…</>
                    ) : (
                      <><Sparkles className="w-4 h-4 mr-2" /> Generate with AI</>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Subject & Headline */}
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1 block">Subject Line *</label>
                  <Input
                    placeholder="e.g. 🎾 RI Tennis Academy is Back – Programs Start March 16!"
                    value={form.subject}
                    onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1 block">Headline</label>
                  <Input
                    placeholder="e.g. Spring Season Starts March 16 – All Programs Returning!"
                    value={form.headline}
                    onChange={e => setForm(f => ({ ...f, headline: e.target.value }))}
                  />
                </div>
              </div>

              {/* Body */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Newsletter Body *</label>
                <Textarea
                  placeholder="Write the main body of your newsletter here. You can use HTML tags for formatting."
                  value={form.bodyHtml}
                  onChange={e => setForm(f => ({ ...f, bodyHtml: e.target.value }))}
                  rows={6}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">Supports basic HTML: &lt;b&gt;, &lt;i&gt;, &lt;a href=""&gt;, &lt;br&gt;, &lt;p&gt;</p>
              </div>

              {/* Tips */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1 flex items-center gap-1.5">
                    <Dumbbell className="w-3.5 h-3.5 text-blue-600" /> Tennis Tip of the Week
                  </label>
                  <Textarea
                    placeholder="Share a practical tennis technique tip for this week…"
                    value={form.tennisTip}
                    onChange={e => setForm(f => ({ ...f, tennisTip: e.target.value }))}
                    rows={4}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1 flex items-center gap-1.5">
                    <Brain className="w-3.5 h-3.5 text-green-600" /> Mental Tip of the Week
                  </label>
                  <Textarea
                    placeholder="Share a mental performance tip based on your Delete Fear philosophy…"
                    value={form.mentalTip}
                    onChange={e => setForm(f => ({ ...f, mentalTip: e.target.value }))}
                    rows={4}
                  />
                </div>
              </div>

              {/* Winner Spotlight */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-yellow-600" /> Winner Spotlight
                </label>
                <Textarea
                  placeholder="Shout out a student's achievement this week! e.g. 'Congratulations to Sarah W. who won her first USTA tournament this weekend!'"
                  value={form.winnerSpotlight}
                  onChange={e => setForm(f => ({ ...f, winnerSpotlight: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* Program Schedule */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Program Schedule & Pricing
                </label>
                <p className="text-xs text-muted-foreground mb-2">Leave blank to use the default schedule table, or paste custom HTML.</p>
                <Textarea
                  placeholder="Leave blank to auto-include the standard program schedule table…"
                  value={form.programScheduleHtml}
                  onChange={e => setForm(f => ({ ...f, programScheduleHtml: e.target.value }))}
                  rows={3}
                  className="font-mono text-sm"
                />
              </div>
            </div>

            {/* Sidebar actions */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handlePreview}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {showPreview ? "Hide Preview" : "Preview Email"}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleSaveDraft}
                    disabled={saveDraft.isPending}
                  >
                    {saveDraft.isPending ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Save Draft
                    {form.id ? <Badge variant="secondary" className="ml-2">#{form.id}</Badge> : null}
                  </Button>
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleSend}
                    disabled={sendMutation.isPending || !form.id}
                  >
                    {sendMutation.isPending ? (
                      <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Sending…</>
                    ) : (
                      <><Send className="w-4 h-4 mr-2" /> Send to {subscriberCount} subscribers</>
                    )}
                  </Button>
                  {!form.id && (
                    <p className="text-xs text-muted-foreground text-center">Save draft first to enable sending</p>
                  )}
                  <Button
                    variant="ghost"
                    className="w-full text-muted-foreground"
                    onClick={() => setForm(EMPTY_FORM)}
                  >
                    Clear Form
                  </Button>
                </CardContent>
              </Card>

              {/* Best practices */}
              <Card className="bg-amber-50 border-amber-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-amber-800">Newsletter Best Practices</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-amber-700 space-y-1.5">
                  <p>✓ Keep subject lines under 50 characters</p>
                  <p>✓ Send Tuesday & Friday for best open rates</p>
                  <p>✓ Always include a clear call-to-action</p>
                  <p>✓ Personalize with student achievements</p>
                  <p>✓ Keep body text concise (150–300 words)</p>
                  <p>✓ Include schedule & pricing every edition</p>
                  <p>✓ Celebrate wins to build community</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Preview */}
          {showPreview && previewHtml && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Eye className="w-5 h-5" /> Email Preview
                <span className="text-sm font-normal text-muted-foreground ml-2">(exact email rendering)</span>
              </h3>
              <div className="border rounded-xl overflow-hidden shadow-lg">
                <div className="bg-gray-100 px-4 py-2 text-sm text-gray-600 border-b flex items-center justify-between">
                  <span><strong>Subject:</strong> {form.subject || "(no subject)"}</span>
                  <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-gray-600 text-xs">✕ Close</button>
                </div>
                <iframe
                  srcDoc={previewHtml}
                  style={{ width: "100%", height: "1200px", border: "none", background: "#e8eaf0" }}
                  title="Newsletter Preview"
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── History Tab ── */}
        <TabsContent value="history">
          {loadingList ? (
            <div className="text-center py-12 text-muted-foreground">Loading newsletters…</div>
          ) : newsletters.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No newsletters yet. Compose your first one!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {newsletters.map(nl => (
                <Card key={nl.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={nl.status === "sent" ? "default" : "secondary"}>
                          {nl.status}
                        </Badge>
                        {nl.isAutoGenerated && (
                          <Badge variant="outline" className="text-purple-600 border-purple-300">
                            <Sparkles className="w-3 h-3 mr-1" /> AI
                          </Badge>
                        )}
                        {nl.status === "sent" && nl.recipientCount > 0 && (
                          <span className="text-xs text-muted-foreground">{nl.recipientCount} recipients</span>
                        )}
                      </div>
                      <p className="font-semibold text-sm truncate">{nl.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        {nl.status === "sent" && nl.sentAt
                          ? `Sent ${new Date(nl.sentAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}`
                          : `Created ${new Date(nl.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {nl.status === "draft" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => loadDraft(nl)}>
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => deleteMutation.mutate({ id: nl.id })}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      {nl.status === "sent" && (
                        <Button size="sm" variant="outline" onClick={() => loadDraft(nl)}>
                          Duplicate
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Subscribers Tab ── */}
        <TabsContent value="subscribers">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              {subscriberCount} active subscriber{subscriberCount !== 1 ? "s" : ""}. Students who book are automatically added.
            </p>
          </div>
          {subscribers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No subscribers yet. They'll be added automatically when students book.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Name</th>
                    <th className="text-left px-4 py-3 font-semibold">Email</th>
                    <th className="text-left px-4 py-3 font-semibold">Source</th>
                    <th className="text-left px-4 py-3 font-semibold">Subscribed</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((s, i) => (
                    <tr key={s.id} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                      <td className="px-4 py-3">{s.name || "—"}</td>
                      <td className="px-4 py-3 text-blue-600">{s.email}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs">{s.source || "manual"}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(s.subscribedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Build a simplified preview HTML for the in-page preview
function buildPreviewHtml(form: DraftForm): string {
  const tennisTip = form.tennisTip
    ? `<div style="background:#e8f4fd;border-left:4px solid #1a3a8f;padding:12px 16px;margin:16px 0;border-radius:0 6px 6px 0;">
        <strong style="color:#1a3a8f;font-size:12px;text-transform:uppercase;letter-spacing:1px;">🎾 Tennis Tip of the Week</strong>
        <p style="margin:6px 0 0;color:#333;">${form.tennisTip}</p>
       </div>` : "";

  const mentalTip = form.mentalTip
    ? `<div style="background:#f0f9f0;border-left:4px solid #22c55e;padding:12px 16px;margin:16px 0;border-radius:0 6px 6px 0;">
        <strong style="color:#166534;font-size:12px;text-transform:uppercase;letter-spacing:1px;">🧠 Mental Tip of the Week</strong>
        <p style="margin:6px 0 0;color:#333;">${form.mentalTip}</p>
       </div>` : "";

  const winner = form.winnerSpotlight
    ? `<div style="background:#fffbeb;border:2px solid #f59e0b;padding:12px 16px;margin:16px 0;border-radius:8px;">
        <strong style="color:#92400e;font-size:12px;text-transform:uppercase;letter-spacing:1px;">🏆 Winner Spotlight</strong>
        <p style="margin:6px 0 0;color:#333;">${form.winnerSpotlight}</p>
       </div>` : "";

  const schedule = form.programScheduleHtml
    ? `<div style="margin:16px 0;"><strong>📅 Programs & Schedule</strong>${form.programScheduleHtml}</div>`
    : "";

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;">
      <div style="background:linear-gradient(135deg,#1a3a8f,#0f2460);padding:24px;border-radius:8px 8px 0 0;text-align:center;color:#fff;">
        <h2 style="margin:0 0 4px;">RI TENNIS ACADEMY</h2>
        <p style="margin:0;opacity:0.7;font-size:13px;">Coach Mario Llano</p>
        ${form.headline ? `<div style="background:rgba(255,255,255,0.15);padding:10px 16px;border-radius:6px;margin-top:12px;"><strong>${form.headline}</strong></div>` : ""}
      </div>
      <div style="padding:24px;border:1px solid #eee;border-top:none;border-radius:0 0 8px 8px;">
        <div>${form.bodyHtml || "<em style='color:#aaa'>No body text yet…</em>"}</div>
        ${schedule}
        ${tennisTip}
        ${mentalTip}
        ${winner}
        <div style="text-align:center;margin-top:24px;">
          <a href="#" style="background:#1a3a8f;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold;">Book Your Session →</a>
        </div>
      </div>
    </div>`;
}
