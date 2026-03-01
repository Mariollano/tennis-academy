import { useState, useEffect } from "react";
import { useParams, Link, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Clock, CreditCard, ArrowLeft, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const PROGRAM_CONFIG: Record<string, {
  title: string;
  type: string;
  description: string;
  pricing: { label: string; value: string; cents: number }[];
  timeInfo?: string;
  note?: string;
}> = {
  private_lesson: {
    title: "Private Lesson",
    type: "private_lesson",
    description: "One-on-one session with Coach Mario — $120/hour.",
    pricing: [{ label: "$120 per hour", value: "per_hour", cents: 12000 }],
    timeInfo: "Flexible scheduling — contact Mario for available times.",
  },
  clinic_105: {
    title: "105 Game Adult Clinic",
    type: "clinic_105",
    description: "Signature adult group play session — 1.5 hours.",
    pricing: [{ label: "$30 per 1.5-hour session", value: "session", cents: 3000 }],
    timeInfo: "Sessions scheduled weekly — check with Mario for next available date.",
  },
  junior_daily: {
    title: "Junior Program — Daily",
    type: "junior_daily",
    description: "Single daily junior session (Fall/Spring).",
    pricing: [{ label: "$80 per session (4:30–6:30 PM)", value: "daily", cents: 8000 }],
    timeInfo: "4:30 PM – 6:30 PM",
  },
  junior_weekly: {
    title: "Junior Program — Weekly Package",
    type: "junior_weekly",
    description: "Full week junior program (5 sessions, Fall/Spring).",
    pricing: [{ label: "$350 per week (5 sessions)", value: "weekly", cents: 35000 }],
    timeInfo: "4:30 PM – 6:30 PM, Monday–Friday",
  },
  summer_camp_daily: {
    title: "Summer Camp — Daily",
    type: "summer_camp_daily",
    description: "Single day summer camp session.",
    pricing: [
      { label: "$100 per day (9 AM–2 PM)", value: "daily", cents: 10000 },
      { label: "+ $20 After Camp add-on (2:30–5 PM)", value: "after_camp", cents: 2000 },
    ],
    timeInfo: "9:00 AM – 2:00 PM (After Camp: 2:30–5 PM)",
  },
  summer_camp_weekly: {
    title: "Summer Camp — Weekly Package",
    type: "summer_camp_weekly",
    description: "Full week summer camp (all 5 days must be in the same week).",
    pricing: [
      { label: "$450 per week (Mon–Fri, same week)", value: "weekly", cents: 45000 },
      { label: "+ $20/day After Camp add-on (2:30–5 PM)", value: "after_camp_daily", cents: 2000 },
    ],
    timeInfo: "9:00 AM – 2:00 PM, Monday–Friday",
    note: "Weekly package requires all 5 days to be used within the same calendar week. Days cannot be split across different weeks.",
  },
  mental_coaching: {
    title: "Mental Coaching Session",
    type: "mental_coaching",
    description: "Dedicated mental performance coaching with Mario.",
    pricing: [{ label: "Per Session — contact for pricing", value: "session", cents: 0 }],
  },
};

export default function BookingPage() {
  const params = useParams<{ programType: string }>();
  const programType = params.programType || "private_lesson";
  const config = PROGRAM_CONFIG[programType] || PROGRAM_CONFIG["private_lesson"];

  const { user, isAuthenticated } = useAuth();
  const [selectedPricing, setSelectedPricing] = useState(config.pricing[0].value);
  const [sessionDate, setSessionDate] = useState("");
  const [afterCamp, setAfterCamp] = useState(false);
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const paymentStatus = searchParams.get("payment");

  // Show payment result if redirected back from Stripe
  useEffect(() => {
    if (paymentStatus === "success") {
      setSubmitted(true);
    } else if (paymentStatus === "cancelled") {
      toast.info("Payment was cancelled. Your booking was not confirmed.");
    }
  }, [paymentStatus]);

  const createCheckoutMutation = trpc.stripe.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        toast.success("Redirecting to secure payment...");
        window.open(data.url, "_blank");
      }
    },
    onError: (err) => toast.error(err.message || "Payment setup failed. Please try again."),
  });

  const createBookingMutation = trpc.booking.create.useMutation({
    onSuccess: (_, variables) => {
      // After booking is created, immediately launch Stripe checkout
      if (variables.totalAmountCents > 0) {
        createCheckoutMutation.mutate({
          bookingId: 0, // will be updated by webhook
          programName: config.title,
          amountCents: variables.totalAmountCents,
          origin: window.location.origin,
        });
      } else {
        // Free / contact-for-pricing: just show confirmation
        setSubmitted(true);
        toast.success("Booking request submitted! Mario will be in touch shortly.");
      }
    },
    onError: (err) => toast.error(err.message || "Booking failed. Please try again."),
  });

  const selectedPrice = config.pricing.find((p) => p.value === selectedPricing);
  const totalCents = (selectedPrice?.cents || 0) + (afterCamp ? 2000 : 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    createBookingMutation.mutate({
      programType: config.type,
      sessionDate: sessionDate || undefined,
      pricingOption: selectedPricing,
      afterCampAddon: afterCamp,
      notes,
      totalAmountCents: totalCents,
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Booking Confirmed!</h2>
          <p className="text-muted-foreground mb-6">
            {paymentStatus === "success"
              ? <>Payment received! Your <strong>{config.title}</strong> booking is confirmed. Mario will be in touch with session details.</>
              : <>Your <strong>{config.title}</strong> booking request has been submitted. Mario will be in touch shortly.</>
            }
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/programs">
              <Button variant="outline">View Programs</Button>
            </Link>
            <Link href="/profile">
              <Button className="bg-primary text-primary-foreground">My Bookings</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-primary text-primary-foreground py-12">
        <div className="container">
          <Link href="/programs">
            <Button variant="ghost" size="sm" className="text-primary-foreground/70 hover:text-primary-foreground mb-4">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Programs
            </Button>
          </Link>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2">{config.title}</h1>
          <p className="text-primary-foreground/80">{config.description}</p>
        </div>
      </section>

      <div className="container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Booking Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!isAuthenticated ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">Please sign in to book a session.</p>
                    <Button
                      className="bg-primary text-primary-foreground"
                      onClick={() => (window.location.href = getLoginUrl())}
                    >
                      Sign In to Book
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Student Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Name</Label>
                        <Input value={user?.name || ""} disabled className="bg-muted" />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input value={user?.email || ""} disabled className="bg-muted" />
                      </div>
                    </div>

                    {/* Pricing Option */}
                    {config.pricing.length > 1 && (
                      <div>
                        <Label>Select Package</Label>
                        <Select value={selectedPricing} onValueChange={setSelectedPricing}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {config.pricing.map((p) => (
                              <SelectItem key={p.value} value={p.value}>
                                {p.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Date */}
                    <div>
                      <Label>Preferred Date</Label>
                      <Input
                        type="date"
                        value={sessionDate}
                        onChange={(e) => setSessionDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                      />
                    </div>

                    {/* After Camp Add-on */}
                    {(programType === "summer_camp_daily" || programType === "summer_camp_weekly") && (
                      <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <Checkbox
                          id="afterCamp"
                          checked={afterCamp}
                          onCheckedChange={(v) => setAfterCamp(!!v)}
                        />
                        <div>
                          <Label htmlFor="afterCamp" className="font-semibold cursor-pointer">
                            Add After Camp Program (+$20{programType === "summer_camp_weekly" ? "/day" : ""})
                          </Label>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            Extended afternoon supervision from 2:30 PM – 5:00 PM
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    <div>
                      <Label>Additional Notes (optional)</Label>
                      <Textarea
                        placeholder="Any special requests, skill level, or questions for Coach Mario..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                      />
                    </div>

                    {config.note && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                        <strong>Important:</strong> {config.note}
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold py-3 text-base"
                      disabled={createBookingMutation.isPending || createCheckoutMutation.isPending}
                    >
                      {createBookingMutation.isPending || createCheckoutMutation.isPending ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                      ) : totalCents > 0 ? (
                        <><CreditCard className="w-4 h-4 mr-2" /> Book & Pay ${(totalCents / 100).toFixed(0)}</>
                      ) : (
                        "Submit Booking Request"
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="font-semibold text-foreground">{config.title}</div>
                  {config.timeInfo && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                      <Clock className="w-3.5 h-3.5" />
                      {config.timeInfo}
                    </div>
                  )}
                </div>
                <div className="border-t border-border pt-3">
                  {config.pricing.map((p) => (
                    <div key={p.value} className="flex justify-between text-sm py-1">
                      <span className="text-muted-foreground">{p.label.split(" — ")[0]}</span>
                      <span className="font-medium">{p.cents > 0 ? `$${(p.cents / 100).toFixed(0)}` : "TBD"}</span>
                    </div>
                  ))}
                  {afterCamp && (
                    <div className="flex justify-between text-sm py-1">
                      <span className="text-muted-foreground">After Camp add-on</span>
                      <span className="font-medium">+$20</span>
                    </div>
                  )}
                  {totalCents > 0 && (
                    <div className="flex justify-between font-bold text-foreground pt-2 border-t border-border mt-2">
                      <span>Total</span>
                      <span className="text-primary">${(totalCents / 100).toFixed(0)}</span>
                    </div>
                  )}
                </div>
                <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 text-xs text-foreground">
                  <CreditCard className="w-3.5 h-3.5 inline mr-1 text-accent" />
                  <strong>Secure payment via Stripe.</strong> You'll be redirected to complete payment after submitting.
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary text-primary-foreground">
              <CardContent className="p-4 text-sm">
                <div className="font-semibold text-accent mb-1">Questions?</div>
                <p className="text-primary-foreground/80">
                  Use the chat button in the bottom-right corner to ask Coach Mario's AI assistant any questions about programs or scheduling.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
