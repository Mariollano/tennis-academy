import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Menu, X, User, LogOut, Youtube, Instagram, Facebook } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663342968318/kzZFsCRUb4iWMZR8LEwAKz/ri-tennis-logo_3de51834.jpg";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/programs", label: "Programs" },
  { href: "/social", label: "Media" },
  { href: "/mental-coaching", label: "Mental Coaching" },
  { href: "/services", label: "Services" },
];

export default function Navbar() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      window.location.href = "/";
    },
    onError: () => toast.error("Logout failed"),
  });

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location.startsWith(href);

  return (
    <header className="sticky top-0 z-50 bg-primary shadow-md">
      <div className="container flex items-center justify-between h-16 gap-2">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <img
            src={LOGO_URL}
            alt="RI Tennis Academy"
            className="w-11 h-11 rounded-full object-contain bg-white border-2 border-accent shadow-sm"
          />
          <div className="leading-tight hidden lg:block">
            <div className="text-accent font-bold text-sm tracking-wide">RI TENNIS</div>
            <div className="text-primary-foreground/80 text-xs tracking-widest uppercase">Academy</div>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <span
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                  isActive(link.href)
                    ? "bg-accent text-accent-foreground"
                    : "text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10"
                }`}
              >
                {link.label}
              </span>
            </Link>
          ))}
          {user?.role === "admin" && (
            <Link href="/admin">
              <span
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                  isActive("/admin")
                    ? "bg-accent text-accent-foreground"
                    : "text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10"
                }`}
              >
                Admin
              </span>
            </Link>
          )}
        </nav>

        {/* Social Icons — Desktop */}
        <div className="hidden lg:flex items-center gap-1 mr-1">
          <a href="https://www.youtube.com/@MarioRITennis" target="_blank" rel="noopener noreferrer"
            className="text-primary-foreground/60 hover:text-accent transition-colors p-1.5 rounded-md hover:bg-white/10" title="YouTube">
            <Youtube className="w-4 h-4" />
          </a>
          <a href="https://instagram.com/deletefearwithmario" target="_blank" rel="noopener noreferrer"
            className="text-primary-foreground/60 hover:text-accent transition-colors p-1.5 rounded-md hover:bg-white/10" title="Instagram">
            <Instagram className="w-4 h-4" />
          </a>
          <a href="https://facebook.com/RITennisAcademy" target="_blank" rel="noopener noreferrer"
            className="text-primary-foreground/60 hover:text-accent transition-colors p-1.5 rounded-md hover:bg-white/10" title="Facebook">
            <Facebook className="w-4 h-4" />
          </a>
        </div>

        {/* Auth Buttons */}
        <div className="hidden md:flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <Link href="/profile">
                <Button variant="ghost" size="sm" className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10">
                  <User className="w-4 h-4 mr-1" />
                  {user?.name?.split(" ")[0] || "Profile"}
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10"
                onClick={() => logoutMutation.mutate()}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
onClick={() => (window.location.href = getLoginUrl())}
              >
                Sign In
              </Button>
            )}
          </div>

        {/* Mobile Menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="text-primary-foreground">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-primary text-primary-foreground w-64 p-0">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <SheetDescription className="sr-only">Main navigation links for RI Tennis Academy</SheetDescription>
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
              <img src={LOGO_URL} alt="RI Tennis Academy" className="w-8 h-8 rounded-full object-cover border border-accent" />
              <span className="font-bold text-accent">RI Tennis Academy</span>
            </div>
              <Button variant="ghost" size="icon" className="text-primary-foreground" onClick={() => setOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <nav className="flex flex-col p-4 gap-1">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
                  <span
                    className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                      isActive(link.href)
                        ? "bg-accent text-accent-foreground"
                        : "text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10"
                    }`}
                  >
                    {link.label}
                  </span>
                </Link>
              ))}
              {user?.role === "admin" && (
                <Link href="/admin" onClick={() => setOpen(false)}>
                  <span className="block px-3 py-2 rounded-md text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10 cursor-pointer">
                    Admin
                  </span>
                </Link>
              )}
              {/* Social icons in mobile menu */}
              <div className="mt-4 pt-4 border-t border-white/10 mb-2">
                <p className="text-xs text-primary-foreground/40 px-3 mb-2 uppercase tracking-wider">Follow Mario</p>
                <div className="flex gap-3 px-3">
                  <a href="https://www.youtube.com/@MarioRITennis" target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-primary-foreground/70 hover:text-accent transition-colors text-sm">
                    <Youtube className="w-4 h-4" /> YouTube
                  </a>
                  <a href="https://instagram.com/deletefearwithmario" target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-primary-foreground/70 hover:text-accent transition-colors text-sm">
                    <Instagram className="w-4 h-4" /> Instagram
                  </a>
                </div>
              </div>
              <div className="pt-2 border-t border-white/10">
                {isAuthenticated ? (
                  <>
                    <Link href="/profile" onClick={() => setOpen(false)}>
                      <span className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10 cursor-pointer">
                        <User className="w-4 h-4" /> Profile
                      </span>
                    </Link>
                    <button
                      className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10"
                      onClick={() => logoutMutation.mutate()}
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </>
                ) : (
                  <Button
                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
                    onClick={() => (window.location.href = getLoginUrl())}
                  >
                    Sign In
                  </Button>
                )}
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
