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
      style={{
        background: 'linear-gradient(145deg, #d4f000 0%, #b8d900 60%, #9fbf00 100%)',
        boxShadow: '0 4px 0 #7a9400, 0 6px 16px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.35)',
        border: '1px solid rgba(255,255,255,0.2)',
      }}
      className="flex items-center gap-1.5 text-black rounded-full transition-all hover:brightness-105 active:translate-y-[3px] active:shadow-none px-3.5 py-1.5 font-bold text-xs tracking-wide"
    >
      <Download className="w-3.5 h-3.5 shrink-0" />
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

        {/* Top bar: social circles (left) + Download button (right) — single flex row, never overlap */}
        <div className="absolute top-3 left-4 right-4 z-10 flex items-center justify-between gap-3">
          {/* Social circles */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {[
            { href: "https://www.youtube.com/@MarioRITennis", color: "#FF0000", icon: <svg viewBox="0 0 24 24" fill="white" className="w-3 h-3"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg> },
            { href: "https://instagram.com/deletefearwithmario", color: "#E1306C", icon: <svg viewBox="0 0 24 24" fill="white" className="w-3 h-3"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg> },
            { href: "https://facebook.com/RITennisAcademy", color: "#1877F2", icon: <svg viewBox="0 0 24 24" fill="white" className="w-3 h-3"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
            { href: "https://x.com/ritennisacademy", color: "#000000", icon: <svg viewBox="0 0 24 24" fill="white" className="w-3 h-3"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
            { href: "https://tiktok.com/@deletefear", color: "#010101", icon: <svg viewBox="0 0 24 24" fill="white" className="w-3 h-3"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/></svg> },
          ].map(({ href, color, icon }) => (
            <a key={href} href={href} target="_blank" rel="noopener noreferrer"
              className="relative group transition-all hover:scale-110"
              title={href}>
              {/* Profile photo circle */}
              <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-full overflow-hidden border-2 border-white/60 shadow-lg">
                <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663342968318/kzZFsCRUb4iWMZR8LEwAKz/mario-us-open-social_9583b750.jpg"
                  alt="Mario" className="w-full h-full object-cover object-top" />
              </div>
              {/* Platform icon badge */}
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shadow-md border border-white"
                style={{ backgroundColor: color }}>
                {icon}
              </div>
            </a>
          ))}
          </div>
          {/* Download App button — right side, always separated from circles */}
          <div className="shrink-0">
            <InstallAppInlineButton />
          </div>
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
