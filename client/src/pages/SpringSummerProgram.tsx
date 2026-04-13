import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Brain, Dumbbell, Footprints, Trophy, Phone, Mail, MapPin,
  CheckCircle2, Star, ChevronRight, CalendarDays, Clock, DollarSign,
  Zap, Shield, Heart, Users
} from "lucide-react";

const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310519663342968318/kzZFsCRUb4iWMZR8LEwAKz";
const LOGO = `${CDN}/ri-tennis-logo_3de51834.jpg`;
const MARIO_PHOTO = `${CDN}/mario-us-open_68ad2763.jpg`;

const PHOTOS = {
  hero:    `${CDN}/IMG_2882_4dfd31c8.jpg`,
  action1: `${CDN}/IMG_2881_baaab9b5.jpg`,
  action2: `${CDN}/IMG_2883_18ff44ca.jpg`,
  action3: `${CDN}/IMG_2887_9adc372b.jpg`,
  action4: `${CDN}/IMG_2885_b0ce7285.jpg`,
  group:   `${CDN}/IMG_2891_c12742f2.jpg`,
  junior:  `${CDN}/IMG_2884_19472c09.jpg`,
  smile:   `${CDN}/IMG_2892_41ec0d25.jpg`,
};

const PILLARS = [
  {
    icon: Brain,
    title: "Mental Training",
    color: "from-purple-600 to-purple-800",
    accent: "bg-purple-100 text-purple-700",
    description:
      "Coach Mario's signature \"Delete Fear\" methodology builds unshakeable confidence. Players learn to silence self-doubt, stay focused under pressure, and compete with a free, fearless mindset — skills that transfer far beyond the tennis court.",
    points: ["Delete Fear philosophy", "Pre-match mental routines", "Focus & concentration drills", "Resilience under pressure"],
  },
  {
    icon: Trophy,
    title: "Tennis Technique",
    color: "from-green-600 to-green-800",
    accent: "bg-green-100 text-green-700",
    description:
      "From groundstrokes to serve mechanics, every technical element is broken down and rebuilt with precision. Mario's coaching style emphasizes correct fundamentals so players develop clean, consistent strokes that hold up in match play.",
    points: ["Forehand & backhand mechanics", "Serve & volley fundamentals", "Court positioning & strategy", "Match-play scenarios"],
  },
  {
    icon: Dumbbell,
    title: "Fitness & Conditioning",
    color: "from-orange-500 to-orange-700",
    accent: "bg-orange-100 text-orange-700",
    description:
      "Tennis demands explosive power, endurance, and agility. Our fitness component is designed specifically for the demands of the sport — building the physical foundation that lets players execute their best tennis from the first point to the last.",
    points: ["Sport-specific strength", "Explosive power training", "Endurance & stamina", "Injury prevention"],
  },
  {
    icon: Footprints,
    title: "Footwork",
    color: "from-blue-600 to-blue-800",
    accent: "bg-blue-100 text-blue-700",
    description:
      "Great footwork is the foundation of every great shot. Players develop split-step timing, recovery patterns, and court movement that allow them to arrive at the ball in balance — giving them the time and space to execute with confidence.",
    points: ["Split-step & reaction time", "Recovery & court coverage", "Lateral & diagonal movement", "Balance at contact"],
  },
];

export default function SpringSummerProgram() {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", childName: "", childAge: "",
    program: "both" as "spring" | "summer" | "both", message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const submitMutation = trpc.programInquiry.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Your inquiry was sent! Coach Mario will be in touch soon.");
    },
    onError: (err) => toast.error(err.message || "Something went wrong. Please try again."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Please enter your name and email.");
      return;
    }
    submitMutation.mutate(form);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">

      {/* ── Sticky Nav ───────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-[#0a2240]/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/">
            <img src={LOGO} alt="RI Tennis Academy" className="h-9 w-auto rounded" />
          </Link>
          <div className="flex items-center gap-4">
            <a href="tel:4019655873" className="hidden sm:flex items-center gap-1.5 text-white/80 hover:text-white text-sm transition-colors">
              <Phone className="w-3.5 h-3.5" /> (401) 965-5873
            </a>
            <a href="#signup" className="bg-[#4a9c5d] hover:bg-[#3d8a50] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
              Sign Up Free
            </a>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <img src={PHOTOS.hero} alt="Tennis training" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a2240]/90 via-[#0a2240]/70 to-transparent" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-20 grid md:grid-cols-2 gap-12 items-center">
          <div>
            {/* Season badges */}
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="bg-[#4a9c5d] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                🌱 Spring — Now Open
              </span>
              <span className="bg-[#f59e0b] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                ☀️ Summer — June 22 – Aug 21
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-4">
              Train Like a<br />
              <span className="text-[#4a9c5d]">Champion.</span><br />
              <span className="text-[#f59e0b]">Think Like One Too.</span>
            </h1>

            <p className="text-white/85 text-lg mb-8 leading-relaxed max-w-lg">
              RI Tennis Academy's Spring & Summer Program combines <strong className="text-white">mental training, tennis technique, fitness, and footwork</strong> — giving players ages 8–18 a complete competitive edge.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <a href="#signup" className="flex items-center justify-center gap-2 bg-[#4a9c5d] hover:bg-[#3d8a50] text-white font-bold px-6 py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl text-base">
                Sign Up Now — It's Free <ChevronRight className="w-4 h-4" />
              </a>
              <a href="tel:4019655873" className="flex items-center justify-center gap-2 border-2 border-white/60 hover:border-white text-white font-semibold px-6 py-3.5 rounded-xl transition-all text-base">
                <Phone className="w-4 h-4" /> Call or Text Mario
              </a>
            </div>

            {/* Quick facts */}
            <div className="flex flex-wrap gap-4 text-white/80 text-sm">
              <div className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-[#4a9c5d]" /> 3:30 – 6:30 PM Daily</div>
              <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-[#4a9c5d]" /> Saint Andrews School, Barrington</div>
              <div className="flex items-center gap-1.5"><Users className="w-4 h-4 text-[#4a9c5d]" /> Ages 8–18</div>
            </div>
          </div>

          {/* Hero side card */}
          <div className="hidden md:block">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-white">
              <h3 className="font-bold text-lg mb-4 text-[#f59e0b]">Why RI Tennis Academy?</h3>
              {[
                "No weekly commitment — come when you can",
                "Pay by the hour ($30) or 3-hour block ($75)",
                "Expert coaching from Coach Mario Llano",
                "Small groups for personalized attention",
                "Mental performance training included",
                "Players ages 8 to 18 welcome",
              ].map((point) => (
                <div key={point} className="flex items-start gap-2.5 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-[#4a9c5d] shrink-0 mt-0.5" />
                  <span className="text-sm text-white/90">{point}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Flexibility Banner ───────────────────────────────────── */}
      <section className="bg-[#4a9c5d] py-6">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-white text-lg font-semibold">
            <Zap className="inline w-5 h-5 mr-2 text-yellow-300" />
            <strong>Completely flexible</strong> — no weekly commitment, no fixed schedule. Come any day you want, as long as you let Coach Mario know in advance.
            <a href="tel:4019655873" className="ml-2 underline font-bold hover:text-yellow-200 transition-colors">Text or call (401) 965-5873</a>
          </p>
        </div>
      </section>

      {/* ── Four Pillars ─────────────────────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <span className="text-[#4a9c5d] font-semibold text-sm uppercase tracking-widest">The Complete Player</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0a2240] mt-2">Four Pillars of Development</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">Every session addresses all four dimensions — because true champions are built from the inside out.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div key={pillar.title} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                  <div className={`bg-gradient-to-br ${pillar.color} p-6 flex items-center gap-3`}>
                    <div className="bg-white/20 rounded-xl p-2.5">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-white font-bold text-lg">{pillar.title}</h3>
                  </div>
                  <div className="p-5">
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">{pillar.description}</p>
                    <ul className="space-y-1.5">
                      {pillar.points.map((pt) => (
                        <li key={pt} className="flex items-center gap-2 text-xs text-gray-700">
                          <span className={`w-1.5 h-1.5 rounded-full ${pillar.accent.split(" ")[0].replace("bg-", "bg-")}`} />
                          {pt}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Photo Grid ───────────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-[#0a2240]">See It In Action</h2>
            <p className="text-gray-500 mt-2">Real players, real training, real results.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[PHOTOS.action1, PHOTOS.action2, PHOTOS.action3, PHOTOS.action4,
              PHOTOS.group, PHOTOS.junior, PHOTOS.smile, PHOTOS.hero].map((src, i) => (
              <div key={i} className={`overflow-hidden rounded-xl ${i === 0 ? "md:col-span-2 md:row-span-2" : ""}`}>
                <img
                  src={src}
                  alt="RI Tennis Academy training"
                  className="w-full h-full object-cover aspect-square hover:scale-105 transition-transform duration-500"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Program Details ──────────────────────────────────────── */}
      <section className="py-20 bg-[#0a2240]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Program Details</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Spring */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-[#4a9c5d] rounded-xl p-2.5">
                  <span className="text-2xl">🌱</span>
                </div>
                <div>
                  <h3 className="text-white font-bold text-xl">Spring Program</h3>
                  <span className="text-[#4a9c5d] text-sm font-semibold">Now Open — Enrolling Now</span>
                </div>
              </div>
              <div className="space-y-3 text-white/80 text-sm">
                <div className="flex items-center gap-2"><CalendarDays className="w-4 h-4 text-[#4a9c5d] shrink-0" /> Every day, 3:30 PM – 6:30 PM</div>
                <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#4a9c5d] shrink-0" /> Saint Andrews School, Barrington, RI</div>
                <div className="flex items-center gap-2"><Users className="w-4 h-4 text-[#4a9c5d] shrink-0" /> Ages 8–18</div>
                <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-[#4a9c5d] shrink-0" /> No commitment — come when you can</div>
              </div>
            </div>

            {/* Summer */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-[#f59e0b] rounded-xl p-2.5">
                  <span className="text-2xl">☀️</span>
                </div>
                <div>
                  <h3 className="text-white font-bold text-xl">Summer Program</h3>
                  <span className="text-[#f59e0b] text-sm font-semibold">June 22 – August 21, 2025</span>
                </div>
              </div>
              <div className="space-y-3 text-white/80 text-sm">
                <div className="flex items-center gap-2"><CalendarDays className="w-4 h-4 text-[#f59e0b] shrink-0" /> June 22 – August 21</div>
                <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-[#f59e0b] shrink-0" /> 3:30 PM – 6:30 PM daily</div>
                <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#f59e0b] shrink-0" /> Saint Andrews School, Barrington, RI</div>
                <div className="flex items-center gap-2"><Heart className="w-4 h-4 text-[#f59e0b] shrink-0" /> Ages 8–18 welcome</div>
              </div>
              <p className="text-white/50 text-xs mt-4 italic">
                (Start of summer season may be adjusted due to school snow schedule delays.)
              </p>
            </div>
          </div>

          {/* Pricing */}
          <div className="mt-10 bg-white rounded-2xl p-8">
            <h3 className="text-[#0a2240] font-bold text-xl mb-6 text-center">Simple, Flexible Pricing</h3>
            <div className="grid sm:grid-cols-2 gap-4 max-w-lg mx-auto">
              <div className="border-2 border-[#4a9c5d] rounded-xl p-6 text-center">
                <DollarSign className="w-8 h-8 text-[#4a9c5d] mx-auto mb-2" />
                <div className="text-3xl font-extrabold text-[#0a2240]">$30</div>
                <div className="text-gray-500 text-sm mt-1">per hour</div>
                <div className="text-xs text-gray-400 mt-2">Perfect for a quick session</div>
              </div>
              <div className="border-2 border-[#f59e0b] rounded-xl p-6 text-center relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#f59e0b] text-white text-xs font-bold px-3 py-0.5 rounded-full">BEST VALUE</div>
                <DollarSign className="w-8 h-8 text-[#f59e0b] mx-auto mb-2" />
                <div className="text-3xl font-extrabold text-[#0a2240]">$75</div>
                <div className="text-gray-500 text-sm mt-1">for 3 hours</div>
                <div className="text-xs text-gray-400 mt-2">Full afternoon session</div>
              </div>
            </div>
            <p className="text-center text-gray-500 text-sm mt-6">
              No registration fees. No weekly minimums. Just show up and play.
            </p>
          </div>
        </div>
      </section>

      {/* ── Coach Mario ──────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <img
                src={MARIO_PHOTO}
                alt="Coach Mario Llano"
                className="w-full max-w-sm mx-auto rounded-2xl shadow-xl object-cover aspect-[3/4]"
              />
              <div className="absolute -bottom-4 -right-4 bg-[#4a9c5d] text-white rounded-xl px-4 py-2 shadow-lg text-sm font-bold hidden md:block">
                20+ Years Coaching
              </div>
            </div>
            <div>
              <span className="text-[#4a9c5d] font-semibold text-sm uppercase tracking-widest">Your Coach</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0a2240] mt-2 mb-4">Mario Llano</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Coach Mario Llano is the founder of RI Tennis Academy and creator of the <strong>"Delete Fear"</strong> mental performance methodology. With over two decades of coaching experience, Mario has helped hundreds of junior players develop not just their game — but their mindset.
              </p>
              <p className="text-gray-600 leading-relaxed mb-6">
                His approach is unique: technical excellence combined with mental strength training creates players who compete confidently, recover from mistakes quickly, and perform at their best when it matters most.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="tel:4019655873"
                  className="flex items-center justify-center gap-2 bg-[#0a2240] hover:bg-[#0d2d57] text-white font-semibold px-5 py-3 rounded-xl transition-colors"
                >
                  <Phone className="w-4 h-4" /> (401) 965-5873
                </a>
                <a
                  href="mailto:RItennismario@gmail.com"
                  className="flex items-center justify-center gap-2 border-2 border-[#0a2240] text-[#0a2240] hover:bg-[#0a2240] hover:text-white font-semibold px-5 py-3 rounded-xl transition-colors"
                >
                  <Mail className="w-4 h-4" /> Email Mario
                </a>
              </div>
              <p className="text-gray-400 text-xs mt-3">
                <Phone className="inline w-3 h-3 mr-1" />
                Text or call anytime — Mario responds personally.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────── */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-[#0a2240]">What Parents & Players Say</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { quote: "My son went from being afraid to compete to winning his first tournament. The mental training made all the difference.", author: "Parent of 12-year-old player" },
              { quote: "Coach Mario is the real deal. His Delete Fear approach completely changed how my daughter approaches the game.", author: "Parent of 15-year-old player" },
              { quote: "The flexibility is amazing — we come when we can and the quality of coaching is always top-notch.", author: "Parent of 10-year-old player" },
            ].map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, s) => <Star key={s} className="w-4 h-4 fill-[#f59e0b] text-[#f59e0b]" />)}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4 italic">"{t.quote}"</p>
                <p className="text-gray-400 text-xs font-medium">— {t.author}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sign Up Form ─────────────────────────────────────────── */}
      <section id="signup" className="py-20 bg-[#0a2240]">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-10">
            <span className="text-[#4a9c5d] font-semibold text-sm uppercase tracking-widest">Get Started</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">Sign Up — It's Free</h2>
            <p className="text-white/70 mt-3">
              Fill out the form below and Coach Mario will reach out to confirm your first session.
              Or text/call directly at <a href="tel:4019655873" className="text-[#4a9c5d] font-semibold hover:underline">(401) 965-5873</a>.
            </p>
          </div>

          {submitted ? (
            <div className="bg-white/10 border border-[#4a9c5d]/50 rounded-2xl p-10 text-center">
              <CheckCircle2 className="w-14 h-14 text-[#4a9c5d] mx-auto mb-4" />
              <h3 className="text-white font-bold text-2xl mb-2">You're on the list!</h3>
              <p className="text-white/70 mb-6">
                Coach Mario will reach out to you shortly to confirm your first session. In the meantime, feel free to text or call him at <a href="tel:4019655873" className="text-[#4a9c5d] font-semibold">(401) 965-5873</a>.
              </p>
              <Link href="/">
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  Back to Main Site
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-2xl space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-[#0a2240] font-semibold">Your Name *</Label>
                  <Input
                    id="name"
                    placeholder="Jane Smith"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-[#0a2240] font-semibold">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="jane@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="mt-1"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone" className="text-[#0a2240] font-semibold">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(401) 555-0100"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="mt-1"
                />
                <p className="text-xs text-gray-400 mt-1">Coach Mario may text you to confirm your session.</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="childName" className="text-[#0a2240] font-semibold">Child's Name</Label>
                  <Input
                    id="childName"
                    placeholder="Alex Smith"
                    value={form.childName}
                    onChange={(e) => setForm({ ...form, childName: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="childAge" className="text-[#0a2240] font-semibold">Child's Age</Label>
                  <Input
                    id="childAge"
                    placeholder="e.g. 12"
                    value={form.childAge}
                    onChange={(e) => setForm({ ...form, childAge: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-[#0a2240] font-semibold">Program Interest *</Label>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  {(["spring", "summer", "both"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setForm({ ...form, program: p })}
                      className={`py-2.5 px-3 rounded-xl border-2 text-sm font-semibold transition-all capitalize ${
                        form.program === p
                          ? "border-[#4a9c5d] bg-[#4a9c5d]/10 text-[#4a9c5d]"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {p === "both" ? "Both" : p === "spring" ? "🌱 Spring" : "☀️ Summer"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="message" className="text-[#0a2240] font-semibold">Any questions or notes?</Label>
                <Textarea
                  id="message"
                  placeholder="Tell us about your child's experience level, goals, or any questions you have..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="mt-1"
                  rows={3}
                />
              </div>

              <Button
                type="submit"
                disabled={submitMutation.isPending}
                className="w-full bg-[#4a9c5d] hover:bg-[#3d8a50] text-white font-bold py-3.5 text-base rounded-xl"
              >
                {submitMutation.isPending ? "Sending..." : "Send My Inquiry — It's Free!"}
              </Button>

              <p className="text-center text-gray-400 text-xs">
                Or contact Coach Mario directly: <a href="tel:4019655873" className="text-[#4a9c5d] font-semibold hover:underline">(401) 965-5873</a> ·{" "}
                <a href="mailto:RItennismario@gmail.com" className="text-[#4a9c5d] font-semibold hover:underline">RItennismario@gmail.com</a>
              </p>
            </form>
          )}
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="bg-[#061628] py-10 text-center">
        <img src={LOGO} alt="RI Tennis Academy" className="h-10 w-auto mx-auto rounded mb-4" />
        <p className="text-white/60 text-sm">Saint Andrews School · Barrington, RI</p>
        <div className="flex items-center justify-center gap-4 mt-3 text-white/60 text-sm">
          <a href="tel:4019655873" className="hover:text-white transition-colors flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> (401) 965-5873</a>
          <span>·</span>
          <a href="mailto:RItennismario@gmail.com" className="hover:text-white transition-colors flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> RItennismario@gmail.com</a>
        </div>
        <p className="text-white/30 text-xs mt-4">© {new Date().getFullYear()} RI Tennis Academy. All rights reserved.</p>
        <Link href="/" className="text-white/40 hover:text-white/70 text-xs mt-2 inline-block transition-colors">← Back to main site</Link>
      </footer>
    </div>
  );
}
