import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Gift, Heart, CheckCircle, Copy, ExternalLink, Star, ArrowRight } from "lucide-react";

// ─── Gift Card Success Page ───────────────────────────────────────────────────
function GiftCardSuccess() {
  const [location] = useLocation();
  const params = new URLSearchParams(location.split("?")[1] || "");
  const code = params.get("code") || "";
  const recipient = params.get("recipient") || "your friend";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-black mb-3">Gift Card Sent! 🎾</h1>
        <p className="text-muted-foreground mb-8">
          Your gift card for <strong>{recipient}</strong> has been purchased. 
          {code && " Share the code below so they can redeem it during checkout."}
        </p>

        {code && (
          <div className="bg-gradient-to-br from-[#0f1f5c] to-[#1a3a8f] rounded-2xl p-6 mb-6">
            <div className="text-xs text-[#ccff00] font-bold letter-spacing-2 uppercase mb-2">Gift Code</div>
            <div className="text-2xl font-black text-white font-mono tracking-widest mb-4">{code}</div>
            <Button
              onClick={handleCopy}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 w-full"
            >
              {copied ? (
                <><CheckCircle className="h-4 w-4 mr-2" /> Copied!</>
              ) : (
                <><Copy className="h-4 w-4 mr-2" /> Copy Code</>
              )}
            </Button>
          </div>
        )}

        <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground mb-6">
          <p>The recipient can enter this code during checkout to redeem their free session. Valid for 1 year.</p>
        </div>

        <div className="flex gap-3">
          <Link href="/programs" className="flex-1">
            <Button variant="outline" className="w-full">Browse Programs</Button>
          </Link>
          <Link href="/gift-card" className="flex-1">
            <Button className="w-full bg-[#1a3a8f] hover:bg-[#0f1f5c] text-white">
              Send Another Gift
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Gift Card Purchase Page ──────────────────────────────────────────────────
export default function GiftCard() {
  const [location] = useLocation();
  const isSuccess = location.includes("/gift-card/success");
  if (isSuccess) return <GiftCardSuccess />;

  const { user } = useAuth();
  const [selectedProgram, setSelectedProgram] = useState<string>("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [message, setMessage] = useState("");

  const { data: programs = [] } = trpc.giftCards.getProgramOptions.useQuery();
  const purchaseMutation = trpc.giftCards.purchase.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        toast.success("Redirecting to checkout...", { description: "Opening Stripe payment page." });
        window.open(data.checkoutUrl, "_blank");
      }
    },
    onError: (err) => {
      toast.error("Error", { description: err.message });
    },
  });

  const selectedProgramData = programs.find(p => p.type === selectedProgram);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgram) {
      toast.error("Please select a program");
      return;
    }
    if (!recipientName.trim()) {
      toast.error("Please enter the recipient's name");
      return;
    }
    purchaseMutation.mutate({
      programType: selectedProgram,
      recipientName: recipientName.trim(),
      recipientEmail: recipientEmail.trim() || undefined,
      recipientMessage: message.trim() || undefined,
      origin: window.location.origin,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0f1f5c] via-[#1a3a8f] to-[#0f1f5c] text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Gift className="h-4 w-4 text-[#ccff00]" />
            <span>Gift a Session</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
            THE PERFECT GIFT<br />
            <span className="text-[#ccff00]">FOR TENNIS LOVERS</span>
          </h1>
          <p className="text-white/70 text-lg max-w-xl mx-auto">
            Give the gift of tennis — a private lesson, clinic session, or junior program day. 
            They'll receive a gift code to redeem at checkout.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Form */}
          <div>
            <h2 className="text-2xl font-black mb-6">Choose Your Gift</h2>

            {!user ? (
              <div className="bg-muted/50 rounded-2xl p-8 text-center">
                <Gift className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                <h3 className="font-bold text-lg mb-2">Sign in to purchase a gift card</h3>
                <p className="text-muted-foreground text-sm mb-6">Create a free account to send a gift session to a friend or family member.</p>
                <a href={getLoginUrl()}>
                  <Button className="bg-[#1a3a8f] hover:bg-[#0f1f5c] text-white">
                    Sign In to Continue
                  </Button>
                </a>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Program selection */}
                <div>
                  <Label className="text-base font-bold mb-3 block">Select a Program</Label>
                  <div className="space-y-3">
                    {programs.map((prog) => (
                      <button
                        key={prog.type}
                        type="button"
                        onClick={() => setSelectedProgram(prog.type)}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${
                          selectedProgram === prog.type
                            ? "border-[#1a3a8f] bg-[#1a3a8f]/5"
                            : "border-border hover:border-[#1a3a8f]/50"
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-foreground">{prog.label}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-black text-[#1a3a8f]">
                            ${(prog.amountInCents / 100).toFixed(0)}
                          </div>
                          {selectedProgram === prog.type && (
                            <CheckCircle className="h-4 w-4 text-[#1a3a8f] ml-auto mt-1" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recipient info */}
                <div className="space-y-4">
                  <Label className="text-base font-bold block">Recipient Details</Label>
                  <div>
                    <Label htmlFor="recipientName" className="text-sm text-muted-foreground mb-1.5 block">
                      Recipient's Name *
                    </Label>
                    <Input
                      id="recipientName"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="e.g. Sarah Johnson"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="recipientEmail" className="text-sm text-muted-foreground mb-1.5 block">
                      Recipient's Email (optional — for automatic delivery)
                    </Label>
                    <Input
                      id="recipientEmail"
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="sarah@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="message" className="text-sm text-muted-foreground mb-1.5 block">
                      Personal Message (optional)
                    </Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Happy birthday! Enjoy your tennis session..."
                      rows={3}
                      maxLength={500}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-[#1a3a8f] hover:bg-[#0f1f5c] text-white font-bold py-4 text-base"
                  disabled={purchaseMutation.isPending}
                >
                  {purchaseMutation.isPending ? (
                    "Processing..."
                  ) : (
                    <>
                      <Gift className="h-5 w-5 mr-2" />
                      Purchase Gift Card
                      {selectedProgramData && ` — $${(selectedProgramData.amountInCents / 100).toFixed(0)}`}
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>

          {/* How it works */}
          <div className="space-y-6">
            {/* Preview card */}
            <div className="bg-gradient-to-br from-[#0f1f5c] to-[#1a3a8f] rounded-2xl p-6 text-white">
              <div className="text-xs text-[#ccff00] font-bold tracking-widest uppercase mb-4">RI TENNIS ACADEMY</div>
              <div className="text-2xl font-black mb-1">🎾 Gift Card</div>
              <div className="text-white/70 text-sm mb-4">
                {selectedProgramData ? selectedProgramData.label : "Select a program above"}
              </div>
              <div className="bg-white/10 rounded-xl p-4 text-center">
                <div className="text-xs text-white/60 mb-1">Gift Code</div>
                <div className="text-lg font-mono font-bold tracking-widest text-[#ccff00]">GIFT-XXXX-XXXX</div>
              </div>
              <div className="mt-4 text-xs text-white/50 text-center">Valid for 1 year · Redeemable at checkout</div>
            </div>

            {/* How it works */}
            <div className="bg-muted/50 rounded-2xl p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                How It Works
              </h3>
              <div className="space-y-4">
                {[
                  { step: "1", title: "Choose a program", desc: "Select the session type you want to gift" },
                  { step: "2", title: "Pay securely", desc: "Complete checkout with Stripe — takes 30 seconds" },
                  { step: "3", title: "Share the code", desc: "Send the gift code to your recipient by email or text" },
                  { step: "4", title: "They book & enjoy!", desc: "They enter the code at checkout for a free session" },
                ].map((item) => (
                  <div key={item.step} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#1a3a8f] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {item.step}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{item.title}</div>
                      <div className="text-xs text-muted-foreground">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Testimonial */}
            <div className="bg-background border border-border rounded-2xl p-5">
              <div className="flex gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground italic mb-3">
                "I gifted my dad a private lesson for his birthday and he absolutely loved it. Coach Mario was amazing with him. Best gift idea ever!"
              </p>
              <div className="text-sm font-semibold">— Jennifer M.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
