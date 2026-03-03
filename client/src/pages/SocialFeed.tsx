import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Youtube, Instagram, Facebook, Twitter, ExternalLink, Play, Users } from "lucide-react";

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const MARIO_AVATAR = "https://d2xsxph8kpxj0f.cloudfront.net/310519663342968318/kzZFsCRUb4iWMZR8LEwAKz/mario-us-open_68ad2763.jpg";

const socialChannels = [
  {
    platform: "YouTube",
    handle: "@MarioRITennis",
    url: "https://www.youtube.com/@MarioRITennis",
    icon: <Youtube className="w-5 h-5" />,
    gradient: "from-red-600 to-orange-500",
    bgGradient: "from-red-950 via-red-900 to-orange-950",
    accentColor: "text-red-400",
    borderColor: "border-red-500/40",
    glowColor: "shadow-red-500/20",
    stat: "Shorts & Videos",
    statIcon: <Play className="w-4 h-4" />,
    description: "Technique breakdowns, mental game lessons, match analysis, and the Delete Fear philosophy in action.",
    cta: "Watch Now",
    featured: true,
  },
  {
    platform: "Instagram",
    handle: "@deletefearwithMario",
    url: "https://instagram.com/deletefearwithMario",
    icon: <InstagramIcon />,
    gradient: "from-purple-600 via-pink-500 to-orange-400",
    bgGradient: "from-purple-950 via-pink-950 to-orange-950",
    accentColor: "text-pink-400",
    borderColor: "border-pink-500/40",
    glowColor: "shadow-pink-500/20",
    stat: "Mental Coaching",
    statIcon: <Users className="w-4 h-4" />,
    description: "Daily mental coaching tips, motivational content, and the Delete Fear philosophy.",
    cta: "Follow",
    featured: true,
  },
  {
    platform: "Instagram",
    handle: "@RITennisandFAYE",
    url: "https://instagram.com/RITennisandFAYE",
    icon: <InstagramIcon />,
    gradient: "from-purple-600 via-pink-500 to-orange-400",
    bgGradient: "from-purple-950 via-pink-950 to-orange-950",
    accentColor: "text-pink-400",
    borderColor: "border-pink-500/40",
    glowColor: "shadow-pink-500/20",
    stat: "Academy Life",
    statIcon: <Users className="w-4 h-4" />,
    description: "Student highlights, court sessions, and RI Tennis community moments.",
    cta: "Follow",
    featured: false,
  },
  {
    platform: "TikTok",
    handle: "@deletefear",
    url: "https://tiktok.com/@deletefear",
    icon: <TikTokIcon />,
    gradient: "from-cyan-500 to-pink-500",
    bgGradient: "from-gray-950 via-gray-900 to-gray-950",
    accentColor: "text-cyan-400",
    borderColor: "border-cyan-500/40",
    glowColor: "shadow-cyan-500/20",
    stat: "Short-form Tips",
    statIcon: <Play className="w-4 h-4" />,
    description: "Quick tennis tips, mental game insights, and behind-the-scenes academy content.",
    cta: "Follow",
    featured: false,
  },
  {
    platform: "Facebook",
    handle: "RITennisAcademy",
    url: "https://facebook.com/RITennisAcademy",
    icon: <Facebook className="w-5 h-5" />,
    gradient: "from-blue-600 to-blue-400",
    bgGradient: "from-blue-950 via-blue-900 to-blue-950",
    accentColor: "text-blue-400",
    borderColor: "border-blue-500/40",
    glowColor: "shadow-blue-500/20",
    stat: "2.2K Followers",
    statIcon: <Users className="w-4 h-4" />,
    description: "Academy updates, event announcements, program schedules, and community discussions.",
    cta: "Follow",
    featured: false,
  },
  {
    platform: "X / Twitter",
    handle: "@RITennisAcademy",
    url: "https://twitter.com/RITennisAcademy",
    icon: <Twitter className="w-5 h-5" />,
    gradient: "from-gray-600 to-gray-400",
    bgGradient: "from-gray-950 via-gray-900 to-gray-950",
    accentColor: "text-gray-300",
    borderColor: "border-gray-500/40",
    glowColor: "shadow-gray-500/20",
    stat: "Live Updates",
    statIcon: <Play className="w-4 h-4" />,
    description: "Quick tennis tips, match thoughts, schedule updates, and real-time academy news.",
    cta: "Follow",
    featured: false,
  },
];

const featuredVideos = [
  {
    title: "Comfort is the ENEMY. Your brain wants you to be a loser. Why?",
    channel: "@MarioRITennis",
    platform: "YouTube",
    thumbnail: "https://i.ytimg.com/vi/-Q65jiJH1Bg/hq2.jpg",
    url: "https://youtube.com/shorts/-Q65jiJH1Bg",
    duration: "Short",
  },
  {
    title: "You are DOING IT all WRONG!",
    channel: "@MarioRITennis",
    platform: "YouTube",
    thumbnail: "https://i.ytimg.com/vi/1FGAqbl0-Fo/hq2.jpg",
    url: "https://youtube.com/shorts/1FGAqbl0-Fo",
    duration: "Short",
  },
  {
    title: "CHOKING IS a LIE! And here's WHY!",
    channel: "@MarioRITennis",
    platform: "YouTube",
    thumbnail: "https://i.ytimg.com/vi/BD7MTizqBHM/hq2.jpg",
    url: "https://youtube.com/shorts/BD7MTizqBHM",
    duration: "Short",
  },
];

export default function SocialFeed() {
  const featured = socialChannels.filter((c) => c.featured);
  const rest = socialChannels.filter((c) => !c.featured);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header — full bleed with Mario's photo */}
      <section className="relative bg-gray-950 text-white overflow-hidden">
        {/* Background gradient blobs */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/80 via-gray-950 to-gray-950" />
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-accent/10 to-transparent" />
        </div>

        <div className="container relative py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div>
              <Badge className="mb-4 bg-accent/20 text-accent border-accent/30">Social Media</Badge>
              <h1 className="text-5xl md:text-6xl font-extrabold mb-4 leading-tight">
                Follow the<br /><span className="text-accent">Journey</span>
              </h1>
              <p className="text-white/70 max-w-lg text-lg mb-8">
                Stay connected with Coach Mario across all platforms. Watch technique videos, get mental
                game tips, and follow the RI Tennis Academy community.
              </p>
              {/* Platform quick links */}
              <div className="flex flex-wrap gap-3">
                {[
                  { label: "YouTube", icon: <Youtube className="w-4 h-4" />, url: "https://www.youtube.com/@MarioRITennis", color: "bg-red-600 hover:bg-red-500" },
                  { label: "Instagram", icon: <InstagramIcon />, url: "https://instagram.com/deletefearwithMario", color: "bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400" },
                  { label: "TikTok", icon: <TikTokIcon />, url: "https://tiktok.com/@deletefear", color: "bg-gray-800 hover:bg-gray-700" },
                  { label: "Facebook", icon: <Facebook className="w-4 h-4" />, url: "https://facebook.com/RITennisAcademy", color: "bg-blue-700 hover:bg-blue-600" },
                ].map((p) => (
                  <a
                    key={p.label}
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-semibold transition-all ${p.color}`}
                  >
                    {p.icon}
                    {p.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Right: Mario's Photo — large and prominent */}
            <div className="flex justify-center md:justify-end">
              <div className="relative">
                {/* Glow ring */}
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-accent/40 via-primary/30 to-transparent blur-2xl" />
                {/* Photo */}
                <div className="relative w-72 h-80 md:w-80 md:h-96 rounded-3xl overflow-hidden border-4 border-white/20 shadow-2xl">
                  <img
                    src={MARIO_AVATAR}
                    alt="Coach Mario Llano at the US Open"
                    className="w-full h-full object-cover object-top"
                  />
                  {/* Name overlay at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-5">
                    <p className="text-white font-extrabold text-xl leading-tight">Coach Mario Llano</p>
                    <p className="text-accent text-sm font-semibold">RI Tennis Academy</p>
                  </div>
                </div>
                {/* US Open badge */}
                <div className="absolute -top-3 -right-3 bg-accent text-accent-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                  🎾 US Open
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Videos */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center">
              <Play className="w-5 h-5 text-white fill-white" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Featured Shorts</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredVideos.map((video) => (
              <a key={video.title} href={video.url} target="_blank" rel="noopener noreferrer" className="group">
                <div className="rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 bg-card border border-border">
                  <div className="relative aspect-[9/16] max-h-64 overflow-hidden">
                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-16 h-16 rounded-full bg-red-500/90 flex items-center justify-center shadow-2xl">
                        <Play className="w-7 h-7 text-white fill-white ml-1" />
                      </div>
                    </div>
                    <Badge className="absolute top-3 left-3 bg-red-500 text-white border-0 text-xs font-bold">
                      YouTube Short
                    </Badge>
                    <div className="absolute bottom-3 left-3 right-3">
                      <p className="text-white font-semibold text-sm leading-tight line-clamp-2">{video.title}</p>
                      <p className="text-white/60 text-xs mt-1">{video.channel}</p>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Main Channels — Big Cards with large photo */}
      <section className="py-16 bg-gray-950">
        <div className="container">
          <h2 className="text-2xl font-bold text-white mb-2">Main Channels</h2>
          <p className="text-gray-400 mb-8">The two places where Mario shows up most</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featured.map((channel) => (
              <a
                key={channel.handle}
                href={channel.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <div className={`relative rounded-3xl overflow-hidden border ${channel.borderColor} hover:scale-[1.02] transition-all duration-300 shadow-xl ${channel.glowColor} hover:shadow-2xl`}>
                  {/* Gradient background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${channel.bgGradient}`} />
                  {/* Decorative glow orb */}
                  <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br ${channel.gradient} opacity-30 blur-2xl`} />

                  <div className="relative p-8">
                    {/* Avatar row — large photo */}
                    <div className="flex items-center gap-5 mb-6">
                      <div className="relative flex-shrink-0">
                        {/* Large circular photo */}
                        <div className="w-20 h-20 rounded-full overflow-hidden border-3 border-white/30 shadow-xl ring-2 ring-white/10">
                          <img
                            src={MARIO_AVATAR}
                            alt="Coach Mario"
                            className="w-full h-full object-cover object-top"
                          />
                        </div>
                        {/* Platform badge */}
                        <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br ${channel.gradient} flex items-center justify-center text-white shadow-lg border-2 border-gray-950`}>
                          {channel.icon}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs font-bold uppercase tracking-widest ${channel.accentColor} mb-0.5`}>{channel.platform}</div>
                        <div className="text-white text-xl font-extrabold truncate">{channel.handle}</div>
                        <div className={`flex items-center gap-1.5 ${channel.accentColor} text-sm mt-1`}>
                          {channel.statIcon}
                          <span>{channel.stat}</span>
                        </div>
                      </div>
                      <ExternalLink className="w-5 h-5 text-white/30 group-hover:text-white/70 transition-colors flex-shrink-0" />
                    </div>

                    <p className="text-white/60 text-sm leading-relaxed mb-6">{channel.description}</p>
                    <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r ${channel.gradient} text-white text-sm font-bold shadow-lg`}>
                      {channel.cta} <ExternalLink className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Other Channels — Compact Cards with photo */}
      <section className="py-12 bg-gray-900">
        <div className="container">
          <h2 className="text-xl font-bold text-white mb-6">More Channels</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {rest.map((channel) => (
              <a
                key={channel.handle}
                href={channel.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <div className={`relative rounded-2xl overflow-hidden border ${channel.borderColor} hover:scale-[1.03] transition-all duration-300 shadow-lg hover:shadow-xl`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${channel.bgGradient}`} />
                  <div className="relative p-5">
                    {/* Photo + platform badge */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="relative flex-shrink-0">
                        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/30 shadow-md">
                          <img
                            src={MARIO_AVATAR}
                            alt="Coach Mario"
                            className="w-full h-full object-cover object-top"
                          />
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br ${channel.gradient} flex items-center justify-center text-white shadow-md border-2 border-gray-950`}>
                          <span className="scale-75">{channel.icon}</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs font-bold uppercase tracking-widest ${channel.accentColor} mb-0.5`}>{channel.platform}</div>
                        <div className="text-white font-bold text-sm truncate">{channel.handle}</div>
                      </div>
                    </div>

                    <div className={`flex items-center gap-1 ${channel.accentColor} text-xs mb-3`}>
                      {channel.statIcon}
                      <span>{channel.stat}</span>
                    </div>
                    <p className="text-white/50 text-xs leading-relaxed mb-4 line-clamp-2">{channel.description}</p>
                    <div className={`flex items-center gap-1.5 text-xs font-semibold ${channel.accentColor} group-hover:text-white transition-colors`}>
                      <ExternalLink className="w-3 h-3" /> {channel.cta}
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* SMS Opt-in CTA */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container text-center max-w-2xl">
          <div className="w-14 h-14 rounded-2xl bg-accent/20 border border-accent/30 flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 text-accent" />
          </div>
          <h2 className="text-3xl font-extrabold mb-3">Get Daily Updates via Text</h2>
          <p className="text-primary-foreground/70 mb-6">
            Sign up for RI Tennis Academy and opt in to receive Mario's daily updates, schedule changes, and motivational messages directly to your phone.
          </p>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold px-8 py-3 text-base rounded-full">
            Sign Up & Opt In to SMS
          </Button>
        </div>
      </section>
    </div>
  );
}
