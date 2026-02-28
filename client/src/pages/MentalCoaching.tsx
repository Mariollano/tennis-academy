import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Target, Shield, Zap, Heart, Star, ChevronRight, MessageSquare } from "lucide-react";
import { trpc } from "@/lib/trpc";

const pillars = [
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Delete Fear",
    desc: "Mario's signature philosophy. Fear is the #1 performance killer in tennis. Learn to identify, confront, and eliminate fear from your game — permanently.",
    color: "bg-red-50 text-red-700",
  },
  {
    icon: <Target className="w-6 h-6" />,
    title: "Focus Under Pressure",
    desc: "Develop the ability to stay present and focused during critical moments — big points, tiebreakers, and match situations that matter most.",
    color: "bg-blue-50 text-blue-700",
  },
  {
    icon: <Heart className="w-6 h-6" />,
    title: "Confidence Building",
    desc: "True confidence isn't given — it's built. Through structured mental exercises and on-court practice, develop unshakeable belief in your abilities.",
    color: "bg-pink-50 text-pink-700",
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Pre-Match Routines",
    desc: "Establish powerful pre-match rituals that prime your mind and body for peak performance. Consistency in preparation leads to consistency in results.",
    color: "bg-amber-50 text-amber-700",
  },
  {
    icon: <Brain className="w-6 h-6" />,
    title: "Mindset Development",
    desc: "Cultivate a growth mindset that turns losses into lessons and setbacks into fuel. Learn to compete with freedom rather than fear of failure.",
    color: "bg-purple-50 text-purple-700",
  },
  {
    icon: <Star className="w-6 h-6" />,
    title: "Peak Performance",
    desc: "Combine technical excellence with mental mastery to enter the 'zone' more consistently. Play your best tennis when it matters most.",
    color: "bg-green-50 text-green-700",
  },
];

const faqs = [
  {
    q: "Who is mental coaching for?",
    a: "Mental coaching is for any player who wants to perform better under pressure — from beginners dealing with nerves to competitive juniors and adults who want to eliminate the mental barriers holding them back.",
  },
  {
    q: "How is mental coaching different from regular lessons?",
    a: "Technical lessons improve your strokes. Mental coaching improves the player behind the strokes. Both are essential for complete development. Mario uniquely offers both in an integrated approach.",
  },
  {
    q: "Can mental coaching be done remotely?",
    a: "Yes. Mental coaching sessions can be conducted in person or virtually, making it accessible regardless of your location.",
  },
  {
    q: "How many sessions do I need?",
    a: "Results vary by player, but most students notice meaningful changes within 3–5 sessions. Ongoing mental coaching is recommended for competitive players.",
  },
];

export default function MentalCoaching() {
  const { data: resources } = trpc.mental.listResources.useQuery();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden py-20 text-white"
        style={{ background: "linear-gradient(135deg, oklch(0.25 0.08 280) 0%, oklch(0.20 0.06 260) 100%)" }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-64 h-64 rounded-full border-4 border-white" />
          <div className="absolute bottom-10 left-10 w-40 h-40 rounded-full border-2 border-white" />
        </div>
        <div className="container relative">
          <Badge className="mb-4 bg-white/20 text-white border-white/30">Mental Performance Coaching</Badge>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 leading-tight">
            Delete Fear.<br />
            <span style={{ color: "oklch(0.72 0.12 80)" }}>Play Free.</span>
          </h1>
          <p className="text-white/80 max-w-2xl text-lg leading-relaxed mb-8">
            Coach Mario Llano is not just a tennis technician — he is a mental performance specialist.
            His "Delete Fear" philosophy has transformed players at every level, helping them unlock
            the confident, fearless game that lives inside every player.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/book/mental_coaching">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold px-8">
                Book a Session <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
              onClick={() => {
                const el = document.getElementById("chat-trigger");
                if (el) el.click();
              }}
            >
              <MessageSquare className="w-4 h-4 mr-2" /> Ask the AI Coach
            </Button>
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="py-16 bg-background">
        <div className="container max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">The Six Pillars of Mental Tennis</h2>
            <p className="text-muted-foreground">
              Mario's mental coaching framework addresses every dimension of the psychological game.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pillars.map((pillar) => (
              <Card key={pillar.title} className="border border-border hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${pillar.color}`}>
                    {pillar.icon}
                  </div>
                  <h3 className="font-bold text-lg text-foreground mb-2">{pillar.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{pillar.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Mario's Story */}
      <section className="py-16 bg-muted/40">
        <div className="container max-w-3xl text-center">
          <Badge className="mb-4 bg-accent/20 text-accent-foreground border-accent/30">Coach Mario's Philosophy</Badge>
          <h2 className="text-3xl font-bold text-foreground mb-6">Why Mental Coaching Matters</h2>
          <div className="space-y-4 text-muted-foreground text-base leading-relaxed text-left">
            <p>
              After years of coaching players of all levels, Mario Llano identified a consistent pattern:
              technical skill alone does not determine performance. The players who succeed under pressure
              are those who have mastered their mental game.
            </p>
            <p>
              Fear — of losing, of making mistakes, of what others think — is the single greatest
              barrier to peak performance in tennis. Mario's "Delete Fear" methodology provides a
              structured, practical approach to identifying and eliminating these mental blocks.
            </p>
            <p>
              Whether you're a junior player dealing with match nerves, an adult recreational player
              who freezes under pressure, or a competitive player looking to close out matches, Mario's
              mental coaching program is designed to unlock the player you already are — without the fear.
            </p>
          </div>
        </div>
      </section>

      {/* Resources */}
      {resources && resources.length > 0 && (
        <section className="py-16 bg-background">
          <div className="container">
            <h2 className="text-2xl font-bold text-foreground mb-8">Mental Coaching Resources</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {resources.map((r) => (
                <Card key={r.id} className="border border-border hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs capitalize">{r.category}</Badge>
                      <CardTitle className="text-lg">{r.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">{r.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="py-16 bg-muted/30">
        <div className="container max-w-3xl">
          <h2 className="text-2xl font-bold text-foreground mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <Card key={faq.q} className="border border-border">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-foreground mb-2">{faq.q}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary text-primary-foreground text-center">
        <div className="container max-w-2xl">
          <h2 className="text-3xl font-bold mb-4">Ready to Delete Fear?</h2>
          <p className="text-primary-foreground/80 mb-8">
            Book a mental coaching session with Mario and start playing the game you know you're capable of.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/book/mental_coaching">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold px-8">
                Book Mental Coaching
              </Button>
            </Link>
            <Link href="/programs">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                View All Programs
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
