import { Link } from "wouter";
import { Youtube, Instagram, Facebook, Twitter } from "lucide-react";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663342968318/kzZFsCRUb4iWMZR8LEwAKz/ri-tennis-logo_3de51834.jpg";

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
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
              Elevating your game through expert technique coaching and mental performance training.
            </p>
            <div className="flex gap-3 mt-4">
              <a href="https://youtube.com/@RiTennisMario" target="_blank" rel="noopener noreferrer"
                className="text-primary-foreground/60 hover:text-accent transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
              <a href="https://instagram.com/deletefearwithMario" target="_blank" rel="noopener noreferrer"
                className="text-primary-foreground/60 hover:text-accent transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://facebook.com/MarioLlano" target="_blank" rel="noopener noreferrer"
                className="text-primary-foreground/60 hover:text-accent transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://twitter.com/RITennisAcademy" target="_blank" rel="noopener noreferrer"
                className="text-primary-foreground/60 hover:text-accent transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
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
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-accent mb-3">Services</h3>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><Link href="/services" className="hover:text-accent transition-colors cursor-pointer">Tournament Attendance</Link></li>
              <li><Link href="/services" className="hover:text-accent transition-colors cursor-pointer">Racquet Stringing</Link></li>
              <li><Link href="/services" className="hover:text-accent transition-colors cursor-pointer">Merchandise</Link></li>
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
          <span>Coached by Mario Llano</span>
        </div>
      </div>
    </footer>
  );
}
