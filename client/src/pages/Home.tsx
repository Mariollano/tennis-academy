import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Trophy, Brain, Users, Sun, Star, ChevronRight,
  Calendar, MessageSquare, Play, Zap
} from "lucide-react";

const programs = [
  {
    icon: <Trophy className="w-6 h-6" />,
    title: "Private Lessons",
    desc: "One-on-one personalized coaching tailored to your skill level and goals. $120/hour.",
    badge: "All Levels",
    href: "/book/private_lesson",
    color: "bg-blue-50 text-blue-700",
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "105 Game Clinic",
    desc: "The signature adult group experience — competitive play, drills, and fun. $30 per 1.5hr session.",
    badge: "Adults",
    href: "/book/clinic_105",
    color: "bg-amber-50 text-amber-700",
  },
  {
    icon: <Star className="w-6 h-6" />,
    title: "Junior Programs",
    desc: "Fall & Spring programs for young players. Daily sessions or weekly packages available.",
    badge: "Juniors",
    href: "/book/junior_daily",
    color: "bg-green-50 text-green-700",
  },
  {
    icon: <Sun className="w-6 h-6" />,
    title: "Summer Camp",
    desc: "Technique, matchplay, fitness & mental coaching. 9 AM–2 PM with optional after-camp until 5 PM.",
    badge: "Summer",
    href: "/book/summer_camp_daily",
    color: "bg-orange-50 text-orange-700",
  },
  {
    icon: <Brain className="w-6 h-6" />,
    title: "Mental Coaching",
    desc: "Unlock your mental game. Overcome fear, build confidence, and perform under pressure.",
    badge: "All Ages",
    href: "/mental-coaching",
    color: "bg-purple-50 text-purple-700",
  },
];

const stats = [
  { value: "40+", label: "Years Coaching" },
  { value: "1,000s", label: "Students Trained" },
  { value: "100%", label: "Passion for Tennis" },
  { value: "3", label: "Coaching Disciplines" },
];

const features = [
  {
    icon: <Calendar className="w-5 h-5 text-accent" />,
    title: "Easy Online Booking",
    desc: "Book any program, pay securely, and manage your schedule — all in one place.",
  },
  {
    icon: <MessageSquare className="w-5 h-5 text-accent" />,
    title: "AI-Powered Q&A",
    desc: "Get instant answers about technique, mental game, and academy programs 24/7.",
  },
  {
    icon: <Play className="w-5 h-5 text-accent" />,
    title: "Social Media Hub",
    desc: "Watch the latest videos and posts from all of Mario's social channels in one feed.",
  },
  {
    icon: <Zap className="w-5 h-5 text-accent" />,
    title: "SMS Updates",
    desc: "Opt in to receive daily updates, schedule changes, and motivational messages.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section
        className="relative overflow-hidden text-white"
        style={{
          background: "linear-gradient(135deg, #0a0a0a 0%, #0d1b3e 50%, #1a2f5e 100%)",
        }}
      >
        {/* Decorative tennis ball circles */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10"
          style={{ background: "oklch(0.90 0.20 120)", transform: "translate(30%, -30%)" }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10"
          style={{ background: "oklch(0.49 0.22 264)", transform: "translate(-30%, 30%)" }} />

        <div className="container relative py-24 md:py-32">
          <div className="max-w-3xl">
            <Badge className="mb-4 bg-accent/20 text-accent border-accent/30 text-sm px-3 py-1">
              Rhode Island's Premier Tennis Academy
            </Badge>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
              Elevate Your Game.<br />
              <span style={{ color: "oklch(0.90 0.20 120)" }}>Master Your Mind.</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl leading-relaxed">
              Coach Mario Llano brings world-class tennis technique and mental performance coaching
              to RI Tennis Academy. Whether you're a junior, adult, or competitive player — your
              transformation starts here.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/programs">
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-base px-8">
                  View Programs <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>

            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-primary py-10">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="text-3xl font-extrabold text-accent">{s.value}</div>
                <div className="text-primary-foreground/70 text-sm mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="section-padding bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Our Programs</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              From beginner juniors to competitive adults — we have a program designed for every player.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((p) => (
              <Card key={p.title} className="border border-border hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden group">
                <CardContent className="p-6">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${p.color}`}>
                    {p.icon}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-lg text-foreground">{p.title}</h3>
                    <Badge variant="secondary" className="text-xs">{p.badge}</Badge>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4">{p.desc}</p>
                  <Link href={p.href}>
                    <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 w-full group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                      Book Now
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/programs">
              <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                See All Programs & Pricing <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* About Mario */}
      <section className="section-padding bg-muted/40">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-accent/20 text-accent-foreground border-accent/30">Meet Your Coach</Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Mario Llano — <span className="text-primary">Mental, Technique & Fitness Expert</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Mario Llano is not just a tennis coach — he is a complete player development specialist
                with over 40 years of coaching experience and thousands of students trained. His three
                pillars of coaching — Mental, Technique, and Fitness — address every dimension of the game.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Mental coaching comes first: Mario believes the mind wins or loses matches before the
                first ball is struck. Technique is second — precise, repeatable strokes built on solid
                fundamentals. Fitness is third — the physical foundation that makes everything else possible.
                Through RI Tennis Academy, Mario offers private lessons, group clinics, junior development
                programs, summer camps, and dedicated mental coaching sessions — all designed to build
                confident, resilient, and skilled tennis players.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/mental-coaching">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Brain className="w-4 h-4 mr-2" /> Mental Coaching
                  </Button>
                </Link>
                <Link href="/social">
                  <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                    <Play className="w-4 h-4 mr-2" /> Watch Videos
                  </Button>
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {features.map((f) => (
                <div key={f.title} className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow">
                  <div className="mb-2">{f.icon}</div>
                  <h4 className="font-semibold text-foreground text-sm mb-1">{f.title}</h4>
                  <p className="text-muted-foreground text-xs leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary text-primary-foreground text-center">
        <div className="container max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to <span className="text-accent">Delete Fear</span> and Play Your Best?
          </h2>
          <p className="text-primary-foreground/80 mb-8 text-lg">
            Join RI Tennis Academy and start your journey toward technical excellence and mental mastery.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/programs">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold px-8">
                Get Started Today
              </Button>
            </Link>
            <Link href="/social">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8">
                Follow Our Journey
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
