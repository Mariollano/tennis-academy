import { useState, useEffect } from "react";
import { Link } from "wouter";
import { X, Trophy, Calendar, Brain, ArrowRight, CheckCircle } from "lucide-react";

const STORAGE_KEY = "ri_tennis_welcome_seen_v2";

export default function WelcomeModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      // Delay slightly so page loads first
      const timer = setTimeout(() => setOpen(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  };

  if (!open) return null;

  const steps = [
    {
      icon: Trophy,
      color: "bg-primary",
      title: "Welcome to RI Tennis Academy",
      subtitle: "Coach Mario Llano",
      body: "Rhode Island's premier tennis academy — combining world-class technique coaching with the unique 'Delete Fear' mental performance methodology.",
      cta: "Next",
    },
    {
      icon: Calendar,
      color: "bg-accent",
      title: "Book in Under 60 Seconds",
      subtitle: "No phone calls needed",
      body: "Choose your program, pick an available date and time, pay securely online, and receive instant confirmation via email and SMS.",
      cta: "Next",
    },
    {
      icon: Brain,
      color: "bg-primary",
      title: "More Than Just Tennis",
      subtitle: "The Delete Fear Method",
      body: "Coach Mario's unique approach combines technical excellence with mental performance coaching. Overcome fear, build confidence, and perform under pressure.",
      cta: "Let's Go!",
    },
  ];

  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={dismiss}
      />

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Hero area */}
        <div className={`${current.color === "bg-accent" ? "bg-accent" : "bg-primary"} px-8 pt-10 pb-8 text-center`}>
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
            <Icon className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-1" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            {current.title}
          </h2>
          <p className="text-white/60 text-sm">{current.subtitle}</p>
        </div>

        {/* Content */}
        <div className="px-8 py-6">
          <p className="text-muted-foreground text-sm leading-relaxed text-center mb-6">
            {current.body}
          </p>

          {/* Step dots */}
          <div className="flex justify-center gap-2 mb-6">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>

          {/* CTA */}
          {isLast ? (
            <div className="space-y-2">
              <Link href="/programs" onClick={dismiss}>
                <button className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Book My First Session
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <button
                onClick={dismiss}
                className="w-full py-2.5 rounded-xl text-muted-foreground text-sm hover:text-foreground transition-colors"
              >
                Just browsing for now
              </button>
            </div>
          ) : (
            <button
              onClick={() => setStep(s => s + 1)}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              {current.cta}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
