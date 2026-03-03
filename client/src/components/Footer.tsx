import { Link } from "wouter";
import { Youtube, Instagram, Facebook } from "lucide-react";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663342968318/kzZFsCRUb4iWMZR8LEwAKz/ri-tennis-logo_3de51834.jpg";

const socialLinks = [
  {
    href: "https://youtube.com/@RitennisMario",
    label: "YouTube",
    icon: <Youtube className="w-5 h-5" />,
    color: "hover:bg-red-600 hover:border-red-600",
  },
  {
    href: "https://instagram.com/deletefearwithmario",
    label: "Instagram",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
    color: "hover:bg-pink-600 hover:border-pink-600",
  },
  {
    href: "https://facebook.com/MarioLlano",
    label: "Facebook",
    icon: <Facebook className="w-5 h-5" />,
    color: "hover:bg-blue-600 hover:border-blue-600",
  },
  {
    href: "https://www.tiktok.com/@deletefearwithmario",
    label: "TikTok",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.27 8.27 0 004.84 1.55V6.79a4.85 4.85 0 01-1.07-.1z"/>
      </svg>
    ),
    color: "hover:bg-black hover:border-black",
  },
];

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      {/* Social Media Bar */}
      <div className="border-b border-white/10">
        <div className="container py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-primary-foreground/60 text-sm font-medium">Follow Coach Mario</p>
            <div className="flex items-center gap-3">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={s.label}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 text-primary-foreground/70 hover:text-white transition-all duration-200 ${s.color}`}
                >
                  {s.icon}
                  <span className="text-sm font-medium hidden sm:inline">{s.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img src={LOGO_URL} alt="RI Tennis Academy" className="w-12 h-12 rounded-full object-cover border-2 border-accent" />
              <div>
                <div className="text-accent font-bold text-sm">RI TENNIS</div>
                <div className="text-primary-foreground/70 text-xs tracking-widest uppercase">Academy</div>
              </div>
            </div>
            <p className="text-primary-foreground/70 text-sm leading-relaxed">
              Elevating your game through expert technique coaching and mental performance training with Coach Mario Llano.
            </p>
          </div>

          {/* Programs */}
          <div>
            <h3 className="font-semibold text-accent mb-3">Programs</h3>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><Link href="/programs" className="hover:text-accent transition-colors cursor-pointer">Private Lessons</Link></li>
              <li><Link href="/programs" className="hover:text-accent transition-colors cursor-pointer">105 Game Clinic</Link></li>
              <li><Link href="/programs" className="hover:text-accent transition-colors cursor-pointer">Junior Programs</Link></li>
              <li><Link href="/programs" className="hover:text-accent transition-colors cursor-pointer">Summer Camp</Link></li>
              <li><Link href="/mental-coaching" className="hover:text-accent transition-colors cursor-pointer">Mental Coaching</Link></li>
              <li><Link href="/programs" className="hover:text-accent transition-colors cursor-pointer">Tournament Attendance</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-accent mb-3">Services</h3>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><Link href="/services" className="hover:text-accent transition-colors cursor-pointer">Racquet Stringing</Link></li>
              <li><Link href="/services" className="hover:text-accent transition-colors cursor-pointer">Merchandise</Link></li>
              <li><Link href="/gallery" className="hover:text-accent transition-colors cursor-pointer">Photo Gallery</Link></li>
              <li><Link href="/social" className="hover:text-accent transition-colors cursor-pointer">Social Media</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-accent mb-3">Contact</h3>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li>Rhode Island, USA</li>
              <li>RI Tennis Academy</li>
              <li>Coach: Mario Llano</li>
              <li className="pt-2">
                <Link href="/book/private_lesson">
                  <span className="inline-block bg-accent text-accent-foreground px-4 py-2 rounded-md text-sm font-semibold hover:bg-accent/90 transition-colors cursor-pointer">
                    Book a Session
                  </span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-primary-foreground/50">
          <span>© {new Date().getFullYear()} RI Tennis Academy. All rights reserved.</span>
          <span>Coached by Mario Llano — Delete Fear. Play Free.</span>
        </div>
      </div>
    </footer>
  );
}
