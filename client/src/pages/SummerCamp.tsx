import { Link } from "wouter";
import {
  Brain, Dumbbell, Footprints, Trophy, Phone,
  CheckCircle2, Star, CalendarDays, Clock, DollarSign,
  Users, Sun, Zap, Shield, ChevronRight, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310519663342968318/kzZFsCRUb4iWMZR8LEwAKz";
const LOGO = `${CDN}/ri-tennis-logo_3de51834.jpg`;

const PHOTOS = {
  hero:    `${CDN}/IMG_2882_4dfd31c8.jpg`,
  action1: `${CDN}/IMG_2881_baaab9b5.jpg`,
  action2: `${CDN}/IMG_2883_18ff44ca.jpg`,
  action3: `${CDN}/IMG_2887_9adc372b.jpg`,
  group:   `${CDN}/IMG_2891_c12742f2.jpg`,
  junior:  `${CDN}/IMG_2884_19472c09.jpg`,
  smile:   `${CDN}/IMG_2892_41ec0d25.jpg`,
};

const PILLARS = [
  {
    icon: Brain,
    color: "from-purple-600 to-purple-800",
    bg: "bg-purple-50",
    accent: "text-purple-700",
    title: "Mental Training",
    description: "Coach Mario's signature \"Delete Fear\" methodology builds unshakeable confidence. Players learn to silence self-doubt, stay focused under pressure, and compete with a free, fearless mindset.",
    points: ["Delete Fear philosophy", "Pre-match mental routines", "Focus & concentration drills", "Resilience under pressure"],
  },
  {
    icon: Trophy,
    color: "from-green-600 to-green-800",
    bg: "bg-green-50",
    accent: "text-green-700",
    title: "Tennis Technique",
    description: "From groundstrokes to serve mechanics, every technical element is broken down and rebuilt with precision. Mario's coaching emphasizes fundamentals that hold up in match play.",
    points: ["Forehand & backhand mechanics", "Serve & volley fundamentals", "Court positioning & strategy", "Match-play scenarios"],
  },
  {
    icon: Dumbbell,
    color: "from-orange-500 to-orange-700",
    bg: "bg-orange-50",
    accent: "text-orange-700",
    title: "Fitness & Conditioning",
    description: "Tennis demands explosive power, endurance, and agility. Our fitness component is designed specifically for the sport — building the physical foundation that lets players execute their best tennis.",
    points: ["Sport-specific strength", "Explosive power training", "Endurance & stamina", "Injury prevention"],
  },
  {
    icon: Footprints,
    color: "from-blue-600 to-blue-800",
    bg: "bg-blue-50",
    accent: "text-blue-700",
    title: "Footwork",
    description: "Great footwork is the foundation of every great shot. Players develop split-step timing, recovery patterns, and court movement that allow them to arrive at the ball in balance.",
    points: ["Split-step & reaction time", "Recovery & court coverage", "Lateral & diagonal movement", "Balance at contact"],
  },
];

const PRICING = [
  {
    label: "Half-Day",
    hours: "9 AM – 2 PM",
    daily: "$99",
    weekly: "$495",
    highlight: false,
    color: "border-gray-200",
    badge: null,
  },
  {
    label: "Full Day",
    hours: "9 AM – 5 PM",
    daily: "$125",
    weekly: "$625",
    highlight: true,
    color: "border-[#4a9c5d]",
    badge: "Most Popular",
  },
];

const SCHEDULE = [
  { time: "9:00 AM", activity: "Warm-Up & Footwork Drills", icon: Footprints },
  { time: "9:30 AM", activity: "Technical Stroke Work", icon: Trophy },
  { time: "10:30 AM", activity: "Match Play & Drills", icon: Zap },
  { time: "12:00 PM", activity: "Lunch Break", icon: Sun },
  { time: "12:30 PM", activity: "Mental Training Session", icon: Brain },
  { time: "1:15 PM", activity: "Fitness & Conditioning", icon: Dumbbell },
  { time: "2:00 PM", activity: "Half-Day Dismissal", icon: CheckCircle2 },
  { time: "2:30 PM", activity: "After-Camp Continues (Full-Day)", icon: Users },
  { time: "5:00 PM", activity: "Full-Day Dismissal", icon: CheckCircle2 },
];

export default function SummerCamp() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">

      {/* ── Sticky Nav ─────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-[#0a2240]/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/">
            <img src={LOGO} alt="RI Tennis Academy" className="h-9 w-auto rounded" />
          </Link>
          <div className="flex items-center gap-3">
            <a href="tel:4019655873" className="hidden sm:flex items-center gap-1.5 text-white/80 hover:text-white text-sm transition-colors">
              <Phone className="w-3.5 h-3.5" /> (401) 965-5873
            </a>
            <Link href="/book/summer_camp_daily">
              <button className="bg-[#4a9c5d] hover:bg-[#3d8a50] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                Book Now
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="relative min-h-[88vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={PHOTOS.hero} alt="Summer tennis camp" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a2240]/92 via-[#0a2240]/70 to-transparent" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-20 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex flex-wrap gap-2 mb-5">
              <span className="bg-[#f59e0b] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                ☀️ Summer 2026
              </span>
              <span className="bg-[#4a9c5d] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                Enrolling Now
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-4">
              Junior Summer<br />
              <span className="text-[#4a9c5d]">Tennis Camp</span>
            </h1>

            <p className="text-white/80 text-lg mb-6 leading-relaxed">
              Rhode Island's premier junior tennis experience — technique, fitness, mental training, and matchplay. Mon–Fri, all summer long.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-8">
              {[
                { icon: CalendarDays, label: "Dates", value: "June 22 – Aug 21" },
                { icon: Clock,        label: "Hours", value: "9 AM – 2 PM / 5 PM" },
                { icon: DollarSign,   label: "From",  value: "$99/day · $495/week" },
                { icon: Users,        label: "Ages",  value: "6–18 · All levels" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-4 h-4 text-[#4a9c5d]" />
                    <span className="text-white/60 text-xs uppercase tracking-wide">{label}</span>
                  </div>
                  <p className="text-white font-semibold text-sm">{value}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/book/summer_camp_daily">
                <button className="w-full sm:w-auto bg-[#4a9c5d] hover:bg-[#3d8a50] text-white font-bold px-8 py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2">
                  Book a Day <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <Link href="/book/summer_camp_weekly">
                <button className="w-full sm:w-auto bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold px-8 py-3.5 rounded-xl transition-colors">
                  Book a Week
                </button>
              </Link>
            </div>
          </div>

          {/* Hero photo stack */}
          <div className="hidden md:grid grid-cols-2 gap-3">
            <img src={PHOTOS.action1} alt="Junior tennis" className="rounded-2xl object-cover h-52 w-full" />
            <img src={PHOTOS.junior}  alt="Junior tennis" className="rounded-2xl object-cover h-52 w-full mt-6" />
            <img src={PHOTOS.smile}   alt="Junior tennis" className="rounded-2xl object-cover h-52 w-full -mt-6" />
            <img src={PHOTOS.group}   alt="Junior tennis" className="rounded-2xl object-cover h-52 w-full" />
          </div>
        </div>
      </section>

      {/* ── Stats bar ──────────────────────────────────────────────── */}
      <section className="bg-[#0a2240] py-6">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: "9 Weeks", label: "Full Summer" },
            { value: "4 Pillars", label: "Technique · Fitness · Mental · Footwork" },
            { value: "All Levels", label: "Beginner to Advanced" },
            { value: "Small Groups", label: "Personalized Attention" },
          ].map(({ value, label }) => (
            <div key={value}>
              <p className="text-[#4a9c5d] text-2xl font-black">{value}</p>
              <p className="text-white/60 text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── What's Included ────────────────────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <span className="text-[#4a9c5d] text-sm font-bold uppercase tracking-widest">The Program</span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0a2240] mt-2">4 Pillars of Development</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">Every day covers all four pillars — giving juniors a complete athletic and mental foundation.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PILLARS.map(({ icon: Icon, color, bg, accent, title, description, points }) => (
              <div key={title} className={`rounded-2xl border border-gray-100 overflow-hidden shadow-sm`}>
                <div className={`bg-gradient-to-br ${color} p-5`}>
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-white font-bold text-lg">{title}</h3>
                </div>
                <div className={`${bg} p-5`}>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">{description}</p>
                  <ul className="space-y-1.5">
                    {points.map(pt => (
                      <li key={pt} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className={`w-4 h-4 mt-0.5 flex-shrink-0 ${accent}`} />
                        <span className="text-gray-700">{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Daily Schedule ─────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-[#4a9c5d] text-sm font-bold uppercase tracking-widest">A Typical Day</span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0a2240] mt-2">Daily Schedule</h2>
          </div>

          <div className="relative">
            <div className="absolute left-[88px] top-0 bottom-0 w-px bg-gray-200 hidden sm:block" />
            <div className="space-y-4">
              {SCHEDULE.map(({ time, activity, icon: Icon }, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-right text-sm font-mono text-gray-500 w-20 flex-shrink-0">{time}</span>
                  <div className="w-8 h-8 rounded-full bg-[#0a2240] flex items-center justify-center flex-shrink-0 z-10">
                    <Icon className="w-4 h-4 text-[#4a9c5d]" />
                  </div>
                  <div className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium ${
                    activity.includes("Dismissal") ? "bg-[#4a9c5d]/10 text-[#4a9c5d] font-bold" :
                    activity.includes("Lunch") ? "bg-amber-50 text-amber-700" :
                    "bg-gray-50 text-gray-800"
                  }`}>
                    {activity}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────────────── */}
      <section className="py-20 bg-[#0a2240]" id="pricing">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-[#4a9c5d] text-sm font-bold uppercase tracking-widest">Pricing</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-2">Simple, Transparent Rates</h2>
            <p className="text-white/60 mt-3">Choose daily or weekly — no hidden fees.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-10">
            {PRICING.map(({ label, hours, daily, weekly, highlight, color, badge }) => (
              <div key={label} className={`rounded-2xl border-2 ${color} bg-white/5 p-8 relative`}>
                {badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#4a9c5d] text-white text-xs font-bold px-4 py-1 rounded-full">
                    {badge}
                  </span>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <Sun className={`w-5 h-5 ${highlight ? "text-[#4a9c5d]" : "text-white/60"}`} />
                  <h3 className="text-white font-bold text-xl">{label}</h3>
                </div>
                <p className="text-white/50 text-sm mb-6">{hours}</p>

                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-white/10 pb-4">
                    <span className="text-white/70 text-sm">Per Day</span>
                    <span className="text-white text-3xl font-black">{daily}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70 text-sm">Per Week (Mon–Fri)</span>
                    <div className="text-right">
                      <span className="text-[#4a9c5d] text-3xl font-black">{weekly}</span>
                      <p className="text-white/40 text-xs">Save vs. daily rate</p>
                    </div>
                  </div>
                </div>

                <Link href={label === "Half-Day" ? "/book/summer_camp_daily" : "/book/summer_camp_weekly"}>
                  <button className={`w-full mt-6 py-3 rounded-xl font-bold text-sm transition-colors ${
                    highlight
                      ? "bg-[#4a9c5d] hover:bg-[#3d8a50] text-white"
                      : "bg-white/10 hover:bg-white/20 text-white"
                  }`}>
                    Book {label} →
                  </button>
                </Link>
              </div>
            ))}
          </div>

          {/* Extra info */}
          <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-center">
            {[
              { icon: Shield, text: "No registration fee" },
              { icon: CalendarDays, text: "Book individual days or full weeks" },
              { icon: Star, text: "All skill levels welcome · Ages 6–18" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center justify-center gap-2 text-white/60 text-sm">
                <Icon className="w-4 h-4 text-[#4a9c5d] flex-shrink-0" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Photo strip ────────────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-3 rounded-2xl overflow-hidden">
            <img src={PHOTOS.action2} alt="Camp action" className="h-48 w-full object-cover" />
            <img src={PHOTOS.action3} alt="Camp action" className="h-48 w-full object-cover" />
            <img src={PHOTOS.action1} alt="Camp action" className="h-48 w-full object-cover" />
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-[#4a9c5d] text-sm font-bold uppercase tracking-widest">Questions</span>
            <h2 className="text-3xl font-black text-[#0a2240] mt-2">Frequently Asked</h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "What age range is the camp for?",
                a: "The Junior Summer Camp is open to players ages 6–18 of all skill levels, from complete beginners to competitive juniors.",
              },
              {
                q: "What should my child bring?",
                a: "Tennis racket, water bottle, sunscreen, snacks/lunch for the half-day session, and comfortable athletic clothing. Court shoes are strongly recommended.",
              },
              {
                q: "Can I book just one or two days?",
                a: "Absolutely! You can book individual days at $99/day (half-day) or $125/day (full-day). Weekly packages offer savings at $495/week and $625/week respectively.",
              },
              {
                q: "What's the difference between half-day and full-day?",
                a: "Half-day runs 9 AM–2 PM and covers all four program pillars. Full-day extends to 5 PM with additional supervised practice, fitness, and match play in the afternoon.",
              },
              {
                q: "How do I register?",
                a: "Click the Book Now button above to reserve your spot online. Payment is processed securely via Stripe, or you can pay by cash/check at the court.",
              },
            ].map(({ q, a }) => (
              <details key={q} className="group bg-white rounded-xl border border-gray-100 shadow-sm">
                <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                  <span className="font-semibold text-[#0a2240]">{q}</span>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-open:rotate-90 transition-transform flex-shrink-0" />
                </summary>
                <p className="px-5 pb-5 text-gray-600 text-sm leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────── */}
      <section className="py-20 bg-[#4a9c5d]">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            Ready to Have the Best Summer on the Court?
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Spots fill up fast. Secure your child's place in the 2026 Junior Summer Camp today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/book/summer_camp_daily">
              <button className="bg-white text-[#4a9c5d] font-bold px-8 py-4 rounded-xl hover:bg-white/90 transition-colors text-lg">
                Book a Day — $99
              </button>
            </Link>
            <Link href="/book/summer_camp_weekly">
              <button className="bg-[#0a2240] text-white font-bold px-8 py-4 rounded-xl hover:bg-[#0a2240]/80 transition-colors text-lg">
                Book a Week — $495
              </button>
            </Link>
          </div>
          <p className="text-white/60 text-sm mt-6">
            Questions? Call or text Coach Mario at{" "}
            <a href="tel:4019655873" className="text-white font-semibold underline">(401) 965-5873</a>
          </p>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="bg-[#0a2240] py-8 text-center">
        <Link href="/">
          <img src={LOGO} alt="RI Tennis Academy" className="h-10 w-auto rounded mx-auto mb-3" />
        </Link>
        <p className="text-white/40 text-sm">© 2026 RI Tennis Academy · Coach Mario Llano · Rhode Island</p>
        <div className="flex justify-center gap-6 mt-3">
          <Link href="/programs" className="text-white/50 hover:text-white text-sm transition-colors">All Programs</Link>
          <Link href="/book/summer_camp_daily" className="text-white/50 hover:text-white text-sm transition-colors">Book Now</Link>
          <a href="tel:4019655873" className="text-white/50 hover:text-white text-sm transition-colors">(401) 965-5873</a>
        </div>
      </footer>

    </div>
  );
}
