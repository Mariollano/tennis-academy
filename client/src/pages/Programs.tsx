import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Star, Sun, Brain, Clock, DollarSign, CheckCircle, MapPin, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";

const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310519663342968318/kzZFsCRUb4iWMZR8LEwAKz";

const programs = [
  {
    id: "private_lesson",
    icon: Trophy,
    title: "Private Lessons",
    subtitle: "1-on-1 with Coach Mario",
    category: "private",
    badge: "All Levels",
    accentColor: "from-blue-600 to-blue-800",
    photo: `${CDN}/IMG_2886_220d66ff.jpg`,
    photoAlt: "Advanced player on court — private lesson",
    objectPosition: "center 15%",
    description: "One-on-one personalized coaching sessions with Coach Mario. Tailored to your specific needs — whether you're a beginner learning the fundamentals or an advanced player fine-tuning your game.",
    pricing: [{ label: "Per Hour", price: "$120" }],
    highlights: [
      "Personalized technique analysis",
      "Custom drill programs",
      "Video review available",
      "Flexible scheduling",
    ],
    bookHref: "/book/private_lesson",
    bookLabel: "Book a Private Lesson",
    popular: false,
  },
  {
    id: "clinic_105",
    icon: Users,
    title: "105 Game Adult Clinic",
    subtitle: "Mon · Wed · Fri · Sun",
    category: "adult",
    badge: "Most Popular",
    accentColor: "from-amber-500 to-orange-600",
    photo: `${CDN}/IMG_2867_fa17ab01.jpg`,
    photoAlt: "Adult player hitting backhand — 105 Game Clinic",
    description: "The signature RI Tennis Academy adult experience. The 105 Game is a structured group format where adults sign up and play competitive, coached sessions — every Monday, Wednesday, Friday, and Sunday.",
    pricing: [{ label: "Per 1.5-hour session", price: "$35" }],
    highlights: [
      "Runs Mon, Wed, Fri & Sunday",
      "Competitive group play format",
      "Coached matchplay",
      "1.5 hours per session",
    ],
    bookHref: "/book/clinic_105",
    bookLabel: "Book the 105 Clinic",
    popular: true,
  },
  {
    id: "junior",
    icon: Star,
    title: "Junior Programs",
    subtitle: "Fall & Spring · 3:30–6:30 PM",
    category: "junior",
    badge: "Juniors",
    accentColor: "from-green-500 to-emerald-700",
    photo: `${CDN}/IMG_2883_18ff44ca.jpg`,
    photoAlt: "Junior player forehand — junior development program",
    description: "Fall and Spring junior development programs running 3:30–6:30 PM. Choose between daily sessions or commit to a full week package for the best value.",
    pricing: [
      { label: "Daily Session", price: "$80" },
      { label: "Weekly Package (5 days)", price: "$350" },
    ],
    highlights: [
      "Fall & Spring seasons",
      "3:30 PM – 6:30 PM daily",
      "Technique & match development",
      "Age-appropriate training",
    ],
    bookHref: "/book/junior_daily",
    bookLabel: "Book Junior Program",
    popular: false,
  },
  {
    id: "summer_camp",
    icon: Sun,
    title: "Summer Camp",
    subtitle: "9 AM–2 PM · All Summer",
    category: "summer",
    badge: "Summer",
    accentColor: "from-orange-500 to-red-600",
    photo: `${CDN}/IMG_2882_4dfd31c8.jpg`,
    photoAlt: "Coach Mario with summer camp students",
    description: "The ultimate summer tennis experience. Morning camp runs 9 AM–2 PM covering technique, training, matchplay, mental coaching, and fitness. Add the After Camp program for extended afternoon supervision.",
    pricing: [
      { label: "Daily (9 AM–2 PM)", price: "$90" },
      { label: "Weekly Package (5 days)", price: "$420" },
      { label: "After Camp Add-on (2:30–5 PM)", price: "+$20/day" },
      { label: "Afternoon Only (no morning)", price: "$50/day" },
    ],
    highlights: [
      "9 AM – 2 PM main program",
      "Technique, matchplay & fitness",
      "Mental coaching included",
      "After Camp: 2:30–5 PM (+$20/day)",
      "Weekly package: all 5 days same week",
    ],
    bookHref: "/book/summer_camp_daily",
    bookLabel: "Book Summer Camp",
    popular: false,
    note: "Weekly package requires all 5 days to be used within the same calendar week.",
  },
  {
    id: "mental_coaching",
    icon: Brain,
    title: "Mental Coaching",
    subtitle: "Delete Fear · Play Free",
    category: "mental",
    badge: "All Ages",
    accentColor: "from-purple-600 to-violet-800",
    photo: `${CDN}/IMG_2891_c12742f2.jpg`,
    photoAlt: "High five on court — mental coaching",
    objectPosition: "center top",
    description: "Dedicated mental performance coaching with Mario. Address fear, build confidence, develop pre-match routines, and learn to perform under pressure. Available as standalone sessions or as a complement to technical training.",
    pricing: [{ label: "Per Session", price: "Contact" }],
    highlights: [
      "Fear elimination techniques",
      "Confidence building",
      "Pre-match routines",
      "Pressure performance skills",
      "Mindset development",
    ],
    bookHref: "/mental-coaching",
    bookLabel: "Learn About Mental Coaching",
    popular: false,
  },
  {
    id: "tournament_attendance",
    icon: MapPin,
    title: "Tournament Attendance",
    subtitle: "On-site coaching at your event",
    category: "tournament",
    badge: "Competitive",
    accentColor: "from-red-600 to-rose-700",
    photo: `${CDN}/IMG_2885_b0ce7285.jpg`,
    photoAlt: "Coach Mario at tournament — on-site coaching",
    description: "Have Coach Mario attend your tournament to provide on-site coaching, warm-up support, between-match strategy, and mental performance coaching. Costs can be shared among multiple students attending the same tournament.",
    pricing: [
      { label: "Coaching rate", price: "$50/hr" },
      { label: "Travel time", price: "$25/hr" },
      { label: "Eating expenses", price: "Actual cost" },
    ],
    highlights: [
      "Pre-match warm-up coaching",
      "Between-match strategy sessions",
      "Mental performance support",
      "Real-time technique adjustments",
      "Post-match debrief and feedback",
      "Cost shareable among students",
    ],
    bookHref: "/services",
    bookLabel: "Request Tournament Coaching",
    popular: false,
  },
];

const categories = [
  { id: "all", label: "All Programs" },
  { id: "adult", label: "Adults" },
  { id: "junior", label: "Juniors" },
  { id: "summer", label: "Summer" },
  { id: "mental", label: "Mental" },
  { id: "tournament", label: "Tournament" },
];

function ProgramCard({ program }: { program: typeof programs[0] }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = program.icon;

  return (
    <div className={`group relative rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 bg-card border border-border ${program.popular ? "ring-2 ring-accent" : ""}`}>
      {program.popular && (
        <div className="absolute top-4 right-4 z-20">
          <Badge className="bg-accent text-accent-foreground font-bold text-xs px-3 py-1 shadow-lg">
            ⭐ Most Popular
          </Badge>
        </div>
      )}

      {/* Photo */}
      <div className="relative h-52 overflow-hidden">
        <img
          src={program.photo}
          alt={program.photoAlt}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          style={{ objectPosition: program.objectPosition || "center center" }}
        />
        <div className={`absolute inset-0 bg-gradient-to-t ${program.accentColor} opacity-60`} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {/* Bottom overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                  <Icon className="w-4 h-4" />
                </div>
                <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm text-xs">{program.badge}</Badge>
              </div>
              <h3 className="text-white font-bold text-xl leading-tight">{program.title}</h3>
              <p className="text-white/70 text-xs mt-0.5">{program.subtitle}</p>
            </div>
            {/* Price callout */}
            <div className="text-right">
              <div className="text-accent font-extrabold text-xl leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                {program.pricing[0].price}
              </div>
              <div className="text-white/50 text-xs">{program.pricing[0].label}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <p className="text-muted-foreground text-sm leading-relaxed mb-4">{program.description}</p>

        {/* Highlights (collapsible on mobile) */}
        <div>
          <button
            className="flex items-center gap-1 text-xs font-semibold text-foreground/60 hover:text-foreground mb-2 transition-colors"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? "Hide details" : "Show details"}
          </button>

          {expanded && (
            <div className="mb-4 space-y-1">
              {/* All pricing tiers */}
              {program.pricing.length > 1 && (
                <div className="bg-accent/10 rounded-xl p-3 mb-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <DollarSign className="w-3.5 h-3.5 text-accent-foreground" />
                    <span className="text-xs font-bold text-foreground uppercase tracking-wider">Pricing</span>
                  </div>
                  {program.pricing.map((p) => (
                    <div key={p.label} className="flex justify-between text-xs py-1 border-b border-border/40 last:border-0">
                      <span className="text-muted-foreground">{p.label}</span>
                      <span className="font-bold text-foreground">{p.price}</span>
                    </div>
                  ))}
                </div>
              )}
              {program.highlights.map((h) => (
                <div key={h} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                  {h}
                </div>
              ))}
              {program.note && (
                <div className="mt-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-300">
                  <strong>Note:</strong> {program.note}
                </div>
              )}
            </div>
          )}
        </div>

        <Link href={program.bookHref}>
          <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-xl group">
            {program.bookLabel}
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function Programs() {
  const [activeCategory, setActiveCategory] = useState("all");

  const filtered = programs.filter(
    (p) => activeCategory === "all" || p.category === activeCategory
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
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
            FIND YOUR PERFECT PROGRAM
          </h1>
          <p className="text-primary-foreground/70 max-w-2xl text-lg leading-relaxed mb-6">
            From private lessons to group clinics, junior development to summer camps —
            every program is designed to accelerate your game.
          </p>
          {/* Quick-pick buttons */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Private Lesson", href: "/book/private_lesson", price: "$120/hr" },
              { label: "105 Clinic", href: "/book/clinic_105", price: "$35" },
              { label: "Junior Program", href: "/book/junior_daily", price: "$80/day" },
              { label: "Summer Camp", href: "/book/summer_camp_daily", price: "$90/day" },
            ].map(({ label, href, price }) => (
              <Link key={href} href={href}>
                <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-primary-foreground text-sm font-medium transition-all hover:scale-105">
                  <span>{label}</span>
                  <span className="text-accent font-bold text-xs">{price}</span>
                </button>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="sticky top-16 z-30 bg-background/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="container py-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  activeCategory === cat.id
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Programs Grid */}
      <section className="py-12">
        <div className="container">
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">No programs found for this category.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((program) => (
                <ProgramCard key={program.id} program={program} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Services Callout */}
      <section className="py-12 bg-muted/30 border-t border-border">
        <div className="container">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-foreground mb-2" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              ADDITIONAL SERVICES
            </h2>
            <p className="text-muted-foreground">Beyond programs, Mario offers these specialized services.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {[
              { icon: Clock, title: "Racquet Stringing", desc: "$35 with Mario's string · $25 with your string", href: "/services" },
              { icon: Star, title: "Merchandise", desc: "Sweatshirts $50 · T-Shirts $25 — RI Tennis Academy gear", href: "/services" },
            ].map(({ icon: Icon, title, desc, href }) => (
              <Link key={title} href={href}>
                <div className="bg-card border border-border rounded-2xl p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-0.5">{title}</h3>
                    <p className="text-muted-foreground text-xs">{desc}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
