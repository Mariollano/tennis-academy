import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Youtube, Instagram, Facebook, Twitter, ExternalLink, Play } from "lucide-react";

// TikTok icon as SVG since lucide doesn't have it
const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/>
  </svg>
);

const socialChannels = [
  {
    platform: "YouTube",
    handle: "Ri Tennis Mario",
    url: "https://youtube.com/@RiTennisMario",
    icon: <Youtube className="w-5 h-5" />,
    color: "bg-red-500",
    textColor: "text-red-600",
    bgLight: "bg-red-50",
    borderColor: "border-red-200",
    description: "Full coaching videos, technique breakdowns, match analysis, and mental game lessons.",
    cta: "Watch Videos",
  },
  {
    platform: "Instagram",
    handle: "@deletefearwithMario",
    url: "https://instagram.com/deletefearwithMario",
    icon: <Instagram className="w-5 h-5" />,
    color: "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400",
    textColor: "text-pink-600",
    bgLight: "bg-pink-50",
    borderColor: "border-pink-200",
    description: "Mental coaching tips, motivational content, and the 'Delete Fear' philosophy in action.",
    cta: "Follow on Instagram",
  },
  {
    platform: "Instagram",
    handle: "@RITennisandFAYE",
    url: "https://instagram.com/RITennisandFAYE",
    icon: <Instagram className="w-5 h-5" />,
    color: "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400",
    textColor: "text-pink-600",
    bgLight: "bg-pink-50",
    borderColor: "border-pink-200",
    description: "Academy life, student highlights, court sessions, and RI Tennis community moments.",
    cta: "Follow on Instagram",
  },
  {
    platform: "TikTok",
    handle: "@deletefear",
    url: "https://tiktok.com/@deletefear",
    icon: <TikTokIcon />,
    color: "bg-black",
    textColor: "text-gray-900",
    bgLight: "bg-gray-50",
    borderColor: "border-gray-200",
    description: "Short-form tennis tips, mental game insights, and behind-the-scenes academy content.",
    cta: "Follow on TikTok",
  },
  {
    platform: "Facebook",
    handle: "Mario Llano",
    url: "https://facebook.com/MarioLlano",
    icon: <Facebook className="w-5 h-5" />,
    color: "bg-blue-600",
    textColor: "text-blue-700",
    bgLight: "bg-blue-50",
    borderColor: "border-blue-200",
    description: "Academy updates, event announcements, program schedules, and community discussions.",
    cta: "Follow on Facebook",
  },
  {
    platform: "X / Twitter",
    handle: "@RITennisAcademy",
    url: "https://twitter.com/RITennisAcademy",
    icon: <Twitter className="w-5 h-5" />,
    color: "bg-black",
    textColor: "text-gray-900",
    bgLight: "bg-gray-50",
    borderColor: "border-gray-200",
    description: "Quick tennis tips, match thoughts, schedule updates, and real-time academy news.",
    cta: "Follow on X",
  },
];

const featuredVideos = [
  {
    title: "Delete Fear: The Mental Game of Tennis",
    channel: "Ri Tennis Mario",
    platform: "YouTube",
    thumbnail: "https://picsum.photos/seed/tennis1/400/225",
    url: "https://youtube.com/@RiTennisMario",
    duration: "12:34",
  },
  {
    title: "Forehand Technique Breakdown",
    channel: "Ri Tennis Mario",
    platform: "YouTube",
    thumbnail: "https://picsum.photos/seed/tennis2/400/225",
    url: "https://youtube.com/@RiTennisMario",
    duration: "8:15",
  },
  {
    title: "Junior Camp Highlights",
    channel: "RITennisandFAYE",
    platform: "Instagram",
    thumbnail: "https://picsum.photos/seed/tennis3/400/225",
    url: "https://instagram.com/RITennisandFAYE",
    duration: "2:45",
  },
];

export default function SocialFeed() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container">
          <Badge className="mb-4 bg-accent/20 text-accent border-accent/30">Social Media</Badge>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Follow the Journey</h1>
          <p className="text-primary-foreground/80 max-w-2xl text-lg">
            Stay connected with Coach Mario across all platforms. Watch technique videos, get mental
            game tips, and follow the RI Tennis Academy community.
          </p>
        </div>
      </section>

      {/* Featured Videos */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <h2 className="text-2xl font-bold text-foreground mb-8 flex items-center gap-2">
            <Play className="w-6 h-6 text-red-500" /> Featured Content
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredVideos.map((video) => (
              <a key={video.title} href={video.url} target="_blank" rel="noopener noreferrer">
                <Card className="overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-pointer">
                  <div className="relative">
                    <img src={video.thumbnail} alt={video.title} className="w-full aspect-video object-cover" />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
                        <Play className="w-6 h-6 text-primary ml-1" />
                      </div>
                    </div>
                    <Badge className="absolute bottom-2 right-2 bg-black/80 text-white text-xs">
                      {video.duration}
                    </Badge>
                    <Badge className={`absolute top-2 left-2 text-xs ${video.platform === "YouTube" ? "bg-red-500 text-white" : "bg-pink-500 text-white"}`}>
                      {video.platform}
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-foreground text-sm leading-tight mb-1">{video.title}</h3>
                    <p className="text-muted-foreground text-xs">{video.channel}</p>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Social Channels Grid */}
      <section className="py-16">
        <div className="container">
          <h2 className="text-2xl font-bold text-foreground mb-8">All Channels</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {socialChannels.map((channel) => (
              <Card key={`${channel.platform}-${channel.handle}`}
                className={`border ${channel.borderColor} hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden`}>
                <CardContent className="p-0">
                  {/* Platform Header */}
                  <div className={`${channel.bgLight} p-4 border-b ${channel.borderColor}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${channel.color} text-white flex items-center justify-center`}>
                          {channel.icon}
                        </div>
                        <div>
                          <div className={`font-bold text-sm ${channel.textColor}`}>{channel.platform}</div>
                          <div className="text-muted-foreground text-xs">{channel.handle}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Description */}
                  <div className="p-4">
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4">{channel.description}</p>
                    <a href={channel.url} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline" className={`w-full border ${channel.borderColor} ${channel.textColor} hover:${channel.bgLight}`}>
                        <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                        {channel.cta}
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* SMS Opt-in CTA */}
      <section className="py-12 bg-primary text-primary-foreground">
        <div className="container text-center max-w-2xl">
          <h2 className="text-2xl font-bold mb-3">Get Daily Updates via Text</h2>
          <p className="text-primary-foreground/80 mb-6">
            Sign up for RI Tennis Academy and opt in to receive Mario's daily updates, schedule changes, and motivational messages directly to your phone.
          </p>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold px-8">
            Sign Up & Opt In to SMS
          </Button>
        </div>
      </section>
    </div>
  );
}
