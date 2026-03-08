import { Link, useLocation } from "wouter";
import { Home, Calendar, BookOpen, User, Trophy } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/schedule", label: "Schedule", icon: Calendar },
  { href: "/programs", label: "Book", icon: Trophy, primary: true },
  { href: "/profile", label: "Profile", icon: User, requiresAuth: true },
];

export default function MobileBottomBar() {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();

  // Don't show on booking pages (they have their own flow)
  if (location.startsWith("/book/")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-md border-t border-border safe-area-pb">
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map(({ href, label, icon: Icon, primary, requiresAuth }) => {
          const isActive = location === href || (href !== "/" && location.startsWith(href));

          if (requiresAuth && !isAuthenticated) {
            return (
              <button
                key={href}
                onClick={() => (window.location.href = getLoginUrl())}
                className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            );
          }

          if (primary) {
            return (
              <Link key={href} href={href}>
                <div className="flex flex-col items-center gap-0.5 px-3 py-1.5">
                  <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center shadow-lg shadow-accent/30 -mt-5 border-2 border-background">
                    <Icon className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <span className="text-[10px] font-bold text-accent">{label}</span>
                </div>
              </Link>
            );
          }

          return (
            <Link key={href} href={href}>
              <div className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}>
                <Icon className={`w-5 h-5 ${isActive ? "fill-primary/20" : ""}`} />
                <span className={`text-[10px] font-medium ${isActive ? "font-bold" : ""}`}>{label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
