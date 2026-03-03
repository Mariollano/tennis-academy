import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Target, Shield, Zap, Heart, Star, ChevronRight, MessageSquare } from "lucide-react";
import { trpc } from "@/lib/trpc";

const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310519663342968318/kzZFsCRUb4iWMZR8LEwAKz";

const HERO_IMG = `${CDN}/mental-coaching-hero-NJwttZzthSUWB95CtU2ivV.webp`;
const FEAR_ICON = `${CDN}/mental-fear-icon-hndjHscMfm9th9BiDfzt5h.webp`;
const FOCUS_ICON = `${CDN}/mental-focus-icon-NsuWDtWYa4tYtgfb7ZzeTK.webp`;
const CONFIDENCE_ICON = `${CDN}/mental-confidence-icon-CAwHdnGzHrSbUcMfnpx2nF.webp`;

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
      {/* Hero — full brain graphic background */}
      <section className="relative overflow-hidden min-h-[520px] flex items-center text-white">
        <img
          src={HERO_IMG}
          alt="Mental coaching — brain with tennis court"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent" />
        <div className="container relative z-10 py-20">
          <Badge className="mb-4 bg-white/20 text-white border-white/30">Mental Performance Coaching</Badge>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 leading-tight">
            Delete Fear.<br />
            <span style={{ color: "oklch(0.85 0.22 130)" }}>Play Free.</span>
          </h1>
          <p className="text-white/80 max-w-xl text-lg leading-relaxed mb-8">
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

      {/* Three Core Pillars with AI graphics */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container">
          <div className="text-center mb-12">
            <Badge className="mb-3 bg-white/20 text-white border-white/30">The Core Framework</Badge>
            <h2 className="text-3xl font-bold">Three Pillars of Mental Freedom</h2>
            <p className="text-primary-foreground/70 mt-2 max-w-xl mx-auto">
              Every mental coaching session is built around these three transformative principles.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                img: FEAR_ICON,
                title: "Delete Fear",
                desc: "Identify, confront, and permanently eliminate the fear responses that hold your game back. Fear is learned — and it can be unlearned.",
              },
              {
                img: FOCUS_ICON,
                title: "Laser Focus",
                desc: "Train your mind to lock in on what matters during big points, tiebreakers, and high-pressure moments. Stay present, stay sharp.",
              },
              {
                img: CONFIDENCE_ICON,
                title: "Unshakeable Confidence",
                desc: "Build the kind of deep, earned confidence that doesn't waver under pressure. Compete freely — not to survive, but to thrive.",
              },
            ].map((item) => (
              <div key={item.title} className="flex flex-col items-center text-center">
                <img
                  src={item.img}
                  alt={item.title}
                  className="w-36 h-36 object-contain mb-5 drop-shadow-2xl"
                />
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-primary-foreground/70 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Six Pillars */}
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

      {/* YouTube Shorts */}
      <section className="py-16 bg-background">
        <div className="container">
          <div className="text-center mb-10">
            <Badge className="mb-3 bg-red-100 text-red-700 border-red-200">
              <svg className="w-3.5 h-3.5 mr-1.5 inline" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              YouTube Shorts
            </Badge>
            <h2 className="text-3xl font-bold text-foreground mb-3">Mental Game Insights</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Coach Mario shares quick, powerful mental coaching tips on YouTube. Watch these shorts
              to get a taste of the "Delete Fear" philosophy in action.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 max-w-5xl mx-auto">
            {[
              { id: "-Q65jiJH1Bg", title: "Comfort is the ENEMY. Your brain wants you to be a loser. Why?", thumb: "https://i.ytimg.com/vi/-Q65jiJH1Bg/hq2.jpg" },
              { id: "1FGAqbl0-Fo", title: "You are DOING IT all WRONG!", thumb: "https://i.ytimg.com/vi/1FGAqbl0-Fo/hq2.jpg" },
              { id: "T-zSAHSveo0", title: "\"THE ZONE\" is Bull Sh….t! 🔥", thumb: "https://i.ytimg.com/vi/T-zSAHSveo0/hq2.jpg" },
              { id: "BD7MTizqBHM", title: "CHOKING IS a LIE! And here's WHY! 🔥", thumb: "https://i.ytimg.com/vi/BD7MTizqBHM/hq2.jpg" },
              { id: "RilXhfnEQjA", title: "KEEP CHOKING! WHY WIN?", thumb: "https://i.ytimg.com/vi/RilXhfnEQjA/hq2.jpg" },
              { id: "Ldr5d-rOT3k", title: "Como DESHACERTE de tu PROFE!", thumb: "https://i.ytimg.com/vi/Ldr5d-rOT3k/hq2.jpg" },
              { id: "9xrs2LVybJA", title: "Your Words Build Your Future — Choose Solutions.", thumb: "https://i.ytimg.com/vi/9xrs2LVybJA/hq2.jpg" },
            ].map((short) => (
              <a
                key={short.id}
                href={`https://youtube.com/shorts/${short.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group block rounded-2xl overflow-hidden border border-border hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-card"
              >
                <div className="relative aspect-[9/16] bg-black overflow-hidden">
                  <img
                    src={short.thumb}
                    alt={short.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-red-600/90 flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:bg-red-600 transition-all duration-300">
                      <svg className="w-6 h-6 text-white ml-1" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-red-600 text-white text-xs border-0">Short</Badge>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-10">
                    <p className="text-white text-xs font-semibold leading-snug line-clamp-3">{short.title}</p>
                  </div>
                </div>
              </a>
            ))}
          </div>

          <div className="text-center mt-8">
            <a
              href="https://www.youtube.com/@MarioRITennis"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="gap-2 border-red-200 text-red-700 hover:bg-red-50">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                View All Shorts on YouTube
              </Button>
            </a>
          </div>
        </div>
      </section>

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
