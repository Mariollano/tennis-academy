import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Wrench, ShoppingBag, Users, Clock, DollarSign, CheckCircle, Info, Share2, Copy, Check } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

const merchandise = [
  {
    id: "sweatshirt",
    name: "RI Tennis Academy Sweatshirt",
    price: 5000,
    type: "sweatshirt" as const,
    description: "Premium quality sweatshirt with RI Tennis Academy branding. Stay warm on and off the court.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    imageUrl: "https://picsum.photos/seed/sweatshirt/300/300",
  },
  {
    id: "tshirt",
    name: "RI Tennis Academy T-Shirt",
    price: 2500,
    type: "tshirt" as const,
    description: "Lightweight performance t-shirt with RI Tennis Academy logo. Perfect for practice sessions.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    imageUrl: "https://picsum.photos/seed/tshirt/300/300",
  },
];

// ── Social Share Panel (reusable) ──────────────────────────────────────────
function SocialSharePanel({ itemLabel }: { itemLabel: string }) {
  const shareText = `🎾 Just booked ${itemLabel} at RI Tennis Academy with Coach Mario Llano! Ready to elevate my game and master my mind. #RITennisAcademy #DeleteFear #Tennis`;
  const shareUrl = typeof window !== "undefined" ? window.location.origin : "https://ritennisacademy.com";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`${shareText}\n${shareUrl}`).then(() => {
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const shareLinks = [
    {
      name: "X / Twitter",
      color: "bg-black hover:bg-neutral-800",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.258 5.63 5.906-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "Facebook",
      color: "bg-[#1877F2] hover:bg-[#166FE5]",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
    },
    {
      name: "WhatsApp",
      color: "bg-[#25D366] hover:bg-[#20BD5C]",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      ),
      url: `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`,
    },
    {
      name: "Instagram",
      color: "bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] hover:opacity-90",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
      ),
      url: null,
    },
  ];

  return (
    <Card className="border-2 border-accent/40">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Share2 className="w-4 h-4 text-accent" />
          Share Your Order
        </CardTitle>
        <p className="text-sm text-muted-foreground">Let your friends know you're leveling up!</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted rounded-lg p-3 text-sm text-foreground leading-relaxed border border-border">
          {shareText}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {shareLinks.map((platform) =>
            platform.url ? (
              <a
                key={platform.name}
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-center gap-2 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-all ${platform.color}`}
              >
                {platform.icon}
                {platform.name}
              </a>
            ) : (
              <button
                key={platform.name}
                onClick={() => {
                  handleCopy();
                  toast.info("Instagram doesn't support direct sharing — text copied! Paste it in your story or post.");
                }}
                className={`flex items-center justify-center gap-2 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-all ${platform.color}`}
              >
                {platform.icon}
                {platform.name}
              </button>
            )
          )}
        </div>
        <button
          onClick={handleCopy}
          className="w-full flex items-center justify-center gap-2 border border-border rounded-lg py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copied!" : "Copy text to clipboard"}
        </button>
      </CardContent>
    </Card>
  );
}

// ── Booking Confirmed Screen ───────────────────────────────────────────────
function BookingConfirmedScreen({
  label,
  message,
  onReset,
}: {
  label: string;
  message: string;
  onReset: () => void;
}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-4">
        <Card className="text-center p-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Booking Confirmed!</h2>
          <p className="text-muted-foreground mb-6">{message}</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button variant="outline" onClick={onReset}>
              Book Another
            </Button>
            <Link href="/profile">
              <Button className="bg-primary text-primary-foreground">My Bookings</Button>
            </Link>
          </div>
        </Card>
        <SocialSharePanel itemLabel={label} />
      </div>
    </div>
  );
}

// ── Main Services Page ─────────────────────────────────────────────────────
export default function Services() {
  const { isAuthenticated } = useAuth();
  const [selectedSize, setSelectedSize] = useState<Record<string, string>>({});
  const [tournamentStudents, setTournamentStudents] = useState(1);
  const [tournamentHours, setTournamentHours] = useState(3);
  const [travelHours, setTravelHours] = useState(1);
  const [stringProvider, setStringProvider] = useState<"academy" | "customer">("academy");

  // Confirmation state: null = not submitted, otherwise holds label + message
  const [confirmed, setConfirmed] = useState<{ label: string; message: string } | null>(null);

  const createBookingMutation = trpc.booking.create.useMutation({
    onSuccess: (_data, variables) => {
      const type = variables.programType;
      if (type === "tournament_attendance") {
        setConfirmed({
          label: "Tournament Attendance coaching",
          message: "Your tournament attendance request has been submitted. Mario will confirm the details and reach out shortly.",
        });
      } else if (type === "stringing") {
        setConfirmed({
          label: "Racquet Stringing",
          message: "Your stringing request has been submitted. Drop off your racquet at the academy and Mario will have it ready in 24–48 hours.",
        });
      } else if (type === "merchandise") {
        setConfirmed({
          label: `RI Tennis Academy ${variables.pricingOption === "sweatshirt" ? "Sweatshirt" : "T-Shirt"}`,
          message: "Your merchandise order has been submitted. Mario will confirm availability and arrange pickup or delivery.",
        });
      } else {
        setConfirmed({
          label: "your service request",
          message: "Your request has been submitted. Mario will be in touch shortly.",
        });
      }
    },
    onError: (err) => toast.error(err.message || "Failed to submit request."),
  });

  const tournamentCostPerStudent = Math.round(
    ((tournamentHours * 5000) + (travelHours * 2500)) / tournamentStudents
  );

  const handleMerchandiseOrder = (item: typeof merchandise[0]) => {
    if (!isAuthenticated) { window.location.href = getLoginUrl(); return; }
    const size = selectedSize[item.id];
    if (!size) { toast.error("Please select a size."); return; }
    createBookingMutation.mutate({
      programType: "merchandise",
      pricingOption: item.type,
      totalAmountCents: item.price,
      merchandiseSize: size,
      quantity: 1,
      notes: `${item.name} - Size ${size}`,
    });
  };

  const handleStringingRequest = () => {
    if (!isAuthenticated) { window.location.href = getLoginUrl(); return; }
    const cost = stringProvider === "academy" ? 3500 : 2500;
    createBookingMutation.mutate({
      programType: "stringing",
      pricingOption: stringProvider,
      stringProvidedBy: stringProvider,
      totalAmountCents: cost,
      notes: `Racquet stringing — string provided by ${stringProvider === "academy" ? "Mario" : "customer"}`,
    });
  };

  const handleTournamentRequest = () => {
    if (!isAuthenticated) { window.location.href = getLoginUrl(); return; }
    createBookingMutation.mutate({
      programType: "tournament_attendance",
      pricingOption: "hourly",
      totalAmountCents: tournamentCostPerStudent,
      sharedStudentCount: tournamentStudents,
      notes: `Tournament attendance: ${tournamentHours}hr coaching + ${travelHours}hr travel, shared by ${tournamentStudents} student(s)`,
    });
  };

  // Show full-screen confirmation after any successful booking
  if (confirmed) {
    return (
      <BookingConfirmedScreen
        label={confirmed.label}
        message={confirmed.message}
        onReset={() => setConfirmed(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-primary text-primary-foreground py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
        <div className="container relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-0.5 bg-accent" />
            <span className="text-accent text-sm font-bold tracking-[0.2em] uppercase">RI Tennis Academy</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4" style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '-0.01em' }}>
            SERVICES &amp; MERCHANDISE
          </h1>
          <p className="text-primary-foreground/70 max-w-2xl text-lg leading-relaxed">
            Beyond coaching — tournament support, racquet stringing, and official RI Tennis Academy gear.
          </p>
        </div>
      </section>

      <div className="container py-12">
        <Tabs defaultValue="tournament">
          <TabsList className="mb-8 h-auto flex flex-wrap gap-1 bg-muted p-1 rounded-xl">
            <TabsTrigger value="tournament" className="flex items-center gap-1.5">
              <Trophy className="w-4 h-4" /> Tournament Attendance
            </TabsTrigger>
            <TabsTrigger value="stringing" className="flex items-center gap-1.5">
              <Wrench className="w-4 h-4" /> Racquet Stringing
            </TabsTrigger>
            <TabsTrigger value="merchandise" className="flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4" /> Merchandise
            </TabsTrigger>
          </TabsList>

          {/* Tournament Attendance */}
          <TabsContent value="tournament">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-primary" /> Tournament Attendance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Have Coach Mario attend your tournament to provide on-site coaching, warm-up support,
                    between-match guidance, and mental performance coaching. Costs can be shared among
                    multiple students attending the same tournament on the same date.
                  </p>

                  <div className="bg-accent/10 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 text-accent-foreground" />
                      <span className="font-semibold text-sm">Pricing Structure</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Coaching rate</span>
                      <span className="font-bold">$50 / hour</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Travel time</span>
                      <span className="font-bold">$25 / hour</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Eating expenses</span>
                      <span className="font-bold">Actual cost</span>
                    </div>
                    <div className="border-t border-border pt-2 text-xs text-muted-foreground flex items-start gap-1">
                      <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      Total cost is divided equally among all students attending the same tournament.
                    </div>
                  </div>

                  {/* Cost Calculator */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-sm text-foreground">Cost Calculator</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Coaching Hours</Label>
                        <Input type="number" min={1} max={12} value={tournamentHours}
                          onChange={(e) => setTournamentHours(Number(e.target.value))} />
                      </div>
                      <div>
                        <Label className="text-xs">Travel Hours</Label>
                        <Input type="number" min={0} max={8} value={travelHours}
                          onChange={(e) => setTravelHours(Number(e.target.value))} />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> Number of Students Sharing Cost
                      </Label>
                      <Input type="number" min={1} max={10} value={tournamentStudents}
                        onChange={(e) => setTournamentStudents(Number(e.target.value))} />
                    </div>
                    <div className="bg-primary/5 rounded-lg p-4 text-center">
                      <div className="text-2xl font-extrabold text-primary">
                        ${(tournamentCostPerStudent / 100).toFixed(0)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        per student (coaching + travel, excl. expenses)
                      </div>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={handleTournamentRequest}
                    disabled={createBookingMutation.isPending}
                  >
                    {createBookingMutation.isPending ? "Submitting…" : "Request Tournament Attendance"}
                  </Button>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card className="bg-muted/40">
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-foreground mb-3">What's Included</h3>
                    <ul className="space-y-2">
                      {[
                        "Pre-match warm-up coaching",
                        "Between-match strategy sessions",
                        "Mental performance support",
                        "Real-time technique adjustments",
                        "Post-match debrief and feedback",
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                <Card className="border-amber-200 bg-amber-50">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                      <div className="text-sm text-amber-800">
                        <strong>Cost Sharing:</strong> If multiple students from RI Tennis Academy attend the same tournament on the same date, Mario's coaching and travel fees are split equally among all participating students.
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Racquet Stringing */}
          <TabsContent value="stringing">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-primary" /> Racquet Stringing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Professional racquet stringing by Coach Mario. Choose whether to use Mario's string
                    selection or provide your own string for a lower service fee.
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setStringProvider("academy")}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${stringProvider === "academy" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                    >
                      <div className="font-bold text-2xl text-primary mb-1">$35</div>
                      <div className="font-semibold text-sm text-foreground">Mario's String</div>
                      <div className="text-xs text-muted-foreground mt-1">String + labor included</div>
                      {stringProvider === "academy" && (
                        <CheckCircle className="w-4 h-4 text-primary mt-2" />
                      )}
                    </button>
                    <button
                      onClick={() => setStringProvider("customer")}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${stringProvider === "customer" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                    >
                      <div className="font-bold text-2xl text-primary mb-1">$25</div>
                      <div className="font-semibold text-sm text-foreground">Your String</div>
                      <div className="text-xs text-muted-foreground mt-1">Labor only — you provide string</div>
                      {stringProvider === "customer" && (
                        <CheckCircle className="w-4 h-4 text-primary mt-2" />
                      )}
                    </button>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 inline mr-1.5" />
                    Typical turnaround: 24–48 hours. Drop off your racquet at the academy.
                  </div>

                  <Button
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={handleStringingRequest}
                    disabled={createBookingMutation.isPending}
                  >
                    {createBookingMutation.isPending ? "Submitting…" : `Request Stringing — $${stringProvider === "academy" ? "35" : "25"}`}
                  </Button>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card className="bg-muted/40">
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-foreground mb-3">Why String Matters</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      String tension and type directly affect your game. Proper stringing improves
                      control, power, and feel. Mario recommends restringing every 3 months for
                      regular players, or whenever strings lose tension or break.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Merchandise */}
          <TabsContent value="merchandise">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl">
              {merchandise.map((item) => (
                <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-square overflow-hidden bg-muted">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-foreground">{item.name}</h3>
                      <span className="text-xl font-extrabold text-primary">
                        ${(item.price / 100).toFixed(0)}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm mb-4">{item.description}</p>
                    <div className="mb-4">
                      <Label className="text-xs mb-1.5 block">Select Size</Label>
                      <div className="flex flex-wrap gap-2">
                        {item.sizes.map((size) => (
                          <button
                            key={size}
                            onClick={() => setSelectedSize((prev) => ({ ...prev, [item.id]: size }))}
                            className={`w-10 h-10 rounded-lg border-2 text-sm font-semibold transition-all ${selectedSize[item.id] === size ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50"}`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                    <Button
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={() => handleMerchandiseOrder(item)}
                      disabled={createBookingMutation.isPending}
                    >
                      {createBookingMutation.isPending ? "Submitting…" : `Order Now — $${(item.price / 100).toFixed(0)}`}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
