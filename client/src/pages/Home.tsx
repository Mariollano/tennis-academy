import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Trophy, Brain, Users, Sun, Star, ChevronRight,
  Calendar, MessageSquare, Play, Zap, Download,
  MapPin, Phone, Mail, ArrowRight, CheckCircle,
  Clock, DollarSign, Shield, Award, TrendingUp, Mic,
  Lightbulb, RefreshCw
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";

function useCountUp(target: number, duration = 1500, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

function AnimatedStat({ value, label, icon: Icon }: { value: string; label: string; icon: React.ElementType }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const numMatch = value.match(/(\d+)/);
  const num = numMatch ? parseInt(numMatch[1]) : null;
  const count = useCountUp(num ?? 0, 1200, visible);
  const display = num !== null ? value.replace(String(num), String(count)) : value;
  return (
    <div ref={ref} className="flex flex-col items-center text-center px-4">
      <Icon className="w-5 h-5 text-accent mb-2 opacity-80" />
      <div className="text-3xl font-extrabold text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{visible ? display : '0'}</div>
      <div className="text-white/50 text-xs uppercase tracking-wider mt-0.5">{label}</div>
    </div>
  );
}

const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310519663342968318/kzZFsCRUb4iWMZR8LEwAKz";
const MARIO_PHOTO = `${CDN}/mario-us-open_68ad2763.jpg`;
const MARIO_SOCIAL = `${CDN}/mario-us-open-social_9583b750.jpg`;

const photos = {
  hero:     `${CDN}/IMG_2867_fa17ab01.jpg`,
  heroAlt:  `${CDN}/IMG_2886_220d66ff.jpg`,
  group:    `${CDN}/IMG_2882_4dfd31c8.jpg`,
  highFive: `${CDN}/IMG_2891_c12742f2.jpg`,
  trophy:   `${CDN}/IMG_2866_846b0ea1.jpg`,
  hoodies:  `${CDN}/IMG_2865_0694faf1.jpg`,
  action1:  `${CDN}/IMG_2881_baaab9b5.jpg`,
  action2:  `${CDN}/IMG_2883_18ff44ca.jpg`,
  action3:  `${CDN}/IMG_2885_b0ce7285.jpg`,
  action4:  `${CDN}/IMG_2887_9adc372b.jpg`,
  junior:   `${CDN}/IMG_2884_19472c09.jpg`,
  smile:    `${CDN}/IMG_2892_41ec0d25.jpg`,
};

const socialLinks = [
  { href: "https://www.youtube.com/@MarioRITennis", label: "YouTube", color: "#FF0000", icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg> },
  { href: "https://instagram.com/deletefearwithmario", label: "Instagram", color: "#E1306C", icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg> },
  { href: "https://facebook.com/RITennisAcademy", label: "Facebook", color: "#1877F2", icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
  { href: "https://x.com/ritennisacademy", label: "X / Twitter", color: "#000000", icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
  { href: "https://tiktok.com/@deletefear", label: "TikTok", color: "#010101", icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/></svg> },
];

const programs = [
  {
    icon: Trophy,
    title: "Private Lessons",
    desc: "One-on-one personalized coaching tailored to your skill level and goals.",
    price: "$120/hour",
    badge: "All Levels",
    href: "/book/private_lesson",
    img: photos.heroAlt,
    color: "from-blue-600 to-blue-800",
  },
  {
    icon: Users,
    title: "105 Game Clinic",
    desc: "The signature adult group experience — competitive play, drills, and fun.",
    price: "$35/session",
    badge: "Adults",
    href: "/book/clinic_105",
    img: photos.smile,
    color: "from-amber-500 to-orange-600",
  },
  {
    icon: Star,
    title: "Junior Programs",
    desc: "Fall & Spring programs for young players. Daily or weekly packages.",
    price: "From $80/day",
    badge: "Juniors",
    href: "/book/junior_daily",
    img: photos.hoodies,
    color: "from-green-500 to-emerald-700",
  },
  {
    icon: Sun,
    title: "Summer Camp",
    desc: "Technique, matchplay, fitness & mental coaching. 9 AM–2 PM daily.",
    price: "From $90/day",
    badge: "Summer",
    href: "/book/summer_camp_daily",
    img: photos.group,
    color: "from-orange-500 to-red-600",
  },
  {
    icon: Brain,
    title: "Mental Coaching",
    desc: "Unlock your mental game. Overcome fear, build confidence, perform under pressure.",
    price: "Contact for pricing",
    badge: "All Ages",
    href: "/mental-coaching",
    img: photos.highFive,
    color: "from-purple-600 to-violet-800",
  },
];

const stats = [
  { value: "40+", label: "Years Coaching", icon: Award },
  { value: "1,000s", label: "Students Trained", icon: Users },
  { value: "5", label: "Program Types", icon: Trophy },
  { value: "RI #1", label: "Tennis Academy", icon: Star },
];

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

function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);
    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (isStandalone) return null;

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    } else {
      alert('To install: tap the Share button in your browser, then "Add to Home Screen"');
    }
  };

  return (
    <button
      onClick={handleInstall}
      className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold text-primary transition-all hover:scale-105 active:scale-95"
      style={{
        background: 'linear-gradient(145deg, #d4f000 0%, #b8d900 60%, #9fbf00 100%)',
        boxShadow: '0 4px 0 #7a9400, 0 6px 16px rgba(0,0,0,0.35)',
      }}
    >
      <Download className="w-4 h-4" />
      <span>Download App</span>
    </button>
  );
}

const faqItems = [
  { q: "What programs do you offer?", a: "We offer Private Lessons ($120/hr), 105 Game Adult Clinics ($35/session), Junior Programs (Mon–Fri, $80/day or $350/week), Summer Camp ($90/day or $420/week), and Mental Coaching. All programs are available for online booking." },
  { q: "How do I book a session?", a: "Simply click 'Book Now' in the navigation, choose your program, pick an available date and time, and pay securely online. You'll receive instant email and SMS confirmation." },
  { q: "What is the 105 Game Clinic?", a: "The 105 Game Clinic is Coach Mario's signature adult group program. It runs on Mondays, Wednesdays, Fridays (12 spots) and Sundays (24 spots), 9:00–10:30 AM. It combines competitive drills, match play, and technique work in a fun group setting." },
  { q: "Do you offer beginner lessons?", a: "Absolutely! Coach Mario works with all skill levels, from complete beginners to competitive tournament players. Private lessons are the best starting point for beginners." },
  { q: "What is the 'Delete Fear' methodology?", a: "Delete Fear is Coach Mario's mental performance coaching system. It helps players identify and eliminate the psychological barriers — fear of failure, pressure, choking — that prevent them from playing their best tennis." },
  { q: "Can I cancel or reschedule a booking?", a: "Yes. You can cancel a confirmed booking from your Profile page. For rescheduling, please contact Coach Mario directly at ritennismario@gmail.com or (401) 965-5873." },
  { q: "Do you offer promo codes or discounts?", a: "Yes! We occasionally offer promo codes for new students and special events. Check with Coach Mario or sign up for SMS updates to receive exclusive offers." },
  { q: "Where are you located?", a: "RI Tennis Academy is based in Rhode Island. Specific court locations are confirmed upon booking. Contact Coach Mario at (401) 965-5873 for details." },
];

const categoryColors: Record<string, string> = {
  mindset: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  focus: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  pressure: "bg-red-500/15 text-red-400 border-red-500/30",
  confidence: "bg-green-500/15 text-green-400 border-green-500/30",
  routine: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  general: "bg-accent/15 text-accent-foreground border-accent/30",
};

function TipOfTheWeekSection() {
  const { data: tip, isLoading, refetch } = trpc.mental.getTipOfWeek.useQuery();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <section className="py-20 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1e293b 50%, #0F172A 100%)' }}>
      {/* Decorative tennis ball accent */}
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-5" style={{ background: 'radial-gradient(circle, #FACC15 0%, transparent 70%)' }} />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full opacity-5" style={{ background: 'radial-gradient(circle, #2563EB 0%, transparent 70%)' }} />
      <div className="container relative">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FACC15, #f59e0b)' }}>
                <Lightbulb className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-accent mb-1">Mental Performance</p>
                <h2 className="text-3xl md:text-4xl font-extrabold text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>TIP OF THE WEEK</h2>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              className="p-2 rounded-xl text-white/40 hover:text-white/80 hover:bg-white/10 transition-all"
              title="Get another tip"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Tip Card */}
          {isLoading ? (
            <div className="rounded-3xl border border-white/10 p-8 animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div className="h-5 bg-white/10 rounded-full w-24 mb-6" />
              <div className="h-8 bg-white/10 rounded-full w-3/4 mb-4" />
              <div className="space-y-2">
                <div className="h-4 bg-white/10 rounded-full" />
                <div className="h-4 bg-white/10 rounded-full w-5/6" />
                <div className="h-4 bg-white/10 rounded-full w-4/6" />
              </div>
            </div>
          ) : tip ? (
            <div
              className="rounded-3xl border border-white/10 p-8 md:p-10 transition-all hover:border-accent/30"
              style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)' }}
            >
              {/* Category badge */}
              {tip.category && (
                <Badge className={`mb-5 text-xs font-bold uppercase tracking-wider border ${categoryColors[tip.category] || categoryColors.general}`}>
                  {tip.category}
                </Badge>
              )}
              {/* Title */}
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-5 leading-tight">{tip.title}</h3>
              {/* Content */}
              <p className="text-white/70 leading-relaxed text-base md:text-lg">{tip.content}</p>
              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center">
                    <span className="text-accent font-bold text-sm">M</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">Coach Mario Llano</p>
                    <p className="text-white/40 text-xs">Mental Performance Coach</p>
                  </div>
                </div>
                <Link href="/mental-coaching">
                  <Button size="sm" className="rounded-full text-primary font-bold" style={{ background: 'linear-gradient(135deg, #FACC15, #f59e0b)' }}>
                    More Tips <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-white/10 p-8 text-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <Brain className="w-12 h-12 text-accent/50 mx-auto mb-4" />
              <p className="text-white/50">Mental coaching tips coming soon.</p>
              <Link href="/mental-coaching">
                <Button variant="outline" className="mt-4 border-white/20 text-white hover:bg-white/10">Explore Mental Coaching</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-3">
      {faqItems.map(({ q, a }, i) => (
        <div key={i} className="bg-card rounded-2xl border border-border overflow-hidden">
          <button
            className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/30 transition-colors"
            onClick={() => setOpen(open === i ? null : i)}
          >
            <span className="font-semibold text-foreground text-sm md:text-base pr-4">{q}</span>
            <ChevronRight className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-200 ${open === i ? 'rotate-90' : ''}`} />
          </button>
          {open === i && (
            <div className="px-5 pb-5">
              <p className="text-muted-foreground text-sm leading-relaxed">{a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen">
      {/* ═══════════════════════════════════════════════════════════════
          HERO SECTION — Full-bleed with action photo
      ═══════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background photo */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
          style={{ backgroundImage: `url(${photos.hero})` }}
        />
        {/* Premium dark overlay */}
        <div className="absolute inset-0 hero-overlay" />
        {/* Subtle texture overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)'
        }} />

        {/* Social links — top left */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
          {socialLinks.map(({ href, label, color, icon }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              title={label}
              className="relative group"
            >
              <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/30 shadow-lg group-hover:border-white/70 transition-all group-hover:scale-110">
                <img src={MARIO_SOCIAL} alt="Mario" className="w-full h-full object-cover object-top" />
              </div>
              <div
                className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-white shadow-md"
                style={{ backgroundColor: color }}
              >
                <span className="scale-75">{icon}</span>
              </div>
            </a>
          ))}
        </div>

        {/* Download app button — top right */}
        <div className="absolute top-4 right-4 z-10">
          <InstallAppButton />
        </div>

        {/* Hero content */}
        <div className="relative z-10 container py-24 pt-28">
          <div className="max-w-3xl">
            {/* Eyebrow */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-0.5 bg-accent" />
              <span className="text-accent text-sm font-bold tracking-[0.2em] uppercase">Rhode Island's Premier Tennis Academy</span>
            </div>

            {/* Main headline */}
            <h1 className="text-white mb-6" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 'clamp(3rem, 8vw, 6rem)', fontWeight: 800, lineHeight: 0.95, letterSpacing: '-0.01em' }}>
              ELEVATE YOUR GAME.<br />
              <span className="text-accent">MASTER YOUR MIND.</span>
            </h1>

            {/* Subheadline */}
            <p className="text-white/80 text-lg md:text-xl mb-10 max-w-xl leading-relaxed">
              Private lessons, group clinics, junior programs, and mental coaching — all designed to take your game to the next level.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 mb-10">
              <Link href="/programs">
                <Button
                  size="lg"
                  className="bg-accent text-accent-foreground hover:brightness-105 font-bold text-base px-8 py-6 rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-105 active:scale-95"
                >
                  Book a Session
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/mental-coaching">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/40 text-white hover:bg-white/10 hover:border-white/70 font-semibold text-base px-8 py-6 rounded-full transition-all"
                >
                  Mental Coaching
                </Button>
              </Link>
            </div>

            {/* ── Voice Booking Hero Button ── */}
            <div className="flex items-center gap-5 mb-12">
              <button
                onClick={() => {
                  const event = new CustomEvent('open-voice-booking');
                  window.dispatchEvent(event);
                }}
                className="group relative flex items-center justify-center w-20 h-20 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 focus:outline-none focus:ring-4 focus:ring-accent/50"
                style={{
                  background: 'radial-gradient(circle at 35% 35%, #facc15, #f59e0b)',
                  boxShadow: '0 0 0 0 rgba(250,204,21,0.5)',
                  animation: 'voice-pulse 2.5s ease-in-out infinite',
                }}
                aria-label="Book by voice"
              >
                {/* Ripple rings */}
                <span className="absolute inset-0 rounded-full bg-accent/30 animate-ping" style={{ animationDuration: '2s' }} />
                <span className="absolute inset-[-8px] rounded-full border-2 border-accent/40 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.3s' }} />
                <Mic className="w-9 h-9 text-black relative z-10 drop-shadow-sm group-hover:scale-110 transition-transform" />
              </button>
              <div>
                <p className="text-white font-bold text-lg leading-tight" style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.03em' }}>BOOK BY VOICE</p>
                <p className="text-white/60 text-sm">Say "Private lesson March 22 at 11 AM"</p>
              </div>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center gap-6">
              {[
                { icon: Shield, text: "Secure Online Booking" },
                { icon: Clock, text: "Flexible Scheduling" },
                { icon: CheckCircle, text: "40+ Years Experience" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-white/70 text-sm">
                  <Icon className="w-4 h-4 text-accent" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-white/40">
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-white/40 to-transparent" />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          STATS BAR
      ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-primary py-6">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x divide-white/10">
            {stats.map(({ value, label, icon }) => (
              <AnimatedStat key={label} value={value} label={label} icon={icon} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          QUICK BOOK STRIP — Horizontal program selector
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-8 bg-background border-b border-border">
        <div className="container">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-extrabold text-foreground" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>QUICK BOOK</h2>
                <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                  Booking Open
                </span>
              </div>
              <p className="text-muted-foreground text-xs mt-0.5">Select a program and book instantly — no phone calls needed</p>
            </div>
            <Link href="/schedule">
              <Button variant="outline" size="sm" className="rounded-full text-xs gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> View Full Schedule
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { label: "Private Lesson", price: "$120/hr", href: "/book/private_lesson", color: "bg-blue-600", emoji: "🎾" },
              { label: "105 Clinic", price: "$35", href: "/book/clinic_105", color: "bg-amber-500", emoji: "👥" },
              { label: "Junior Program", price: "$80/day", href: "/book/junior_daily", color: "bg-green-600", emoji: "⭐" },
              { label: "Summer Camp", price: "$90/day", href: "/book/summer_camp_daily", color: "bg-orange-500", emoji: "☀️" },
              { label: "Mental Coaching", price: "Contact", href: "/mental-coaching", color: "bg-purple-600", emoji: "🧠" },
            ].map(({ label, price, href, color, emoji }) => (
              <Link key={href} href={href}>
                <div className="group flex flex-col items-center text-center p-4 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer">
                  <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform`}>
                    {emoji}
                  </div>
                  <div className="font-semibold text-foreground text-sm leading-tight mb-1">{label}</div>
                  <div className="text-accent font-bold text-xs">{price}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          PROGRAMS SECTION
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-background">
        <div className="container">
          {/* Section header */}
          <div className="text-center mb-14">
            <Badge className="mb-4 bg-accent/15 text-accent-foreground border-accent/30 font-semibold">
              Programs & Pricing
            </Badge>
            <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4" style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '-0.01em' }}>
              FIND YOUR PERFECT PROGRAM
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From beginners to competitive players — every program is designed to accelerate your development and love for the game.
            </p>
          </div>

          {/* Programs grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((program) => {
              const Icon = program.icon;
              return (
                <Link key={program.title} href={program.href}>
                  <div className="group relative overflow-hidden rounded-2xl cursor-pointer card-hover h-72 shadow-md">
                    {/* Background photo */}
                    <img
                      src={program.img}
                      alt={program.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    {/* Gradient overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-t ${program.color} opacity-75 group-hover:opacity-85 transition-opacity`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Content */}
                    <div className="absolute inset-0 p-6 flex flex-col justify-between">
                      <div className="flex items-start justify-between">
                        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                          <Icon className="w-5 h-5" />
                        </div>
                        <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm text-xs">
                          {program.badge}
                        </Badge>
                      </div>

                      <div>
                        <h3 className="text-white font-bold text-xl mb-1 leading-tight">{program.title}</h3>
                        <p className="text-white/80 text-sm mb-3 leading-relaxed">{program.desc}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-accent font-bold text-sm">{program.price}</span>
                          <div className="flex items-center gap-1 text-white/70 text-sm group-hover:text-white transition-colors">
                            <span>Book Now</span>
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}

            {/* View All Programs card */}
            <Link href="/programs">
              <div className="group relative overflow-hidden rounded-2xl cursor-pointer card-hover h-72 shadow-md bg-primary flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4 group-hover:bg-accent/30 transition-colors">
                    <ChevronRight className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="text-white font-bold text-xl mb-2">View All Programs</h3>
                  <p className="text-white/60 text-sm">Explore pricing, schedules, and more details</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          COACH MARIO SECTION
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Photo */}
            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/5] max-w-md mx-auto lg:mx-0">
                <img
                  src={MARIO_PHOTO}
                  alt="Coach Mario Llano at the US Open"
                  className="w-full h-full object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent" />
                {/* Badge overlay */}
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                        <Award className="w-5 h-5 text-accent-foreground" />
                      </div>
                      <div>
                        <div className="text-white font-bold text-sm">Coach Mario Llano</div>
                        <div className="text-white/70 text-xs">US Open Attendee · 40+ Years Experience</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Decorative element */}
              <div className="absolute -bottom-4 -right-4 w-32 h-32 rounded-full bg-accent/10 -z-10" />
              <div className="absolute -top-4 -left-4 w-20 h-20 rounded-full bg-primary/10 -z-10" />
            </div>

            {/* Content */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-0.5 bg-accent" />
                <span className="text-accent text-sm font-bold tracking-[0.2em] uppercase">Meet Your Coach</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-6" style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '-0.01em' }}>
                COACH MARIO LLANO
              </h2>
              <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                With over 40 years of coaching experience, Coach Mario has trained thousands of players from beginners to competitive athletes. His unique approach combines technical excellence with mental performance coaching — the "Delete Fear" methodology.
              </p>
              <p className="text-muted-foreground text-base mb-8 leading-relaxed">
                Mario is not just a tennis coach — he's a mental performance expert who helps players overcome the psychological barriers that hold them back. His programs are designed to develop the complete player: technique, tactics, fitness, and mindset.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { label: "Private Lessons", value: "Personalized 1-on-1" },
                  { label: "Group Clinics", value: "Mon, Wed, Fri, Sun" },
                  { label: "Junior Programs", value: "Ages 5–18" },
                  { label: "Mental Coaching", value: "Delete Fear Method" },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-card rounded-xl p-4 border border-border">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{label}</div>
                    <div className="font-semibold text-foreground text-sm">{value}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/programs">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-6 rounded-full">
                    View Programs
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/mental-coaching">
                  <Button variant="outline" className="font-semibold px-6 rounded-full">
                    Mental Coaching
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          HOW IT WORKS
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container">
          <div className="text-center mb-14">
            <Badge className="mb-4 bg-accent/20 text-accent border-accent/30 font-semibold">
              Simple Process
            </Badge>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              BOOK IN 3 EASY STEPS
            </h2>
            <p className="text-primary-foreground/70 text-lg max-w-xl mx-auto">
              Getting on the court has never been easier. No phone calls, no back-and-forth — just pick, pay, and play.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: "01",
                icon: Calendar,
                title: "Choose Your Program",
                desc: "Browse private lessons, clinics, junior programs, or summer camp. Pick the one that fits your goals.",
              },
              {
                step: "02",
                icon: Clock,
                title: "Pick a Date & Time",
                desc: "Select from available slots on the calendar. See real-time availability — no guessing.",
              },
              {
                step: "03",
                icon: CheckCircle,
                title: "Pay & Get Confirmed",
                desc: "Secure payment online. Receive instant confirmation via email and SMS.",
              },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="relative">
                <div className="bg-white/5 rounded-2xl p-8 border border-white/10 hover:bg-white/10 transition-colors h-full">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="text-accent/30 font-extrabold text-5xl leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                      {step}
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mt-1">
                      <Icon className="w-6 h-6 text-accent" />
                    </div>
                  </div>
                  <h3 className="text-white font-bold text-xl mb-3">{title}</h3>
                  <p className="text-primary-foreground/60 text-sm leading-relaxed">{desc}</p>
                </div>
                {/* Connector arrow */}
                {step !== "03" && (
                  <div className="hidden md:flex absolute top-1/2 -right-4 -translate-y-1/2 z-10 w-8 h-8 items-center justify-center">
                    <ChevronRight className="w-6 h-6 text-accent/40" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/programs">
              <Button
                size="lg"
                className="bg-accent text-accent-foreground hover:brightness-105 font-bold text-base px-10 py-6 rounded-full shadow-xl"
              >
                Book Your First Session
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          GALLERY — Masonry-style grid
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-14">
            <Badge className="mb-4 bg-accent/15 text-accent-foreground border-accent/30 font-semibold">
              Gallery
            </Badge>
            <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              LIFE AT RI TENNIS ACADEMY
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              From championship wins to first forehands — every moment on the court is a step forward.
            </p>
          </div>

          {/* Gallery grid */}
          <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
            {galleryImages.map((img, i) => (
              <div
                key={i}
                className="break-inside-avoid overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer"
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  className="w-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/social">
              <Button variant="outline" size="lg" className="font-semibold px-8 rounded-full">
                View Social Media Feed
                <Play className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FEATURES / WHY CHOOSE US
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-0.5 bg-accent" />
                <span className="text-accent text-sm font-bold tracking-[0.2em] uppercase">Why RI Tennis Academy</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-6" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                EVERYTHING YOU NEED TO SUCCEED
              </h2>
              <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                We've built the most complete tennis experience in Rhode Island — from world-class coaching to seamless online booking and automated reminders.
              </p>

              <div className="space-y-5">
                {[
                  { icon: Calendar, title: "Easy Online Booking", desc: "Book any program, pay securely, and manage your schedule — all in one place." },
                  { icon: MessageSquare, title: "AI-Powered Q&A", desc: "Get instant answers about technique, mental game, and academy programs 24/7." },
                  { icon: Zap, title: "Automated Reminders", desc: "Never miss a session — receive email and SMS reminders before every lesson." },
                  { icon: TrendingUp, title: "Track Your Progress", desc: "View your booking history, upcoming sessions, and development over time." },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature image */}
            <div className="relative">
              <div className="rounded-3xl overflow-hidden shadow-2xl aspect-square max-w-md mx-auto">
                <img
                  src={photos.action2}
                  alt="Junior player in action"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Floating stat card */}
              <div className="absolute -bottom-6 -left-6 bg-card rounded-2xl shadow-xl p-5 border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-accent-foreground" />
                  </div>
                  <div>
                    <div className="font-bold text-foreground text-lg">Instant Confirmation</div>
                    <div className="text-muted-foreground text-xs">Email + SMS after every booking</div>
                  </div>
                </div>
              </div>
              {/* Floating badge */}
              <div className="absolute -top-4 -right-4 bg-primary rounded-2xl shadow-xl p-4 border border-primary/20">
                <div className="text-center">
                  <div className="text-accent font-extrabold text-2xl" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>40+</div>
                  <div className="text-primary-foreground/70 text-xs uppercase tracking-wider">Years</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          TESTIMONIALS
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-14">
            <Badge className="mb-4 bg-accent/15 text-accent-foreground border-accent/30 font-semibold">
              Student Reviews
            </Badge>
            <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              WHAT OUR PLAYERS SAY
            </h2>
            <div className="flex items-center justify-center gap-1 mt-2">
              {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 text-accent fill-accent" />)}
              <span className="ml-2 text-muted-foreground text-sm font-medium">5.0 · Rated by RI Tennis Community</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Sarah M.", role: "Adult Clinic Player", text: "Coach Mario completely transformed my game. His 105 Clinic is the highlight of my week — competitive, fun, and I've improved more in 3 months than in 3 years of casual play.", stars: 5 },
              { name: "James R.", role: "Parent of Junior Player", text: "My son went from barely holding a racquet to winning his first tournament in 6 months. Mario's patience and technical knowledge are unmatched. The online booking makes everything so easy.", stars: 5 },
              { name: "Lisa K.", role: "Private Lesson Student", text: "The mental coaching side is what sets Mario apart. He helped me stop choking in matches. I now play with confidence I never had before. Worth every penny.", stars: 5 },
              { name: "David T.", role: "Summer Camp Parent", text: "Best summer camp in Rhode Island. My daughter came home every day excited about tennis. The combination of technique, fitness, and mental training is incredible.", stars: 5 },
              { name: "Maria C.", role: "Adult Beginner", text: "I started with zero experience and Mario made me feel welcome from day one. The booking app is so easy to use — I can see available slots and book in under a minute.", stars: 5 },
              { name: "Tom B.", role: "Competitive Player", text: "Mario's Delete Fear methodology changed how I approach big points. I used to freeze under pressure. Now I embrace it. My ranking has improved significantly.", stars: 5 },
            ].map(({ name, role, text, stars }) => (
              <div key={name} className="bg-card rounded-2xl p-6 border border-border hover:shadow-lg hover:border-primary/20 transition-all">
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: stars }).map((_, i) => <Star key={i} className="w-4 h-4 text-accent fill-accent" />)}
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed mb-5 italic">"{text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold text-sm">{name[0]}</span>
                  </div>
                  <div>
                    <div className="font-semibold text-foreground text-sm">{name}</div>
                    <div className="text-muted-foreground text-xs">{role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          TIP OF THE WEEK
      ═══════════════════════════════════════════════════════════════ */}
      <TipOfTheWeekSection />

      {/* ═══════════════════════════════════════════════════════════════
          FAQ SECTION
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-14">
              <Badge className="mb-4 bg-accent/15 text-accent-foreground border-accent/30 font-semibold">
                FAQ
              </Badge>
              <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                COMMON QUESTIONS
              </h2>
            </div>
            <FaqAccordion />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          LOCATION SECTION
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <Badge className="mb-4 bg-accent/10 text-accent border-accent/20 font-semibold">Find Us</Badge>
              <h2 className="text-4xl font-extrabold text-foreground mb-4" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>TRAIN IN RHODE ISLAND</h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Coach Mario trains players across Rhode Island at multiple court locations. Contact us to confirm the exact court for your session.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">Rhode Island, USA</div>
                    <div className="text-sm text-muted-foreground">Multiple court locations — contact us for your session's court</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">(401) 965-5873</div>
                    <div className="text-sm text-muted-foreground">Call or text Coach Mario directly</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">ritennismario@gmail.com</div>
                    <div className="text-sm text-muted-foreground">Email for bookings, questions & partnerships</div>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <a href="tel:+14019655873">
                  <button className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors">
                    Call Coach Mario
                  </button>
                </a>
                <a href="mailto:ritennismario@gmail.com">
                  <button className="px-6 py-2.5 rounded-full border border-border text-foreground font-semibold text-sm hover:bg-muted transition-colors">
                    Send Email
                  </button>
                </a>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-xl border border-border h-80">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d192041.98595568218!2d-71.6303!3d41.5801!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89e44f0b4e2e3b7d%3A0x3e3e3e3e3e3e3e3e!2sRhode%20Island!5e0!3m2!1sen!2sus!4v1709900000000!5m2!1sen!2sus"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="RI Tennis Academy Location"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          CTA SECTION
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-primary relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'radial-gradient(circle at 25% 50%, white 1px, transparent 1px), radial-gradient(circle at 75% 50%, white 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
        <div className="relative container text-center">
          <Badge className="mb-6 bg-accent/20 text-accent border-accent/30 font-semibold text-sm px-4 py-1.5">
            Get Started Today
          </Badge>
          <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            READY TO TAKE YOUR<br />
            <span className="text-accent">GAME TO THE NEXT LEVEL?</span>
          </h2>
          <p className="text-primary-foreground/70 text-lg mb-10 max-w-xl mx-auto">
            Join hundreds of Rhode Island players who train with Coach Mario. Book your first session today — no commitment required.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/programs">
              <Button
                size="lg"
                className="bg-accent text-accent-foreground hover:brightness-105 font-bold text-lg px-10 py-7 rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-105"
              >
                Book a Session Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            {!isAuthenticated && (
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 font-semibold text-lg px-10 py-7 rounded-full"
                onClick={() => (window.location.href = getLoginUrl())}
              >
                Create Free Account
              </Button>
            )}
          </div>

          {/* Contact info */}
          <div className="mt-16 flex flex-wrap justify-center gap-8 text-primary-foreground/50">
            <a href="tel:+14019655873" className="flex items-center gap-2 hover:text-primary-foreground/80 transition-colors text-sm">
              <Phone className="w-4 h-4" />
              (401) 965-5873
            </a>
            <a href="mailto:ritennismario@gmail.com" className="flex items-center gap-2 hover:text-primary-foreground/80 transition-colors text-sm">
              <Mail className="w-4 h-4" />
              ritennismario@gmail.com
            </a>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4" />
              Rhode Island, USA
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
