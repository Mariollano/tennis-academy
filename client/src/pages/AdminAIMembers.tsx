import * as React from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LayoutDashboard, BookOpen } from "lucide-react";
import { toast } from "sonner";

const menus = [{ icon: LayoutDashboard, label: "Academy admin", path: "/admin" }, { icon: BookOpen, label: "AI membership", path: "/admin/ai-members" }];
type Slot = "guide-1" | "guide-2" | "guide-3" | "guide-4" | "guide-5" | "new-guides";
function AdminContent() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const admin = user?.role === "admin";
  const library = trpc.aiMembership.library.adminLibrary.useQuery(undefined, { enabled: admin, retry: false });
  const readiness = trpc.aiMembership.library.readiness.useQuery(undefined, { enabled: admin, retry: false, staleTime: 0 });
  const [prompts, setPrompts] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState<Slot | null>(null);
  const [acknowledge, setAcknowledge] = React.useState(false);
  const upload = trpc.aiMembership.library.uploadGuide.useMutation({ onSuccess: () => { toast.success("PDF uploaded securely."); void utils.aiMembership.library.adminLibrary.invalidate(); }, onError: error => toast.error(error.message) });
  const save = trpc.aiMembership.library.savePrompts.useMutation({ onSuccess: () => { toast.success("Prompt Library saved."); void utils.aiMembership.library.adminLibrary.invalidate(); } });
  const enrollment = trpc.aiMembership.library.setEnrollment.useMutation({ onSuccess: () => { void utils.aiMembership.library.adminLibrary.invalidate(); void utils.aiMembership.library.readiness.invalidate(); toast.success("Enrollment setting saved."); } });
  const connect = trpc.aiMembership.library.connectWebhook.useMutation({ onSuccess: () => { toast.success("Dedicated membership webhook connected."); void utils.aiMembership.library.readiness.invalidate(); } });
  const uploadPdf = async (file: File, slot: Slot) => {
    if (!file.name.toLowerCase().endsWith(".pdf") || file.size > 10 * 1024 * 1024) { toast.error("Choose a PDF up to 10 MB."); return; }
    setUploading(slot);
    try {
      const base64 = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(",")[1]); reader.onerror = reject; reader.readAsDataURL(file); });
      await upload.mutateAsync({ slot, filename: file.name, base64 });
    } catch { /* mutation error is displayed */ }
    finally { setUploading(null); }
  };
  if (!admin) return <p className="p-6">Admin access required. <a className="underline" href="/admin/login">Sign in to the academy admin</a>.</p>;
  return (
    <div className="max-w-5xl space-y-8 py-5">
      <div><h1 className="text-3xl font-bold">AI membership management</h1><p className="mt-2 text-sm text-muted-foreground">Upload finished PDFs here. Empty slots show Coming soon; all downloads are checked on the server.</p></div>
      <section className="rounded-xl border border-border bg-card p-6 text-card-foreground">
        <h2 className="mb-3 text-xl font-semibold">Enrollment setup</h2>
        <p className="mb-4 text-sm">Enrollment is {library.data?.enabled ? "enabled" : "closed"}. Even when enabled, checkout stays blocked if any readiness check fails.</p>
        {readiness.isLoading ? <p>Checking Stripe and email…</p> : readiness.error ? <p className="text-red-700">Setup checks could not complete.</p> : readiness.data?.ready ? <p className="text-green-700">All setup checks passed.</p> : <ul className="list-disc space-y-3 pl-5 text-sm leading-relaxed">{readiness.data?.blockers.map(blocker => <li key={blocker}>{blocker}</li>)}</ul>}
        <div className="mt-5 flex flex-wrap gap-3"><Button variant="outline" disabled={readiness.isFetching} onClick={() => void readiness.refetch()}>Recheck setup</Button><Button variant="outline" disabled={connect.isPending} onClick={() => connect.mutate()}>{connect.isPending ? "Connecting…" : "Connect membership webhook"}</Button><a className="inline-flex min-h-10 items-center text-sm underline" href="/api/ai-members/welcome-preview" target="_blank" rel="noreferrer">Preview the welcome email</a></div>
        {connect.error && <p role="alert" className="mt-3 text-sm text-red-700">{connect.error.message}</p>}
        <Label className="mt-5 flex items-start gap-2 text-sm leading-relaxed"><input type="checkbox" checked={acknowledge} onChange={event => setAcknowledge(event.target.checked)} />I understand unfinished PDFs and prompts show Coming soon, and I have checked the member-access and email setup before opening enrollment.</Label>
        <Button className="mt-4" disabled={enrollment.isPending || (!library.data?.enabled && (!readiness.data?.ready || !acknowledge))} onClick={() => enrollment.mutate({ enabled: !library.data?.enabled, acknowledgePlaceholders: acknowledge })}>{library.data?.enabled ? "Close enrollment" : "Open enrollment"}</Button>
        {enrollment.error && <p role="alert" className="mt-3 text-sm text-red-700">{enrollment.error.message}</p>}
      </section>
      <section><h2 className="mb-4 text-xl font-semibold">The six guide slots</h2>{library.isLoading ? <p>Loading…</p> : library.error ? <p className="text-red-700">Could not load guide slots.</p> : <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{library.data?.guides.map(guide => <div key={guide.slot} className="rounded-xl border border-border bg-card p-5 text-card-foreground"><p className="text-xs uppercase tracking-wider text-muted-foreground">{guide.label}</p><h3 className="mt-2 font-semibold">{guide.title}</h3><p className="mt-3 break-all text-sm text-muted-foreground">{guide.filename || "Coming soon — no PDF uploaded"}</p><Label htmlFor={`pdf-${guide.slot}`} className="mt-4 block text-sm">{guide.filename ? "Replace PDF" : "Upload PDF"} (up to 10 MB)</Label><input id={`pdf-${guide.slot}`} type="file" accept="application/pdf,.pdf" disabled={!!uploading} className="mt-2 block max-w-full text-sm" onChange={event => { const file = event.target.files?.[0]; if (file) void uploadPdf(file, guide.slot); event.target.value = ""; }} />{uploading === guide.slot && <p role="status" className="mt-2 text-sm">Encrypting and uploading…</p>}</div>)}</div>}</section>
      <section className="rounded-xl border border-border bg-card p-6 text-card-foreground"><h2 className="mb-4 text-xl font-semibold">Prompt Library</h2><p className="mb-4 text-sm text-muted-foreground">Paste your prompts as plain text. Members can read and copy them. Blank means Coming soon.</p><Textarea aria-label="Prompt Library text" className="min-h-64" value={prompts ?? library.data?.promptLibrary ?? ""} onChange={event => setPrompts(event.target.value)} maxLength={500000} /><Button className="mt-4" disabled={save.isPending || !library.data} onClick={() => save.mutate({ text: prompts ?? library.data?.promptLibrary ?? "" })}>{save.isPending ? "Saving…" : "Save Prompt Library"}</Button>{save.error && <p role="alert" className="mt-3 text-sm text-red-700">{save.error.message}</p>}</section>
      <p className="text-sm"><a href="/ai-members" className="underline">View member library</a></p>
    </div>
  );
}
export default function AdminAIMembers() {
  return <DashboardLayout menuItems={menus}><AdminContent /></DashboardLayout>;
}
