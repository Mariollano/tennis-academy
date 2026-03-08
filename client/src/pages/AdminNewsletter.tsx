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
  CheckCircle, Clock, AlertCircle, TrendingUp, Eye
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

  const { data: newsletters = [], refetch: refetchList } = trpc.newsletter.list.useQuery();
  const { data: countData } = trpc.newsletter.getSubscriberCount.useQuery();
  const subscriberCount = countData?.count ?? 0;

  const createMutation = trpc.newsletter.create.useMutation({
    onSuccess: (data) => {
      setDraftId(data.id);
      toast.success("Draft saved!");
      refetchList();
    },
    onError: (err: any) => toast.error("Save failed: " + err.message),
  });

  const sendMutation = trpc.newsletter.send.useMutation({
    onSuccess: (data) => {
      toast.success(`Newsletter sent to ${data.sent} subscribers!`);
      setDraftId(null);
      setSubject(""); setHeadline(""); setBody("");
      setTennisTip(""); setMentalTip(""); setWinnerSpotlight("");
      refetchList();
    },
    onError: (err: any) => toast.error("Send failed: " + err.message),
  });

  const deleteMutation = trpc.newsletter.delete.useMutation({
    onSuccess: () => { toast.success("Draft deleted"); refetchList(); },
    onError: (err: any) => toast.error(err.message),
  });

  const aiGenerateMutation = trpc.newsletter.aiGenerate.useMutation({
    onSuccess: (data: any) => {
      setSubject(data.subject || "");
      setHeadline(data.headline || "");
      setBody(data.body || "");
      setTennisTip(data.tennisTip || "");
      setMentalTip(data.mentalTip || "");
      setWinnerSpotlight(data.winnerSpotlight || "");
      toast.success("AI-generated newsletter ready to review!");
    },
    onError: (err: any) => toast.error("Generation failed: " + err.message),
  });

  const previewMutation = trpc.newsletter.preview.useQuery(
    { id: draftId! },
    { enabled: false }
  );

  const handleSaveAndSend = async () => {
    if (!draftId) {
      // Create draft first, then send
      const result = await createMutation.mutateAsync({
        subject, headline, body, tennisTip, mentalTip, winnerSpotlight, includeSchedule: true
      });
      await sendMutation.mutateAsync({ id: result.id });
    } else {
      await sendMutation.mutateAsync({ id: draftId });
    }
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
          <div className="flex gap-6 mt-6">
            <div className="bg-white/10 rounded-xl px-5 py-3">
              <div className="text-2xl font-black text-[#ccff00]">{subscriberCount}</div>
              <div className="text-xs text-white/60">Opted-in Students</div>
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
        <Tabs defaultValue="compose">
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

          {/* Compose Tab */}
          <TabsContent value="compose">
            <div className="grid md:grid-cols-5 gap-8">
              <div className="md:col-span-3 space-y-6">
                {/* AI Generate */}
                <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    <h3 className="font-bold">AI Newsletter Generator</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Describe what you want to include and AI will write the newsletter for you.
                  </p>
                  <Textarea
                    value={aiContext}
                    onChange={(e) => setAiContext(e.target.value)}
                    placeholder="e.g. Weekly schedule update, tip about backhand technique, upcoming summer camp registration..."
                    rows={2}
                    className="mb-3"
                  />
                  <Button
                    onClick={() => aiGenerateMutation.mutate({ context: aiContext })}
                    disabled={aiGenerateMutation.isPending}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {aiGenerateMutation.isPending ? (
                      <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
                    ) : (
                      <><Sparkles className="h-4 w-4 mr-2" /> Generate with AI</>
                    )}
                  </Button>
                </div>

                {/* Fields */}
                <div className="space-y-4">
                  <div>
                    <Label className="font-bold mb-1.5 block">Subject Line *</Label>
                    <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="🎾 This Week at RI Tennis Academy" />
                  </div>
                  <div>
                    <Label className="font-bold mb-1.5 block">Headline</Label>
                    <Input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Bold inspiring headline" />
                  </div>
                  <div>
                    <Label className="font-bold mb-1.5 block">Body *</Label>
                    <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Main newsletter content from Coach Mario..." rows={5} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="font-bold mb-1.5 block">Tennis Tip</Label>
                      <Textarea value={tennisTip} onChange={(e) => setTennisTip(e.target.value)} placeholder="Technique tip..." rows={3} />
                    </div>
                    <div>
                      <Label className="font-bold mb-1.5 block">Mental Tip</Label>
                      <Textarea value={mentalTip} onChange={(e) => setMentalTip(e.target.value)} placeholder="Delete Fear tip..." rows={3} />
                    </div>
                  </div>
                  <div>
                    <Label className="font-bold mb-1.5 block">Player Spotlight</Label>
                    <Textarea value={winnerSpotlight} onChange={(e) => setWinnerSpotlight(e.target.value)} placeholder="Student achievement to celebrate..." rows={2} />
                  </div>
                </div>
              </div>

              {/* Actions sidebar */}
              <div className="md:col-span-2 space-y-4">
                <div className="bg-muted/50 rounded-2xl p-5 sticky top-24">
                  <h3 className="font-bold mb-4">Send Newsletter</h3>

                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-2 text-amber-600 font-medium text-sm mb-1">
                      <Users className="h-4 w-4" />
                      {subscriberCount} opted-in students
                    </div>
                    <p className="text-xs text-muted-foreground">All students with accounts will receive this newsletter.</p>
                  </div>

                  <div className="space-y-3">
                    <Button
                      onClick={() => createMutation.mutate({ subject, headline, body, tennisTip, mentalTip, winnerSpotlight, includeSchedule: true })}
                      disabled={createMutation.isPending || !subject.trim() || !body.trim()}
                      variant="outline"
                      className="w-full"
                    >
                      {createMutation.isPending ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
                      Save as Draft
                    </Button>

                    <Button
                      onClick={handleSaveAndSend}
                      disabled={sendMutation.isPending || createMutation.isPending || !subject.trim() || !body.trim()}
                      size="lg"
                      className="w-full bg-[#1a3a8f] hover:bg-[#0f1f5c] text-white font-bold"
                    >
                      {sendMutation.isPending ? (
                        <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Sending...</>
                      ) : (
                        <><Send className="h-4 w-4 mr-2" /> Send to {subscriberCount} Students</>
                      )}
                    </Button>
                  </div>

                  {draftId && (
                    <p className="text-xs text-muted-foreground mt-3 text-center">Draft ID #{draftId} saved</p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* History Tab */}
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
                              : `Created ${new Date(item.createdAt).toLocaleString()}`}
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
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => deleteMutation.mutate({ id: item.id })}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
