import { useState } from "react";
import { Link } from "wouter";
import { Trophy, Users, Star, Sun, Brain, X, Zap } from "lucide-react";

const programs = [
  { label: "Private Lesson", href: "/book/private_lesson", price: "$120/hr", icon: Trophy, color: "bg-blue-600" },
  { label: "105 Clinic", href: "/book/clinic_105", price: "$35", icon: Users, color: "bg-amber-500" },
  { label: "Junior Program", href: "/book/junior_daily", price: "$80/day", icon: Star, color: "bg-green-600" },
  { label: "Summer Camp", href: "/book/summer_camp_daily", price: "$90/day", icon: Sun, color: "bg-orange-500" },
  { label: "Mental Coaching", href: "/mental-coaching", price: "Contact", icon: Brain, color: "bg-purple-600" },
];

export default function QuickBook() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-24 right-20 z-40 flex flex-col items-end gap-2">
      {/* Program options */}
      {open && (
        <div className="flex flex-col gap-2 mb-1">
          {programs.map(({ label, href, price, icon: Icon, color }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}>
              <div className="flex items-center gap-3 bg-card border border-border rounded-2xl shadow-xl px-4 py-3 hover:shadow-2xl hover:-translate-y-0.5 transition-all cursor-pointer min-w-[200px]">
                <div className={`w-8 h-8 rounded-xl ${color} flex items-center justify-center text-white shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-foreground text-sm leading-tight">{label}</div>
                  <div className="text-xs text-muted-foreground">{price}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${
          open
            ? "bg-foreground text-background"
            : "bg-accent text-accent-foreground"
        }`}
        style={open ? {} : {
          background: 'linear-gradient(145deg, #d4f000 0%, #b8d900 60%, #9fbf00 100%)',
          boxShadow: '0 4px 0 #7a9400, 0 6px 20px rgba(0,0,0,0.4)',
        }}
        aria-label={open ? "Close quick book" : "Quick book a session"}
      >
        {open ? <X className="w-6 h-6" /> : <Zap className="w-6 h-6 text-primary" />}
      </button>

      {/* Label */}
      {!open && (
        <div className="text-xs font-bold text-foreground/60 text-center leading-tight">
          RESERVE<br />QUICKLY
        </div>
      )}
    </div>
  );
}
