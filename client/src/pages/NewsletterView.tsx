import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Share2, Copy, Check, Calendar } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function NewsletterView() {
  const { slug } = useParams<{ slug: string }>();
  const [copied, setCopied] = useState(false);

  const { data: newsletter, isLoading, error } = trpc.newsletter.getBySlug.useQuery(
    { slug: slug || "" },
    { enabled: !!slug }
  );

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: newsletter?.subject || "RI Tennis Academy Newsletter",
          url,
        });
      } catch {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
        <div className="text-white/40 text-lg animate-pulse">Loading newsletter…</div>
      </div>
    );
  }

  if (error || !newsletter) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex flex-col items-center justify-center gap-4">
        <p className="text-white/60 text-lg">Newsletter not found.</p>
        <Link href="/newsletter">
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Archive
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f4f4]">
      {/* Top bar */}
      <div className="bg-[#0f1f5c] border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/newsletter">
            <Button
              variant="ghost"
              size="sm"
              className="text-white/70 hover:text-white hover:bg-white/10 gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Newsletter Archive</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </Link>

          <div className="flex items-center gap-2 min-w-0">
            {newsletter.season && (
              <span className="text-[#22c55e] text-xs font-bold uppercase tracking-widest hidden sm:inline">
                {newsletter.season}
              </span>
            )}
            {newsletter.publishedAt && (
              <span className="text-white/40 text-xs flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(newsletter.publishedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            )}
          </div>

          <Button
            onClick={handleShare}
            variant="outline"
            size="sm"
            className="border-white/20 text-white hover:bg-white/10 gap-2 flex-shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-[#22c55e]" />
                <span className="hidden sm:inline">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Newsletter content */}
      {newsletter.htmlContent ? (
        // Render the full HTML newsletter in an iframe for perfect fidelity
        <iframe
          srcDoc={newsletter.htmlContent}
          className="w-full border-0"
          style={{ minHeight: "100vh", display: "block" }}
          title={newsletter.subject}
          sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          onLoad={(e) => {
            // Auto-resize iframe to content height
            const iframe = e.currentTarget;
            try {
              const height = iframe.contentDocument?.documentElement?.scrollHeight;
              if (height) iframe.style.height = `${height}px`;
            } catch {
              iframe.style.height = "100vh";
            }
          }}
        />
      ) : (
        // Fallback: render text-based newsletter
        <div className="max-w-2xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-black text-gray-900 mb-2">{newsletter.subject}</h1>
          {newsletter.headline && (
            <p className="text-xl text-[#1a3a8f] font-bold mb-6">{newsletter.headline}</p>
          )}
          {newsletter.body && (
            <div className="prose prose-gray max-w-none mb-8">
              {newsletter.body.split("\n").map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          )}
          {newsletter.tennisTip && (
            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-r-lg mb-4">
              <h3 className="font-bold text-blue-800 mb-1">🎾 Tennis Tip of the Week</h3>
              <p className="text-gray-700">{newsletter.tennisTip}</p>
            </div>
          )}
          {newsletter.mentalTip && (
            <div className="bg-purple-50 border-l-4 border-purple-600 p-4 rounded-r-lg mb-4">
              <h3 className="font-bold text-purple-800 mb-1">🧠 Mental Tip of the Week</h3>
              <p className="text-gray-700">{newsletter.mentalTip}</p>
            </div>
          )}
          {newsletter.winnerSpotlight && (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg mb-4">
              <h3 className="font-bold text-yellow-800 mb-1">🏆 Weekly Winner Spotlight</h3>
              <p className="text-gray-700">{newsletter.winnerSpotlight}</p>
            </div>
          )}
        </div>
      )}

      {/* Bottom CTA */}
      <div className="bg-[#0f1f5c] py-10 text-center">
        <p className="text-white/60 text-sm mb-4">Ready to take your game to the next level?</p>
        <Link href="/programs">
          <Button className="bg-[#22c55e] text-white font-bold hover:bg-[#16a34a] text-base px-8 py-3">
            Book a Session with Coach Mario →
          </Button>
        </Link>
      </div>
    </div>
  );
}
