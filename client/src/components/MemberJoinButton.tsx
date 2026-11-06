import * as React from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function MemberJoinButton({ className = "" }: { className?: string }) {
  const [open, setOpen] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const status = trpc.aiMembership.billing.checkoutStatus.useQuery(undefined, { enabled: open, retry: false, staleTime: 0 });
  const checkout = trpc.aiMembership.billing.createCheckout.useMutation({ onSuccess: data => { window.location.assign(data.url); } });
  const available = !!status.data?.available && !status.isFetching;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`inline-flex min-h-12 items-center justify-center rounded-lg border border-[#F3C85D] bg-[#F3C85D] px-6 py-3 text-sm font-semibold text-[#0D1B2A] transition-colors duration-150 hover:bg-[#FFDC83] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F3C85D] sm:text-base ${className}`}>
        Join — $20/month
      </button>
      <Dialog open={open} onOpenChange={value => { if (!checkout.isPending) setOpen(value); }}>
        <DialogContent className="max-w-md bg-background text-foreground">
          <DialogHeader>
            <DialogTitle>AI for the Working Tennis Pro</DialogTitle>
            <DialogDescription>$20 USD per month, billed monthly. Cancel future renewal anytime from your member library.</DialogDescription>
          </DialogHeader>
          <p className="text-sm leading-relaxed text-muted-foreground">Your member account will use the email you pay with. Guides not uploaded yet show “Coming soon”; the Prompt Library opens as Coach Mario adds it.</p>
          {status.isFetching ? <p role="status" className="text-sm">Checking secure enrollment…</p> : !available ? (
            <div role="status" className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950">Membership enrollment is not open yet. Coach Mario is finishing the payment and welcome-email setup. No payment will be taken. Questions? Email <a className="underline" href="mailto:ritennismario@gmail.com">ritennismario@gmail.com</a>.</div>
          ) : (
            <form onSubmit={event => { event.preventDefault(); if (available && !checkout.isPending) checkout.mutate({ email, origin: window.location.origin }); }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="membership-checkout-email">Your email</Label>
                <Input id="membership-checkout-email" type="email" autoComplete="email" required maxLength={320} value={email} onChange={event => setEmail(event.target.value)} />
              </div>
              {checkout.error && <p role="alert" className="text-sm text-red-700">{checkout.error.message}</p>}
              <button type="submit" disabled={checkout.isPending} className="min-h-12 w-full rounded-lg bg-[#F3C85D] px-5 py-3 font-semibold text-[#0D1B2A] disabled:opacity-60">{checkout.isPending ? "Opening secure checkout…" : "Continue to Stripe — $20/month"}</button>
              <p className="text-xs text-muted-foreground">Already a member? <a href="/ai-members" className="underline">Sign in instead of paying twice.</a></p>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
