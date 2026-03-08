import { Link } from "wouter";
import { Phone, Mail, MapPin, Youtube, Instagram, Facebook, Twitter } from "lucide-react";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663342968318/kzZFsCRUb4iWMZR8LEwAKz/ri-tennis-logo_3de51834.jpg";

const socialLinks = [
  { href: "https://www.youtube.com/@MarioRITennis", label: "YouTube", Icon: Youtube },
  { href: "https://instagram.com/deletefearwithmario", label: "Instagram", Icon: Instagram },
  { href: "https://facebook.com/RITennisAcademy", label: "Facebook", Icon: Facebook },
  { href: "https://x.com/ritennisacademy", label: "X / Twitter", Icon: Twitter },
];

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-6">
              <img src={LOGO_URL} alt="RI Tennis Academy" className="w-12 h-12 rounded-full object-contain bg-white border-2 border-accent/40" />
              <div>
                <div className="text-accent font-extrabold text-lg" style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.08em' }}>RI TENNIS ACADEMY</div>
                <div className="text-primary-foreground/40 text-xs tracking-widest uppercase">Coach Mario Llano</div>
              </div>
            </Link>
            <p className="text-primary-foreground/60 text-sm leading-relaxed mb-6 max-w-xs">
              Rhode Island's premier tennis academy. Developing players of all ages through world-class coaching, mental performance training, and a passion for the game.
            </p>
            <div className="space-y-3 mb-6">
              <a href="tel:+14019655873" className="flex items-center gap-2.5 text-primary-foreground/60 hover:text-primary-foreground transition-colors text-sm">
                <Phone className="w-4 h-4" />
                (401) 965-5873
              </a>
              <a href="mailto:ritennismario@gmail.com" className="flex items-center gap-2.5 text-primary-foreground/60 hover:text-primary-foreground transition-colors text-sm">
                <Mail className="w-4 h-4" />
                ritennismario@gmail.com
              </a>
              <div className="flex items-center gap-2.5 text-primary-foreground/40 text-sm">
                <MapPin className="w-4 h-4" />
                Rhode Island, USA
              </div>
            </div>
            <div className="flex gap-2">
              {socialLinks.map(({ href, label, Icon }) => (
                <a key={href} href={href} target="_blank" rel="noopener noreferrer" title={label}
                  className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-primary-foreground/50 hover:text-accent hover:bg-white/20 transition-all">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-primary-foreground font-bold text-sm uppercase tracking-wider mb-5">Programs</h3>
            <ul className="space-y-3">
              {[
                { label: "Private Lessons", href: "/book/private_lesson" },
                { label: "105 Game Clinic", href: "/book/clinic_105" },
                { label: "Junior Programs", href: "/book/junior_daily" },
                { label: "Summer Camp", href: "/book/summer_camp_daily" },
                { label: "Mental Coaching", href: "/mental-coaching" },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link href={href}>
                    <span className="text-primary-foreground/50 hover:text-primary-foreground text-sm transition-colors cursor-pointer">{label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-primary-foreground font-bold text-sm uppercase tracking-wider mb-5">Academy</h3>
            <ul className="space-y-3">
              {[
                { label: "All Programs", href: "/programs" },
                { label: "My Schedule", href: "/schedule" },
                { label: "Services", href: "/services" },
                { label: "Gallery", href: "/gallery" },
                { label: "Social Media", href: "/social" },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link href={href}>
                    <span className="text-primary-foreground/50 hover:text-primary-foreground text-sm transition-colors cursor-pointer">{label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-primary-foreground/30 text-xs">
            &copy; {new Date().getFullYear()} RI Tennis Academy &middot; Coach Mario Llano &middot; All rights reserved.
          </p>
          <p className="text-primary-foreground/20 text-xs">Delete Fear. Play Free.</p>
        </div>
      </div>
    </footer>
  );
}
