import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Tab = "compose" | "history" | "subscribers";

interface DraftData {
  id?: number;
  subject: string;
  headline: string;
  body: string;
  tennisTip: string;
  mentalTip: string;
  winnerSpotlight: string;
  includeSchedule: boolean;
}

const EMPTY_DRAFT: DraftData = {
  subject: "",
  headline: "",
  body: "",
  tennisTip: "",
  mentalTip: "",
  winnerSpotlight: "",
  includeSchedule: false,
};

export default function AdminNewsletter() {
  const [tab, setTab] = useState<Tab>("compose");
  const [draft, setDraft] = useState<DraftData>(EMPTY_DRAFT);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addName, setAddName] = useState("");
  const [bulkCsv, setBulkCsv] = useState("");
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [generateType, setGenerateType] = useState<"tuesday" | "friday" | "special">("tuesday");
  const [generateContext, setGenerateContext] = useState("");

  const utils = trpc.useUtils();

  // Queries
  const { data: subscriberCount } = trpc.newsletter.subscriberCount.useQuery();
  const { data: newsletterList, refetch: refetchList } = trpc.newsletter.list.useQuery();
  const { data: subscribers, refetch: refetchSubs } = trpc.newsletter.listSubscribers.useQuery();

  // Mutations
  const saveDraft = trpc.newsletter.saveDraft.useMutation({
    onSuccess: (data) => {
      setDraft((d) => ({ ...d, id: data.id }));
      toast.success("Draft saved");
      refetchList();
    },
    onError: (e) => toast.error(e.message),
  });

  const previewMut = trpc.newsletter.preview.useMutation({
    onSuccess: (data) => {
      setPreviewHtml(data.html);
      setShowPreview(true);
    },
    onError: (e) => toast.error(e.message),
  });

  const sendTest = trpc.newsletter.sendTest.useMutation({
    onSuccess: () => {
      toast.success(`Test email sent to ${testEmail}`);
      setShowTestDialog(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const sendToAll = trpc.newsletter.sendToAll.useMutation({
    onSuccess: (data) => {
      toast.success(`Newsletter sent to ${data.recipientCount} subscribers!`);
      setShowSendConfirm(false);
      setDraft(EMPTY_DRAFT);
      refetchList();
    },
    onError: (e) => toast.error(e.message),
  });

  const generate = trpc.newsletter.generate.useMutation({
    onSuccess: (data) => {
      setDraft((d) => ({
        ...d,
        subject: data.subject || d.subject,
        headline: data.headline || d.headline,
        body: data.body || d.body,
        tennisTip: data.tennisTip || d.tennisTip,
        mentalTip: data.mentalTip || d.mentalTip,
        winnerSpotlight: data.winnerSpotlight || d.winnerSpotlight,
      }));
      toast.success("Newsletter generated! Review and edit before sending.");
    },
    onError: (e) => toast.error(e.message),
  });

  const addSubscriber = trpc.newsletter.addSubscriber.useMutation({
    onSuccess: () => {
      toast.success("Subscriber added");
      setAddEmail("");
      setAddName("");
      refetchSubs();
    },
    onError: (e) => toast.error(e.message),
  });

  const bulkImport = trpc.newsletter.bulkImport.useMutation({
    onSuccess: (data) => {
      toast.success(`Import complete: ${data.added} added, ${data.skipped} skipped`);
      setShowBulkDialog(false);
      setBulkCsv("");
      refetchSubs();
    },
    onError: (e) => toast.error(e.message),
  });

  const unsubscribe = trpc.newsletter.unsubscribe.useMutation({
    onSuccess: () => { toast.success("Unsubscribed"); refetchSubs(); },
  });

  const deleteSub = trpc.newsletter.deleteSubscriber.useMutation({
    onSuccess: () => { toast.success("Deleted"); refetchSubs(); },
  });

  const deleteNewsletter = trpc.newsletter.delete.useMutation({
    onSuccess: () => { toast.success("Deleted"); refetchList(); },
  });

  function handleBulkImport() {
    const lines = bulkCsv.split("\n").map((l) => l.trim()).filter(Boolean);
    const subs = lines.map((line) => {
      const [email, name] = line.split(",").map((s) => s.trim());
      return { email, name: name || undefined };
    }).filter((s) => s.email && s.email.includes("@"));
    if (subs.length === 0) {
      toast.error("No valid emails found");
      return;
    }
    bulkImport.mutate({ subscribers: subs });
  }

  function loadDraft(nl: any) {
    setDraft({
      id: nl.id,
      subject: nl.subject || "",
      headline: nl.headline || "",
      body: nl.body || "",
      tennisTip: nl.tennisTip || "",
      mentalTip: nl.mentalTip || "",
      winnerSpotlight: nl.winnerSpotlight || "",
      includeSchedule: nl.includeSchedule || false,
    });
    setTab("compose");
      toast.success("Draft loaded");
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "compose", label: "Compose" },
    { id: "history", label: "History" },
    { id: "subscribers", label: `Subscribers (${subscriberCount?.count ?? 0})` },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Newsletter</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Compose, preview, and send newsletters to your RI Tennis Academy community.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.id
                ? "border-[#c9a84c] text-[#c9a84c]"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── COMPOSE TAB ── */}
      {tab === "compose" && (
        <div className="space-y-5">
          {/* AI Generate bar */}
          <div className="flex flex-wrap gap-2 items-center p-4 rounded-xl border border-[#c9a84c]/30 bg-[#c9a84c]/5">
            <span className="text-sm font-medium text-foreground mr-1">AI Generate:</span>
            {(["tuesday", "friday", "special"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setGenerateType(t)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  generateType === t
                    ? "bg-[#c9a84c] text-[#0f1f4b] border-[#c9a84c]"
                    : "border-[#c9a84c]/40 text-[#c9a84c] hover:bg-[#c9a84c]/10"
                }`}
              >
                {t === "tuesday" ? "Tuesday Update" : t === "friday" ? "Friday Recap" : "Special Announcement"}
              </button>
            ))}
            <Input
              placeholder="Optional context (e.g. 'tournament win this weekend')"
              value={generateContext}
              onChange={(e) => setGenerateContext(e.target.value)}
              className="flex-1 min-w-[200px] h-8 text-sm"
            />
            <Button
              size="sm"
              onClick={() => generate.mutate({ type: generateType, context: generateContext || undefined })}
              disabled={generate.isPending}
              className="bg-[#0f1f4b] hover:bg-[#1a3a8f] text-white"
            >
              {generate.isPending ? "Generating..." : "Generate"}
            </Button>
          </div>

          {/* Form */}
          <div className="grid gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Subject Line *</label>
              <Input
                placeholder="e.g. RI Tennis Academy — Tuesday Update"
                value={draft.subject}
                onChange={(e) => setDraft((d) => ({ ...d, subject: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Headline</label>
              <Input
                placeholder="e.g. Spring Season Starts March 16th!"
                value={draft.headline}
                onChange={(e) => setDraft((d) => ({ ...d, headline: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Body — From Coach Mario</label>
              <Textarea
                placeholder="Write your personal message here... (use blank lines between paragraphs)"
                value={draft.body}
                onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
                rows={7}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Tennis Tip of the Week</label>
                <Textarea
                  placeholder="e.g. When returning serve, keep your racket head up..."
                  value={draft.tennisTip}
                  onChange={(e) => setDraft((d) => ({ ...d, tennisTip: e.target.value }))}
                  rows={3}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Delete Fear — Mental Edge</label>
                <Textarea
                  placeholder="e.g. Fear of missing is the #1 enemy of great tennis..."
                  value={draft.mentalTip}
                  onChange={(e) => setDraft((d) => ({ ...d, mentalTip: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Winner Spotlight</label>
              <Input
                placeholder="e.g. Congrats to Sarah for winning her first tournament this weekend!"
                value={draft.winnerSpotlight}
                onChange={(e) => setDraft((d) => ({ ...d, winnerSpotlight: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="includeSchedule"
                checked={draft.includeSchedule}
                onChange={(e) => setDraft((d) => ({ ...d, includeSchedule: e.target.checked }))}
                className="w-4 h-4 accent-[#c9a84c]"
              />
              <label htmlFor="includeSchedule" className="text-sm text-foreground cursor-pointer">
                Include program schedule & pricing table
              </label>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => saveDraft.mutate(draft)}
              disabled={!draft.subject || saveDraft.isPending}
            >
              {saveDraft.isPending ? "Saving..." : "Save Draft"}
            </Button>
            <Button
              variant="outline"
              onClick={() => previewMut.mutate(draft)}
              disabled={!draft.subject || previewMut.isPending}
              className="border-[#c9a84c]/50 text-[#c9a84c] hover:bg-[#c9a84c]/10"
            >
              {previewMut.isPending ? "Building..." : "Preview Email"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowTestDialog(true)}
              disabled={!draft.subject}
            >
              Send Test
            </Button>
            <Button
              onClick={() => setShowSendConfirm(true)}
              disabled={!draft.subject}
              className="bg-[#0f1f4b] hover:bg-[#1a3a8f] text-white ml-auto"
            >
              Send to All ({subscriberCount?.count ?? 0})
            </Button>
          </div>
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {tab === "history" && (
        <div className="space-y-3">
          {!newsletterList || newsletterList.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-lg font-medium">No newsletters yet</p>
              <p className="text-sm mt-1">Compose and send your first newsletter to see it here.</p>
            </div>
          ) : (
            newsletterList.map((nl) => (
              <div
                key={nl.id}
                className="flex items-start gap-4 p-4 rounded-xl border border-border hover:border-[#c9a84c]/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant={nl.status === "sent" ? "default" : "secondary"}
                      className={nl.status === "sent" ? "bg-[#0f1f4b] text-white" : ""}
                    >
                      {nl.status}
                    </Badge>
                    {nl.status === "sent" && nl.recipientCount != null && (
                      <span className="text-xs text-muted-foreground">{nl.recipientCount} recipients</span>
                    )}
                  </div>
                  <p className="font-semibold text-foreground truncate">{nl.subject}</p>
                  {nl.headline && <p className="text-sm text-muted-foreground truncate">{nl.headline}</p>}
                  <p className="text-xs text-muted-foreground mt-1">
                    {nl.status === "sent" && nl.sentAt
                      ? `Sent ${new Date(nl.sentAt).toLocaleString()}`
                      : `Created ${new Date(nl.createdAt).toLocaleString()}`}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {nl.status === "draft" && (
                    <Button size="sm" variant="outline" onClick={() => loadDraft(nl)}>
                      Edit
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => previewMut.mutate(nl as any)}
                    className="border-[#c9a84c]/50 text-[#c9a84c] hover:bg-[#c9a84c]/10"
                  >
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-destructive/50 text-destructive hover:bg-destructive/10"
                    onClick={() => deleteNewsletter.mutate({ id: nl.id })}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── SUBSCRIBERS TAB ── */}
      {tab === "subscribers" && (
        <div className="space-y-5">
          {/* Add subscriber */}
          <div className="p-4 rounded-xl border border-border">
            <h3 className="text-sm font-semibold mb-3">Add Subscriber</h3>
            <div className="flex gap-2 flex-wrap">
              <Input
                placeholder="Email address *"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                className="flex-1 min-w-[200px]"
              />
              <Input
                placeholder="Name (optional)"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                className="w-40"
              />
              <Button
                onClick={() => addSubscriber.mutate({ email: addEmail, name: addName || undefined })}
                disabled={!addEmail || addSubscriber.isPending}
                className="bg-[#0f1f4b] hover:bg-[#1a3a8f] text-white"
              >
                Add
              </Button>
              <Button variant="outline" onClick={() => setShowBulkDialog(true)}>
                Bulk Import CSV
              </Button>
            </div>
          </div>

          {/* Subscriber list */}
          <div>
            <p className="text-sm text-muted-foreground mb-3">
              {subscribers?.filter((s) => s.isActive).length ?? 0} active subscribers
            </p>
            {!subscribers || subscribers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No subscribers yet. Add emails above or use bulk import.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {subscribers.map((s) => (
                  <div
                    key={s.id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
                      s.isActive ? "border-border" : "border-border/40 opacity-50"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{s.email}</p>
                      {s.name && <p className="text-xs text-muted-foreground">{s.name}</p>}
                    </div>
                    <Badge variant={s.isActive ? "default" : "secondary"} className={s.isActive ? "bg-green-600 text-white" : ""}>
                      {s.isActive ? "Active" : "Unsubscribed"}
                    </Badge>
                    {s.isActive && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => unsubscribe.mutate({ id: s.id })}
                        className="text-xs"
                      >
                        Unsub
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs border-destructive/50 text-destructive hover:bg-destructive/10"
                      onClick={() => deleteSub.mutate({ id: s.id })}
                    >
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PREVIEW DIALOG ── */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto rounded border border-border">
            {previewHtml && (
              <iframe
                srcDoc={previewHtml}
                title="Newsletter Preview"
                className="w-full"
                style={{ height: "600px", border: "none" }}
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── SEND TEST DIALOG ── */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Send a test copy to verify how it looks in your inbox.</p>
          <Input
            placeholder="your@email.com"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTestDialog(false)}>Cancel</Button>
            <Button
              onClick={() => sendTest.mutate({ toEmail: testEmail, ...draft })}
              disabled={!testEmail || sendTest.isPending}
              className="bg-[#0f1f4b] hover:bg-[#1a3a8f] text-white"
            >
              {sendTest.isPending ? "Sending..." : "Send Test"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── SEND TO ALL CONFIRM ── */}
      <AlertDialog open={showSendConfirm} onOpenChange={setShowSendConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send to All Subscribers?</AlertDialogTitle>
            <AlertDialogDescription>
              This will send <strong>"{draft.subject}"</strong> to{" "}
              <strong>{subscriberCount?.count ?? 0} active subscribers</strong>. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => sendToAll.mutate(draft)}
              disabled={sendToAll.isPending}
              className="bg-[#0f1f4b] hover:bg-[#1a3a8f] text-white"
            >
              {sendToAll.isPending ? "Sending..." : "Yes, Send Now"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── BULK IMPORT DIALOG ── */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Import Subscribers</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Paste one subscriber per line. Format: <code className="bg-muted px-1 rounded">email, Name</code> (name is optional).
          </p>
          <Textarea
            placeholder={"john@example.com, John Smith\njane@example.com\nbob@example.com, Bob Jones"}
            value={bulkCsv}
            onChange={(e) => setBulkCsv(e.target.value)}
            rows={8}
            className="font-mono text-sm"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDialog(false)}>Cancel</Button>
            <Button
              onClick={handleBulkImport}
              disabled={!bulkCsv || bulkImport.isPending}
              className="bg-[#0f1f4b] hover:bg-[#1a3a8f] text-white"
            >
              {bulkImport.isPending ? "Importing..." : "Import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
