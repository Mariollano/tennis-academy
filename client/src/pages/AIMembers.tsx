import * as React from "react";
import { trpc } from "@/lib/trpc";
import MemberJoinButton from "@/components/MemberJoinButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, BookOpen, Lock } from "lucide-react";
import { toast } from "sonner";

export function MemberSignInForm() {
  const [email, setEmail] = React.useState("");
  const request = trpc.aiMembership.account.requestSignIn.useMutation();
  return (
    <form onSubmit={event => { event.preventDefault(); if (!request.isPending) request.mutate({ email, origin: window.location.origin }); }} className="mt-8 max-w-md space-y-3 rounded-xl border border-border bg-card p-5 text-card-foreground">
      <h2 className="font-semibold">Already subscribed? Sign in</h2>
      <Label htmlFor="member-sign-in-email">The email you paid with</Label>
      <Input id="member-sign-in-email" type="email" autoComplete="email" required maxLength={320} value={email} onChange={event => setEmail(event.target.value)} />
      <Button type="submit" disabled={request.isPending}>{request.isPending ? "Sending…" : "Email me a sign-in link"}</Button>
      {request.data && <p role="status" className="text-sm leading-relaxed">{request.data.message}</p>}
      {request.error && <p role="alert" className="text-sm text-red-700">{request.error.message}</p>}
    </form>
  );
}

export default function AIMembers() {
  const utils = trpc.useUtils();
  const me = trpc.aiMembership.account.me.useQuery(undefined, { retry: false, refetchInterval: 30_000 });
  const library = trpc.aiMembership.library.library.useQuery(undefined, { enabled: !!me.data?.hasAccess, retry: false });
  const finish = trpc.aiMembership.billing.finishCheckout.useMutation({ onSuccess: () => { void utils.aiMembership.account.me.invalidate(); void utils.aiMembership.library.library.invalidate(); } });
  const signOut = trpc.aiMembership.account.signOut.useMutation({ onSuccess: () => { void utils.aiMembership.account.me.invalidate(); utils.aiMembership.library.library.reset(); } });
  const cancel = trpc.aiMembership.billing.cancelRenewal.useMutation({ onSuccess: () => { toast.success("Future renewal canceled. Your paid month stays available."); void utils.aiMembership.account.me.invalidate(); } });
  const finished = React.useRef(false);
  const [showPrompts, setShowPrompts] = React.useState(false);
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("session_id");
    if (params.get("checkout") === "success" && id && !finished.current) {
      finished.current = true;
      finish.mutate({ sessionId: id });
    }
  }, []);

  return (
    <div className="min-h-[70vh] bg-background text-foreground">
      <header className="bg-[#0D1B2A] py-10 text-white">
        <div className="container">
          <p className="mb-2 text-xs uppercase tracking-widest text-[#F3C85D]">AI for the Working Tennis Pro</p>
          <h1 className="text-4xl font-bold sm:text-5xl" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Member library</h1>
          <p className="mt-3 text-sm text-white/80">Your guides, prompts, and new workflows from Coach Mario.</p>
        </div>
      </header>
      <div className="container py-10 sm:py-14">
        {finish.isPending && <p role="status" className="mb-6 rounded-lg border border-border p-4">Confirming your payment and opening your member account…</p>}
        {finish.error && <p role="alert" className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">{finish.error.message} If you paid, do not pay again. Use the sign-in link in your welcome email or contact Coach Mario.</p>}
        {finish.data && <p role="status" className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">Your payment is confirmed and your account is ready. {finish.data.welcomeSent ? "Check your welcome email and click its private sign-in link to open the library." : "Welcome-email delivery is being retried. You can also request a fresh sign-in link below. Do not pay again."}</p>}
        {me.isLoading ? <p role="status">Loading your membership…</p> : me.error ? (
          <div role="alert"><p>Membership access is temporarily unavailable. Please try again or contact Coach Mario.</p><Button className="mt-4" onClick={() => void me.refetch()}>Try again</Button></div>
        ) : !me.data?.hasAccess ? (
          <section aria-labelledby="members-only-heading" className="max-w-2xl">
            <Lock className="mb-4 h-7 w-7 text-muted-foreground" />
            <h2 id="members-only-heading" className="mb-3 text-2xl font-bold">This library is for members</h2>
            <p className="mb-6 text-muted-foreground">Join for $20 per month to access the guides and Prompt Library. Already paid? Sign in using the email from your checkout.</p>
            <MemberJoinButton />
            <MemberSignInForm />
          </section>
        ) : (
          <>
            <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
              <p className="break-all text-sm text-muted-foreground">Signed in as {me.data.member?.email}</p>
              <Button variant="outline" onClick={() => signOut.mutate()} disabled={signOut.isPending}>Sign out</Button>
            </div>
            {library.isLoading ? <p role="status">Loading the library…</p> : library.error ? <p role="alert" className="text-red-700">Downloads are temporarily unavailable. Please contact Coach Mario.</p> : (
              <>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {library.data?.guides.map(guide => (
                    <section key={guide.slot} data-member-guide className="rounded-2xl border border-border bg-card p-6 text-card-foreground">
                      <FileText className="mb-4 h-6 w-6 text-muted-foreground" />
                      <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">{guide.label}</p>
                      <h2 className="mb-4 text-xl font-semibold">{guide.title}</h2>
                      {guide.available ? <a href={`/api/ai-members/download/${guide.slot}`} className="inline-flex min-h-11 items-center rounded-lg bg-[#F3C85D] px-4 py-2 text-sm font-semibold text-[#0D1B2A]">Download PDF</a> : <p className="text-sm text-muted-foreground">Coming soon</p>}
                      {guide.slot === "guide-5" && (library.data.promptLibrary ? <Button variant="outline" className="mt-3" onClick={() => setShowPrompts(value => !value)}>Open the Prompt Library</Button> : <p className="mt-3 text-sm text-muted-foreground">Prompt Library: Coming soon</p>)}
                    </section>
                  ))}
                </div>
                {showPrompts && library.data?.promptLibrary && <section className="mt-8 rounded-xl border border-border bg-card p-6 text-card-foreground"><h2 className="mb-5 flex items-center gap-2 text-2xl font-bold"><BookOpen className="h-6 w-6" />The Prompt Library</h2><pre className="whitespace-pre-wrap break-words font-sans text-sm leading-7">{library.data.promptLibrary}</pre></section>}
              </>
            )}
          </>
        )}
        {me.data?.member && (
          <section className="mt-10 border-t border-border pt-6">
            <h2 className="mb-3 text-lg font-semibold">Your membership</h2>
            {me.data.subscriptions.map(sub => (
              <div key={sub.id} className="mb-4 flex flex-wrap items-center gap-4">
                <p className="text-sm text-muted-foreground">{sub.cancelAtPeriodEnd ? "Future renewal canceled." : `Status: ${sub.status}.`} {sub.paidThrough ? `Paid access through ${new Date(sub.paidThrough).toLocaleDateString()}.` : "No paid access currently."}</p>
                {!sub.cancelAtPeriodEnd && !["canceled", "incomplete_expired"].includes(sub.status) && <Button variant="outline" disabled={cancel.isPending} onClick={() => { if (window.confirm("Cancel future monthly renewal? You will keep access through your paid month and keep your downloaded guides.")) cancel.mutate({ subscriptionId: sub.id }); }}>Cancel future renewal</Button>}
              </div>
            ))}
            {cancel.error && <p role="alert" className="text-sm text-red-700">{cancel.error.message}</p>}
            <p className="mt-3 text-sm text-muted-foreground">Guides you download are yours to keep.</p>
          </section>
        )}
        {me.data?.admin && <p className="mt-8 text-sm"><a className="underline" href="/admin/ai-members">Manage membership PDFs and setup</a></p>}
        <p className="mt-10 text-sm text-muted-foreground">Questions? <a className="underline" href="mailto:ritennismario@gmail.com">Email Coach Mario</a> or <a className="underline" href="sms:+14019655873">text (401) 965-5873</a>.</p>
      </div>
    </div>
  );
}
