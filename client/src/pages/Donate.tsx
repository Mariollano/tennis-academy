import { Link, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Heart, ShieldCheck, ArrowLeft, CreditCard, CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { DONATION } from "@shared/donation";
import { toast } from "sonner";

export default function Donate() {
  const search = useSearch();
  const paymentStatus = new URLSearchParams(search).get("payment");
  const checkout = trpc.donation.createCheckout.useMutation({
    onError: (error) => toast.error(error.message || "Unable to start secure checkout. Please try again."),
  });

  const startDonation = async () => {
    const result = await checkout.mutateAsync({ origin: window.location.origin });
    if (result.url) window.location.assign(result.url);
  };

  if (paymentStatus === "success") {
    return (
      <section className="min-h-[70vh] flex items-center justify-center bg-gradient-to-b from-rose-50 via-background to-background px-4 py-16">
        <div className="w-full max-w-xl rounded-3xl border border-rose-200 bg-card p-8 text-center shadow-xl md:p-12">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-rose-600">Payment received</p>
          <h1 className="mb-4 text-4xl font-extrabold text-foreground" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>THANK YOU!</h1>
          <p className="mb-8 text-muted-foreground">Your {DONATION.amountLabel} donation was received securely. Your support helps Coach Mario keep building a welcoming tennis community.</p>
          <Link href="/"><Button className="rounded-full px-7 font-bold">Back to the Academy</Button></Link>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden bg-primary px-4 py-16 md:py-24">
      <div className="absolute inset-0 opacity-15" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
      <div className="relative mx-auto max-w-2xl rounded-3xl border border-white/15 bg-white p-7 shadow-2xl md:p-12">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to RI Tennis Academy
        </Link>
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 shadow-sm">
          <Heart className="h-9 w-9 fill-current" />
        </div>
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-rose-600">Support RI Tennis Academy</p>
        <h1 className="mb-4 text-5xl font-extrabold text-primary" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>DONATE {DONATION.amountLabel}</h1>
        <p className="mb-8 text-lg leading-relaxed text-muted-foreground">Make a simple one-time {DONATION.amountLabel} donation to support Coach Mario and the RI Tennis Academy community. No appointment or approval is needed.</p>
        {paymentStatus === "cancelled" && <p className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-900">No payment was made. You can try again whenever you are ready.</p>}
        <Button onClick={startDonation} disabled={checkout.isPending} className="w-full rounded-2xl py-7 text-lg font-extrabold text-primary" style={{ background: "linear-gradient(145deg, #d4f000 0%, #b8d900 60%, #9fbf00 100%)", boxShadow: "0 5px 0 #7a9400, 0 9px 22px rgba(0,0,0,0.18)" }}>
          <Heart className="mr-2 h-5 w-5 fill-current" />
          {checkout.isPending ? "Opening Secure Checkout…" : `Donate ${DONATION.amountLabel} Securely`}
        </Button>
        <div className="mt-5 flex items-center justify-center gap-2 text-sm text-muted-foreground"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Secure card payment through Stripe <CreditCard className="h-4 w-4" /></div>
      </div>
    </section>
  );
}
