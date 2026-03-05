import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Trophy, Brain, Users, Sun, Star, ChevronRight,
  Calendar, MessageSquare, Play, Zap, Images, Download
} from "lucide-react";

const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310519663342968318/kzZFsCRUb4iWMZR8LEwAKz";
const MARIO_PHOTO = `${CDN}/mario-us-open_68ad2763.jpg`;

const photos = {
  hero:     `${CDN}/IMG_2867_fa17ab01.jpg`,   // action backhand, fall foliage
  heroAlt:  `${CDN}/IMG_2886_220d66ff.jpg`,   // grass court player
  group:    `${CDN}/IMG_2882_4dfd31c8.jpg`,   // Mario + 20 juniors group photo
  highFive: `${CDN}/IMG_2891_c12742f2.jpg`,   // girl high-fiving coach
  trophy:   `${CDN}/IMG_2866_846b0ea1.jpg`,   // championship trophy girls
  hoodies:  `${CDN}/IMG_2865_0694faf1.jpg`,   // 3 juniors in tennis hoodies
  action1:  `${CDN}/IMG_2881_baaab9b5.jpg`,   // boy backhand clay court
  action2:  `${CDN}/IMG_2883_18ff44ca.jpg`,   // boy forehand jumping
  action3:  `${CDN}/IMG_2885_b0ce7285.jpg`,   // young child forehand
  action4:  `${CDN}/IMG_2887_9adc372b.jpg`,   // boy orange shirt forehand
  junior:   `${CDN}/IMG_2884_19472c09.jpg`,   // boy in Tennis Academy shirt
  smile:    `${CDN}/IMG_2892_41ec0d25.jpg`,   // smiling girl on court
};

const galleryImages = [
  { src: photos.group,    alt: "Summer camp group with Coach Mario" },
  { src: photos.action1,  alt: "Junior player backhand" },
  { src: photos.trophy,   alt: "Championship trophy winners" },
  { src: photos.action2,  alt: "Junior player forehand jump" },
  { src: photos.highFive, alt: "High five after great shot" },
  { src: photos.hoodies,  alt: "Junior players in custom tennis hoodies" },
  { src: photos.action3,  alt: "Young player forehand" },
  { src: photos.smile,    alt: "Happy student on court" },
  { src: photos.action4,  alt: "Junior player forehand" },
  { src: photos.junior,   alt: "Junior in Tennis Academy shirt" },
  { src: photos.heroAlt,  alt: "Advanced player on grass court" },
  { src: photos.hero,     alt: "Player backhand follow-through" },
];

const programs = [
  {
    icon: <Trophy className="w-6 h-6" />,
    title: "Private Lessons",
    desc: "One-on-one personalized coaching tailored to your skill level and goals. $120/hour.",
    badge: "All Levels",
    href: "/book/private_lesson",
    color: "bg-blue-50 text-blue-700",
    img: photos.heroAlt,
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "105 Game Clinic",
    desc: "The signature adult group experience — competitive play, drills, and fun. $35 per 1.5hr session.",
    badge: "Adults",
    href: "/book/clinic_105",
    color: "bg-amber-50 text-amber-700",
    img: photos.smile,
  },
  {
    icon: <Star className="w-6 h-6" />,
    title: "Junior Programs",
    desc: "Fall & Spring programs for young players. Daily sessions or weekly packages available.",
    badge: "Juniors",
    href: "/book/junior_daily",
    color: "bg-green-50 text-green-700",
    img: photos.hoodies,
  },
  {
    icon: <Sun className="w-6 h-6" />,
    title: "Summer Camp",
    desc: "Technique, matchplay, fitness & mental coaching. 9 AM–2 PM with optional after-camp until 5 PM.",
    badge: "Summer",
    href: "/book/summer_camp_daily",
    color: "bg-orange-50 text-orange-700",
    img: photos.group,
  },
  {
    icon: <Brain className="w-6 h-6" />,
    title: "Mental Coaching",
    desc: "Unlock your mental game. Overcome fear, build confidence, and perform under pressure.",
    badge: "All Ages",
    href: "/mental-coaching",
    color: "bg-purple-50 text-purple-700",
    img: photos.highFive,
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

function InstallAppInlineButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [dismissed, setDismissed] = useState(false);

  useState(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) { setDismissed(true); return; }
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  });

  if (dismissed) return null;

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    } else {
      // Fallback: show instructions
      alert('To install: tap the Share button in your browser, then "Add to Home Screen"');
    }
  };

  return (
    <button
      onClick={handleInstall}
      title="Download the App"
      className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-black rounded-full shadow-lg border-2 border-white/30 transition-all hover:scale-105 active:scale-95 px-4 py-2.5 font-bold text-sm"
    >
      <Download className="w-4 h-4 shrink-0" />
      <span className="whitespace-nowrap">Download the App</span>
    </button>
  );
}


export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden text-white min-h-[600px] flex items-center">
        {/* Background photo */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${photos.hero})` }}
        />
        {/* Dark overlay for readability */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(10,10,10,0.85) 0%, rgba(13,27,62,0.80) 50%, rgba(26,47,94,0.65) 100%)" }} />

        {/* Download App button - top right corner */}
        <div className="absolute top-4 right-4 z-10">
          <InstallAppInlineButton />
        </div>

        <div className="container relative py-24 md:py-32">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Badge className="bg-accent/20 text-accent border-accent/30 text-sm px-3 py-1">
                Rhode Island's Premier Tennis Academy
              </Badge>
              <Link href="/schedule">
                <button className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 border border-white/30 text-white rounded-full px-3 py-1 text-xs font-semibold transition-colors">
                  <Calendar className="w-3 h-3" /> View Schedule
                </button>
              </Link>
            </div>
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
              <Link href="/gallery">
                <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 font-semibold px-8">
                  <Images className="w-4 h-4 mr-2" /> Photo Gallery
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
                {/* Program photo */}
                <div className="h-44 overflow-hidden">
                  <img
                    src={p.img}
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
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
            {/* Coach photo + academy photos */}
            <div className="space-y-4">
              {/* Mario's US Open portrait — hero image */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={MARIO_PHOTO}
                  alt="Coach Mario Llano at the US Open"
                  className="w-full h-80 object-cover object-top"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-5">
                  <p className="text-white font-extrabold text-lg">Coach Mario Llano</p>
                  <p className="text-accent text-sm font-semibold">US Open • 40+ Years Experience</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl overflow-hidden shadow-md">
                  <img src={photos.highFive} alt="High five on court" className="w-full h-36 object-cover" />
                </div>
                <div className="rounded-xl overflow-hidden shadow-md">
                  <img src={photos.group} alt="Coach Mario with students" className="w-full h-36 object-cover object-top" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Photo Strip */}
      <section className="section-padding bg-background">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Life at RI Tennis Academy</h2>
              <p className="text-muted-foreground mt-1">Real moments from the court</p>
            </div>
            <Link href="/gallery">
              <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                <Images className="w-4 h-4 mr-2" /> View All Photos
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {galleryImages.slice(0, 8).map((img, i) => (
              <div
                key={i}
                className={`rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow ${i === 0 ? "md:col-span-2 md:row-span-2" : ""}`}
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  className={`w-full object-cover hover:scale-105 transition-transform duration-500 ${i === 0 ? "h-64 md:h-full" : "h-40"}`}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features strip */}
      <section className="py-12 bg-muted/30">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="mb-2">{f.icon}</div>
                <h4 className="font-semibold text-foreground text-sm mb-1">{f.title}</h4>
                <p className="text-muted-foreground text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
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
