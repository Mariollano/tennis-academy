import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Menu, X, User, LogOut, Youtube, Instagram, Facebook, Download, ChevronRight } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663342968318/kzZFsCRUb4iWMZR8LEwAKz/ri-tennis-logo_3de51834.jpg";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/programs", label: "Programs" },
  { href: "/schedule", label: "My Schedule" },
  { href: "/social", label: "Media" },
  { href: "/mental-coaching", label: "Mental Coaching" },
  { href: "/services", label: "Services" },
];

function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    } else {
      toast.info("To install: tap Share → Add to Home Screen (iOS) or use browser menu → Install App (Android/Chrome)");
    }
  };

  return (
    <button
      onClick={handleInstall}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-primary bg-accent hover:brightness-105 transition-all"
      aria-label="Install App"
    >
      <Download className="w-3 h-3" />
      <span className="hidden sm:inline">Install</span>
    </button>
  );
}

export default function Navbar() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => { window.location.href = "/"; },
    onError: () => toast.error("Logout failed"),
  });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location.startsWith(href);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-primary/95 backdrop-blur-md shadow-lg"
          : "bg-primary shadow-md"
      }`}
    >
      <div className="container flex items-center justify-between h-16 gap-2">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="relative">
            <img
              src={LOGO_URL}
              alt="RI Tennis Academy"
              className="w-10 h-10 rounded-full object-contain bg-white border-2 border-accent/60 shadow-sm group-hover:border-accent transition-colors"
            />
          </div>
          <div className="leading-tight hidden sm:block">
            <div className="text-accent font-extrabold text-sm tracking-wide" style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.08em' }}>RI TENNIS</div>
            <div className="text-primary-foreground/60 text-[10px] tracking-[0.2em] uppercase">Academy</div>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <span
                className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  isActive(link.href)
                    ? "text-accent"
                    : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/8"
                }`}
              >
                {link.label}
                {isActive(link.href) && (
                  <span className="absolute bottom-0.5 left-3 right-3 h-0.5 bg-accent rounded-full" />
                )}
              </span>
            </Link>
          ))}
          {user?.role === "admin" && (
            <Link href="/admin">
              <span
                className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  isActive("/admin")
                    ? "text-accent"
                    : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/8"
                }`}
              >
                Admin
                {isActive("/admin") && (
                  <span className="absolute bottom-0.5 left-3 right-3 h-0.5 bg-accent rounded-full" />
                )}
              </span>
            </Link>
          )}
        </nav>

        {/* Right side: social + install + auth */}
        <div className="hidden md:flex items-center gap-2">
          {/* Social icons */}
          <div className="flex items-center gap-0.5 mr-1">
            <a href="https://www.youtube.com/@MarioRITennis" target="_blank" rel="noopener noreferrer"
              className="text-primary-foreground/40 hover:text-accent transition-colors p-1.5 rounded-md hover:bg-white/8" title="YouTube">
              <Youtube className="w-4 h-4" />
            </a>
            <a href="https://instagram.com/deletefearwithmario" target="_blank" rel="noopener noreferrer"
              className="text-primary-foreground/40 hover:text-accent transition-colors p-1.5 rounded-md hover:bg-white/8" title="Instagram">
              <Instagram className="w-4 h-4" />
            </a>
            <a href="https://facebook.com/RITennisAcademy" target="_blank" rel="noopener noreferrer"
              className="text-primary-foreground/40 hover:text-accent transition-colors p-1.5 rounded-md hover:bg-white/8" title="Facebook">
              <Facebook className="w-4 h-4" />
            </a>
          </div>

          <InstallAppButton />

          {/* Auth */}
          {/* Book Now CTA */}
          <Link href="/programs">
            <Button
              size="sm"
              className="bg-accent text-accent-foreground hover:brightness-105 font-bold rounded-full px-5 hidden lg:flex"
            >
              Book Now
            </Button>
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center gap-1">
              <Link href="/profile">
                <Button variant="ghost" size="sm" className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10 gap-1.5">
                  <User className="w-4 h-4" />
                  <span className="hidden lg:inline">{user?.name?.split(" ")[0] || "Profile"}</span>
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary-foreground/50 hover:text-primary-foreground hover:bg-white/10"
                onClick={() => logoutMutation.mutate()}
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              className="bg-white/10 text-primary-foreground hover:bg-white/20 font-medium rounded-full px-4 border border-white/20"
              onClick={() => (window.location.href = getLoginUrl())}
            >
              Sign In
            </Button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/10">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 p-0 border-l border-white/10" style={{ background: 'oklch(0.14 0.04 260)' }}>
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <SheetDescription className="sr-only">Main navigation links for RI Tennis Academy</SheetDescription>

            {/* Mobile header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <img src={LOGO_URL} alt="RI Tennis Academy" className="w-9 h-9 rounded-full object-cover border border-accent/40" />
                <div>
                  <div className="font-extrabold text-accent text-sm" style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.08em' }}>RI TENNIS</div>
                  <div className="text-white/40 text-[10px] tracking-widest uppercase">Academy</div>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-white/10" onClick={() => setOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Nav links */}
            <nav className="flex flex-col p-4 gap-1">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
                  <span
                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                      isActive(link.href)
                        ? "bg-accent/20 text-accent"
                        : "text-white/70 hover:text-white hover:bg-white/8"
                    }`}
                  >
                    {link.label}
                    {isActive(link.href) && <ChevronRight className="w-4 h-4 opacity-60" />}
                  </span>
                </Link>
              ))}
              {user?.role === "admin" && (
                <Link href="/admin" onClick={() => setOpen(false)}>
                  <span className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/8 cursor-pointer">
                    Admin Dashboard
                    <ChevronRight className="w-4 h-4 opacity-40" />
                  </span>
                </Link>
              )}
            </nav>

            {/* Social + Auth in mobile */}
            <div className="px-4 pb-4 mt-2 border-t border-white/10 pt-4">
              <p className="text-xs text-white/30 px-4 mb-3 uppercase tracking-wider">Follow Coach Mario</p>
              <div className="flex gap-2 px-4 mb-5">
                {[
                  { href: "https://www.youtube.com/@MarioRITennis", label: "YouTube", Icon: Youtube },
                  { href: "https://instagram.com/deletefearwithmario", label: "Instagram", Icon: Instagram },
                  { href: "https://facebook.com/RITennisAcademy", label: "Facebook", Icon: Facebook },
                ].map(({ href, label, Icon }) => (
                  <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-accent hover:bg-white/15 transition-all"
                    title={label}
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>

              {/* Book Now CTA - always visible in mobile */}
              <Link href="/programs" onClick={() => setOpen(false)}>
                <Button className="w-full bg-accent text-accent-foreground hover:brightness-105 font-bold rounded-xl mb-3">
                  Book a Session
                </Button>
              </Link>

              {isAuthenticated ? (
                <div className="space-y-1">
                  <Link href="/profile" onClick={() => setOpen(false)}>
                    <span className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/8 cursor-pointer">
                      <User className="w-4 h-4" />
                      My Profile
                    </span>
                  </Link>
                  <button
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/8"
                    onClick={() => logoutMutation.mutate()}
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full border-white/20 text-white/70 hover:text-white hover:bg-white/10 rounded-xl"
                  onClick={() => (window.location.href = getLoginUrl())}
                >
                  Sign In
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
