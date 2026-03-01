import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Users, Star, Sun, Brain, Clock, DollarSign, CheckCircle } from "lucide-react";

const programs = [
  {
    id: "private_lesson",
    icon: <Trophy className="w-6 h-6" />,
    title: "Private Lessons",
    category: "private",
    badge: "All Levels",
    badgeColor: "bg-blue-100 text-blue-800",
    description: "One-on-one personalized coaching sessions with Coach Mario. Tailored to your specific needs — whether you're a beginner learning the fundamentals or an advanced player fine-tuning your game.",
    pricing: [{ label: "Per Hour", price: "$120/hour" }],
    highlights: [
      "Personalized technique analysis",
      "Custom drill programs",
      "Video review available",
      "Flexible scheduling",
    ],
    bookHref: "/book/private_lesson",
  },
  {
    id: "clinic_105",
    icon: <Users className="w-6 h-6" />,
    title: "105 Game Adult Clinic",
    category: "adult",
    badge: "Adults",
    badgeColor: "bg-amber-100 text-amber-800",
    description: "The signature RI Tennis Academy adult experience. The 105 Game is a structured group format where adults sign up and play competitive, coached sessions — every Monday, Wednesday, Friday, and Sunday.",
    pricing: [{ label: "Per 1.5-hour session", price: "$30" }],
    highlights: [
      "Runs Mon, Wed, Fri & Sunday",
      "Competitive group play format",
      "Coached matchplay",
      "1.5 hours per session",
    ],
    bookHref: "/book/clinic_105",
  },
  {
    id: "junior",
    icon: <Star className="w-6 h-6" />,
    title: "Junior Programs",
    category: "junior",
    badge: "Juniors",
    badgeColor: "bg-green-100 text-green-800",
    description: "Fall and Spring junior development programs running 4:30–6:30 PM. Choose between daily sessions or commit to a full week package for the best value.",
    pricing: [
      { label: "Daily Session", price: "$80" },
      { label: "Weekly Package (5 days)", price: "$350" },
    ],
    highlights: [
      "Fall & Spring seasons",
      "4:30 PM – 6:30 PM daily",
      "Technique & match development",
      "Age-appropriate training",
    ],
    bookHref: "/book/junior_daily",
  },
  {
    id: "summer_camp",
    icon: <Sun className="w-6 h-6" />,
    title: "Summer Camp",
    category: "summer",
    badge: "Summer",
    badgeColor: "bg-orange-100 text-orange-800",
    description: "The ultimate summer tennis experience. Morning camp runs 9 AM–2 PM covering technique, training, matchplay, mental coaching, and fitness. Add the After Camp program for extended afternoon supervision.",
    pricing: [
      { label: "Daily (main camp 9AM–2PM)", price: "$100/day" },
      { label: "Weekly Package (same week, 5 days)", price: "$450/week" },
      { label: "After Camp Add-on (2:30–5PM)", price: "+$20/day" },
    ],
    highlights: [
      "9 AM – 2 PM main program",
      "Technique, matchplay & fitness",
      "Mental coaching included",
      "After Camp: 2:30–5 PM (+$20)",
      "Weekly package: must use all 5 days in same week",
    ],
    bookHref: "/book/summer_camp_daily",
    note: "Weekly package requires all 5 days to be used within the same calendar week.",
  },
  {
    id: "mental_coaching",
    icon: <Brain className="w-6 h-6" />,
    title: "Mental Coaching Sessions",
    category: "mental",
    badge: "All Ages",
    badgeColor: "bg-purple-100 text-purple-800",
    description: "Dedicated mental performance coaching with Mario. Address fear, build confidence, develop pre-match routines, and learn to perform under pressure. Available as standalone sessions or as a complement to technical training.",
    pricing: [{ label: "Per Session", price: "Contact for pricing" }],
    highlights: [
      "Fear elimination techniques",
      "Confidence building",
      "Pre-match routines",
      "Pressure performance skills",
      "Mindset development",
    ],
    bookHref: "/mental-coaching",
  },
];

export default function Programs() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container">
          <Badge className="mb-4 bg-accent/20 text-accent border-accent/30">Programs & Pricing</Badge>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Find Your Perfect Program
          </h1>
          <p className="text-primary-foreground/80 max-w-2xl text-lg">
            From private lessons to group clinics, junior development to summer camps —
            RI Tennis Academy has a program for every player and every goal.
          </p>
        </div>
      </section>

      {/* Programs Grid */}
      <section className="py-16">
        <div className="container">
          <Tabs defaultValue="all">
            <TabsList className="mb-8 flex flex-wrap gap-1 h-auto bg-muted p-1 rounded-xl">
              <TabsTrigger value="all">All Programs</TabsTrigger>
              <TabsTrigger value="adult">Adults</TabsTrigger>
              <TabsTrigger value="junior">Juniors</TabsTrigger>
              <TabsTrigger value="summer">Summer</TabsTrigger>
              <TabsTrigger value="mental">Mental</TabsTrigger>
            </TabsList>

            {["all", "adult", "junior", "summer", "mental", "private"].map((tab) => (
              <TabsContent key={tab} value={tab}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {programs
                    .filter((p) => tab === "all" || p.category === tab)
                    .map((program) => (
                      <Card key={program.id} className="border border-border hover:shadow-xl transition-all duration-300 overflow-hidden">
                        <CardHeader className="bg-primary/5 border-b border-border pb-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                {program.icon}
                              </div>
                              <div>
                                <CardTitle className="text-xl">{program.title}</CardTitle>
                                <Badge className={`text-xs mt-1 ${program.badgeColor}`}>{program.badge}</Badge>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6">
                          <p className="text-muted-foreground text-sm leading-relaxed mb-5">{program.description}</p>

                          {/* Pricing */}
                          <div className="bg-accent/10 rounded-lg p-4 mb-5">
                            <div className="flex items-center gap-2 mb-2">
                              <DollarSign className="w-4 h-4 text-accent-foreground" />
                              <span className="font-semibold text-sm text-foreground">Pricing</span>
                            </div>
                            {program.pricing.map((price) => (
                              <div key={price.label} className="flex justify-between items-center text-sm py-1">
                                <span className="text-muted-foreground">{price.label}</span>
                                <span className="font-bold text-foreground">{price.price}</span>
                              </div>
                            ))}
                          </div>

                          {/* Highlights */}
                          <ul className="space-y-1.5 mb-5">
                            {program.highlights.map((h) => (
                              <li key={h} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                {h}
                              </li>
                            ))}
                          </ul>

                          {program.note && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-xs text-amber-800">
                              <strong>Note:</strong> {program.note}
                            </div>
                          )}

                          <Link href={program.bookHref}>
                            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                              Book This Program
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* Additional Services Callout */}
      <section className="py-12 bg-muted/40">
        <div className="container">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">Additional Services</h2>
            <p className="text-muted-foreground">Beyond programs, Mario offers these specialized services.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { icon: <Trophy className="w-5 h-5" />, title: "Tournament Attendance", desc: "$50/hr coaching + $25/hr travel (shareable among students)", href: "/services" },
              { icon: <Clock className="w-5 h-5" />, title: "Racquet Stringing", desc: "$35 with Mario's string · $25 with your string", href: "/services" },
              { icon: <Star className="w-5 h-5" />, title: "Merchandise", desc: "Sweatshirts $50 · T-Shirts $25 — RI Tennis Academy gear", href: "/services" },
            ].map((s) => (
              <Link key={s.title} href={s.href}>
                <Card className="border border-border hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                  <CardContent className="p-5 text-center">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto mb-3">
                      {s.icon}
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">{s.title}</h3>
                    <p className="text-muted-foreground text-xs">{s.desc}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
