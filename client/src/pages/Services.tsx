import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trophy, Wrench, ShoppingBag, Users, Clock, DollarSign, CheckCircle, Info } from "lucide-react";
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

export default function Services() {
  const { isAuthenticated } = useAuth();
  const [selectedSize, setSelectedSize] = useState<Record<string, string>>({});
  const [tournamentStudents, setTournamentStudents] = useState(1);
  const [tournamentHours, setTournamentHours] = useState(3);
  const [travelHours, setTravelHours] = useState(1);
  const [stringProvider, setStringProvider] = useState<"academy" | "customer">("academy");

  const createBookingMutation = trpc.booking.create.useMutation({
    onSuccess: () => toast.success("Request submitted! Mario will confirm shortly."),
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container">
          <Badge className="mb-4 bg-accent/20 text-accent border-accent/30">Additional Services</Badge>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Services & Merchandise</h1>
          <p className="text-primary-foreground/80 max-w-2xl text-lg">
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
                    Request Tournament Attendance
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
                    Request Stringing — ${stringProvider === "academy" ? "35" : "25"}
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
                      Order Now — ${(item.price / 100).toFixed(0)}
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
