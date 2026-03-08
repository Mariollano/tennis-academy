import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Mail, Users, Send, Sparkles, RefreshCw, Trash2,
  CheckCircle, Clock, AlertCircle, TrendingUp, Eye, Save, ArrowRight
} from "lucide-react";

export default function AdminNewsletter() {
  const { user } = useAuth();
  const [subject, setSubject] = useState("");
  const [headline, setHeadline] = useState("");
  const [body, setBody] = useState("");
  const [tennisTip, setTennisTip] = useState("");
  const [mentalTip, setMentalTip] = useState("");
  const [winnerSpotlight, setWinnerSpotlight] = useState("");
  const [aiContext, setAiContext] = useState("");
  const [draftId, setDraftId] = useState<number | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState("compose");

  const utils = trpc.useUtils();

  const { data: newsletters = [], refetch: refetchList } = trpc.newsletter.list.useQuery();
  const { data: countData } = trpc.newsletter.getSubscriberCount.useQuery();
  const subscriberCount = countData?.count ?? 0;

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createMutation = trpc.newsletter.create.useMutation({
    onSuccess: (data) => {
      setDraftId(data.id);
      toast.success("✅ Draft saved! ID #" + data.id);
      refetchList();
    },
    onError: (err: any) => toast.error("Save failed: " + (err.message || "Unknown error")),
  });

  const updateMutation = trpc.newsletter.update.useMutation({
    onSuccess: () => {
      toast.success("✅ Draft updated!");
      refetchList();
    },
    onError: (err: any) => toast.error("Update failed: " + (err.message || "Unknown error")),
  });

  const sendMutation = trpc.newsletter.send.useMutation({
    onSuccess: (data) => {
      toast.success(`🎉 Newsletter sent to ${data.sent} students!`);
      // Reset form
      setDraftId(null);
      setSubject(""); setHeadline(""); setBody("");
      setTennisTip(""); setMentalTip(""); setWinnerSpotlight("");
      setPreviewHtml(null); setShowPreview(false);
      refetchList();
      setActiveTab("history");
    },
    onError: (err: any) => toast.error("Send failed: " + (err.message || "Unknown error")),
  });

  const deleteMutation = trpc.newsletter.delete.useMutation({
    onSuccess: () => { toast.success("Draft deleted"); refetchList(); },
    onError: (err: any) => toast.error(err.message),
  });

  const aiGenerateMutation = trpc.newsletter.aiGenerate.useMutation({
    onSuccess: (data: any) => {
      if (data.subject) setSubject(data.subject);
      if (data.headline) setHeadline(data.headline);
      if (data.body) setBody(data.body);
      if (data.tennisTip) setTennisTip(data.tennisTip);
      if (data.mentalTip) setMentalTip(data.mentalTip);
      if (data.winnerSpotlight) setWinnerSpotlight(data.winnerSpotlight);
      toast.success("✨ AI-generated newsletter is ready! Review and save below.");
    },
    onError: (err: any) => toast.error("AI generation failed: " + (err.message || "Unknown error")),
  });

  const previewQuery = trpc.newsletter.preview.useQuery(
    { id: draftId! },
    { enabled: false }
  );

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSaveDraft = () => {
    if (!subject.trim()) {
      toast.error("Please enter a subject line before saving.");
      return;
    }
    if (!body.trim()) {
      toast.error("Please enter some body content before saving.");
      return;
    }

    if (draftId) {
      // Update existing draft
      updateMutation.mutate({
        id: draftId,
        subject, headline, body, tennisTip, mentalTip, winnerSpotlight, includeSchedule: true,
      });
    } else {
      // Create new draft
      createMutation.mutate({
        subject, headline, body, tennisTip, mentalTip, winnerSpotlight, includeSchedule: true,
      });
    }
  };

  const handlePreview = async () => {
    // Save first if needed
    if (!draftId) {
      if (!subject.trim() || !body.trim()) {
        toast.error("Please fill in Subject and Body before previewing.");
        return;
      }
      try {
        const result = await createMutation.mutateAsync({
          subject, headline, body, tennisTip, mentalTip, winnerSpotlight, includeSchedule: true,
        });
        // Fetch preview for new draft
        const preview = await utils.newsletter.preview.fetch({ id: result.id });
        setPreviewHtml(preview.html);
        setShowPreview(true);
      } catch {
        // error already shown by mutation
      }
    } else {
      try {
        const preview = await utils.newsletter.preview.fetch({ id: draftId });
        setPreviewHtml(preview.html);
        setShowPreview(true);
      } catch (e: any) {
        toast.error("Preview failed: " + e.message);
      }
    }
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error("Please fill in Subject and Body before sending.");
      return;
    }
    if (subscriberCount === 0) {
      toast.error("No subscribers found. Students need to have accounts to receive newsletters.");
      return;
    }

    let idToSend = draftId;

    // Save draft first if not saved yet
    if (!idToSend) {
      try {
        const result = await createMutation.mutateAsync({
          subject, headline, body, tennisTip, mentalTip, winnerSpotlight, includeSchedule: true,
        });
        idToSend = result.id;
      } catch {
        return; // error already shown
      }
    } else {
      // Update the existing draft with latest content
      try {
        await updateMutation.mutateAsync({
          id: idToSend,
          subject, headline, body, tennisTip, mentalTip, winnerSpotlight, includeSchedule: true,
        });
      } catch {
        return;
      }
    }

    // Now send
    sendMutation.mutate({ id: idToSend });
  };

  const loadDraft = (nl: any) => {
    setDraftId(nl.id);
    setSubject(nl.subject || "");
    setHeadline(nl.headline || "");
    setBody(nl.body || "");
    setTennisTip(nl.tennisTip || "");
    setMentalTip(nl.mentalTip || "");
    setWinnerSpotlight(nl.winnerSpotlight || "");
    setActiveTab("compose");
    setShowPreview(false);
    toast.success("Draft loaded into composer.");
  };

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold">Admin access required</h2>
        </div>
      </div>
    );
  }

  const sentNewsletters = newsletters.filter((n: any) => n.status === "sent");
  const draftNewsletters = newsletters.filter((n: any) => n.status === "draft");
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isSending = sendMutation.isPending;
  const isGenerating = aiGenerateMutation.isPending;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0f1f5c] to-[#1a3a8f] text-white py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Mail className="h-6 w-6 text-[#ccff00]" />
            <h1 className="text-3xl font-black">Newsletter Manager</h1>
          </div>
          <p className="text-white/60">Send weekly updates, tips, and schedules to your students.</p>
          <div className="flex gap-4 mt-6 flex-wrap">
            <div className="bg-white/10 rounded-xl px-5 py-3">
              <div className="text-2xl font-black text-[#ccff00]">{subscriberCount}</div>
              <div className="text-xs text-white/60">Students (recipients)</div>
            </div>
            <div className="bg-white/10 rounded-xl px-5 py-3">
              <div className="text-2xl font-black text-[#ccff00]">{sentNewsletters.length}</div>
              <div className="text-xs text-white/60">Newsletters Sent</div>
            </div>
            <div className="bg-white/10 rounded-xl px-5 py-3">
              <div className="text-2xl font-black text-[#ccff00]">{draftNewsletters.length}</div>
              <div className="text-xs text-white/60">Drafts</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="compose" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Compose
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              History ({newsletters.length})
            </TabsTrigger>
          </TabsList>

          {/* ── Compose Tab ─────────────────────────────────────────────────── */}
          <TabsContent value="compose">
            {/* Draft indicator */}
            {draftId && (
              <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
                <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                <span className="text-sm text-green-700 font-medium">Draft #{draftId} saved — editing in progress</span>
              </div>
            )}

            <div className="grid md:grid-cols-5 gap-8">
              {/* Left: Form */}
              <div className="md:col-span-3 space-y-6">

                {/* AI Generate */}
                <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    <h3 className="font-bold">AI Newsletter Generator</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Optionally describe a theme, then click Generate — AI will fill all fields for you.
                  </p>
                  <Textarea
                    value={aiContext}
                    onChange={(e) => setAiContext(e.target.value)}
                    placeholder="Optional: e.g. backhand technique focus, summer camp registration reminder..."
                    rows={2}
                    className="mb-3"
                    disabled={isGenerating}
                  />
                  <Button
                    onClick={() => aiGenerateMutation.mutate({ context: aiContext })}
                    disabled={isGenerating}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    type="button"
                  >
                    {isGenerating ? (
                      <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Generating (takes ~10s)...</>
                    ) : (
                      <><Sparkles className="h-4 w-4 mr-2" /> Generate with AI</>
                    )}
                  </Button>
                </div>

                {/* Fields */}
                <div className="space-y-4">
                  <div>
                    <Label className="font-bold mb-1.5 block">
                      Subject Line <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="🎾 This Week at RI Tennis Academy"
                    />
                    {!subject.trim() && (
                      <p className="text-xs text-amber-600 mt-1">Required to save or send</p>
                    )}
                  </div>
                  <div>
                    <Label className="font-bold mb-1.5 block">Headline</Label>
                    <Input
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      placeholder="Bold inspiring headline shown at the top of the email"
                    />
                  </div>
                  <div>
                    <Label className="font-bold mb-1.5 block">
                      Body <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="Main newsletter content from Coach Mario — what's happening this week, announcements, etc."
                      rows={6}
                    />
                    {!body.trim() && (
                      <p className="text-xs text-amber-600 mt-1">Required to save or send</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="font-bold mb-1.5 block">🎾 Tennis Tip</Label>
                      <Textarea
                        value={tennisTip}
                        onChange={(e) => setTennisTip(e.target.value)}
                        placeholder="Technique tip of the week..."
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label className="font-bold mb-1.5 block">🧠 Mental Tip</Label>
                      <Textarea
                        value={mentalTip}
                        onChange={(e) => setMentalTip(e.target.value)}
                        placeholder="Delete Fear mental performance tip..."
                        rows={3}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="font-bold mb-1.5 block">🏆 Player Spotlight</Label>
                    <Textarea
                      value={winnerSpotlight}
                      onChange={(e) => setWinnerSpotlight(e.target.value)}
                      placeholder="Celebrate a student achievement this week..."
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              {/* Right: Actions sidebar */}
              <div className="md:col-span-2 space-y-4">
                <div className="bg-muted/50 rounded-2xl p-5 sticky top-24 space-y-3">
                  <h3 className="font-bold text-base">Actions</h3>

                  {/* Subscriber info */}
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-amber-700 font-medium text-sm mb-0.5">
                      <Users className="h-4 w-4" />
                      {subscriberCount} students will receive this
                    </div>
                    <p className="text-xs text-muted-foreground">All registered students with accounts.</p>
                  </div>

                  {/* Step 1: Save Draft */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5 font-medium">Step 1 — Save your work</p>
                    <Button
                      onClick={handleSaveDraft}
                      disabled={isSaving || !subject.trim() || !body.trim()}
                      variant="outline"
                      className="w-full"
                      type="button"
                    >
                      {isSaving ? (
                        <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                      ) : (
                        <><Save className="h-4 w-4 mr-2" /> {draftId ? "Update Draft" : "Save as Draft"}</>
                      )}
                    </Button>
                  </div>

                  {/* Step 2: Preview */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5 font-medium">Step 2 — Preview email</p>
                    <Button
                      onClick={handlePreview}
                      disabled={isSaving || !subject.trim() || !body.trim()}
                      variant="outline"
                      className="w-full"
                      type="button"
                    >
                      <Eye className="h-4 w-4 mr-2" /> Preview Email
                    </Button>
                  </div>

                  {/* Step 3: Send */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5 font-medium">Step 3 — Send to all students</p>
                    <Button
                      onClick={handleSend}
                      disabled={isSending || isSaving || !subject.trim() || !body.trim()}
                      size="lg"
                      className="w-full bg-[#1a3a8f] hover:bg-[#0f1f5c] text-white font-bold"
                      type="button"
                    >
                      {isSending ? (
                        <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Sending to {subscriberCount} students...</>
                      ) : (
                        <><Send className="h-4 w-4 mr-2" /> Send to {subscriberCount} Students <ArrowRight className="h-4 w-4 ml-1" /></>
                      )}
                    </Button>
                  </div>

                  {draftId && (
                    <p className="text-xs text-muted-foreground text-center">Draft #{draftId} — auto-saved</p>
                  )}

                  {/* Validation hints */}
                  {(!subject.trim() || !body.trim()) && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                      <p className="text-xs text-amber-700 font-medium">To enable save &amp; send:</p>
                      <ul className="text-xs text-amber-600 mt-1 space-y-0.5">
                        {!subject.trim() && <li>• Fill in the Subject Line</li>}
                        {!body.trim() && <li>• Fill in the Body</li>}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Preview panel */}
            {showPreview && previewHtml && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <Eye className="h-5 w-5" /> Email Preview
                  </h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>
                    Close Preview
                  </Button>
                </div>
                <div className="border border-border rounded-2xl overflow-hidden">
                  <iframe
                    srcDoc={previewHtml}
                    className="w-full"
                    style={{ height: "600px", border: "none" }}
                    title="Newsletter Preview"
                  />
                </div>
              </div>
            )}
          </TabsContent>

          {/* ── History Tab ──────────────────────────────────────────────────── */}
          <TabsContent value="history">
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="p-5 border-b border-border">
                <h3 className="font-bold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  All Newsletters ({newsletters.length})
                </h3>
              </div>
              {newsletters.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No newsletters yet. Compose your first one above!</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {newsletters.map((item: any) => (
                    <div key={item.id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm truncate">{item.subject}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {item.status === "sent"
                              ? `Sent ${new Date(item.sentAt).toLocaleString()} · ${item.recipientCount ?? 0} recipients`
                              : `Draft created ${new Date(item.createdAt).toLocaleString()}`}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant={item.status === "sent" ? "default" : "secondary"}>
                            {item.status === "sent" ? (
                              <><CheckCircle className="h-3 w-3 mr-1" />Sent</>
                            ) : (
                              <><Clock className="h-3 w-3 mr-1" />Draft</>
                            )}
                          </Badge>
                          {item.status === "draft" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-7 px-2"
                                onClick={() => loadDraft(item)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 w-7 p-0"
                                onClick={() => deleteMutation.mutate({ id: item.id })}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
