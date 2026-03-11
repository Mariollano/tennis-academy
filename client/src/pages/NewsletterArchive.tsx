import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Calendar, ChevronRight, BookOpen } from "lucide-react";

export default function NewsletterArchive() {
  const { data: newsletters, isLoading } = trpc.newsletter.listPublished.useQuery();

  return (
    <div className="min-h-screen bg-[#0a0f1e]">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0f1f5c] to-[#0a0f1e] border-b border-white/10">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#ccff00] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        </div>
        <div className="relative max-w-4xl mx-auto px-6 py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-[#ccff00]/10 border border-[#ccff00]/30 rounded-full px-4 py-1.5 text-[#ccff00] text-sm font-semibold mb-6 uppercase tracking-widest">
            <Mail className="w-4 h-4" />
            Newsletter Archive
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            RI Tennis Academy<br />
            <span className="text-[#ccff00]">Newsletter</span>
          </h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto">
            Tips, updates, program schedules, and inspiration from Coach Mario Llano — straight from the court.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {isLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !newsletters || newsletters.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/40 text-lg">No newsletters published yet.</p>
            <p className="text-white/30 text-sm mt-2">Check back soon for updates from Coach Mario.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {newsletters.map((nl, idx) => (
              <Link key={nl.id} href={`/newsletter/${nl.slug}`}>
                <Card className="bg-white/5 border-white/10 hover:bg-white/8 hover:border-[#ccff00]/30 transition-all duration-200 cursor-pointer group">
                  <CardContent className="p-6 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#ccff00]/10 border border-[#ccff00]/20 flex items-center justify-center">
                        <Mail className="w-5 h-5 text-[#ccff00]" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {idx === 0 && (
                            <Badge className="bg-[#ccff00] text-[#0a0f1e] text-xs font-bold px-2 py-0.5">
                              Latest
                            </Badge>
                          )}
                          {nl.season && (
                            <Badge variant="outline" className="border-white/20 text-white/60 text-xs">
                              {nl.season}
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-white font-bold text-lg truncate group-hover:text-[#ccff00] transition-colors">
                          {nl.subject}
                        </h3>
                        {nl.publishedAt && (
                          <div className="flex items-center gap-1.5 text-white/40 text-sm mt-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(nl.publishedAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-[#ccff00] flex-shrink-0 transition-colors" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-white/40 text-sm mb-4">Want to book a session with Coach Mario?</p>
          <Link href="/programs">
            <Button className="bg-[#ccff00] text-[#0a0f1e] font-bold hover:bg-[#b8e600]">
              Book a Session →
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
