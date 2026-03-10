import { useRef, useEffect, useState } from "react";
import { Download, Share2, X } from "lucide-react";
import { toast } from "sonner";

interface StoryCardProps {
  programName: string;
  sessionDate?: string;
  timePreference?: string;
  userName?: string;
  onClose: () => void;
}

export function StoryCard({ programName, sessionDate, timePreference, userName, onClose }: StoryCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(true);

  // Format date nicely
  const formattedDate = sessionDate
    ? new Date(sessionDate + "T12:00:00").toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  // Format time nicely
  const formattedTime = timePreference
    ? (() => {
        const parts = timePreference.split(":");
        const h = parseInt(parts[0], 10);
        const m = parseInt(parts[1] || "0", 10);
        const ampm = h < 12 ? "AM" : "PM";
        const h12 = h % 12 === 0 ? 12 : h % 12;
        return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
      })()
    : null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 9:16 story dimensions
    const W = 1080;
    const H = 1920;
    canvas.width = W;
    canvas.height = H;

    // ── Background gradient (dark navy to deep blue) ──────────────────────
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#0a0f1e");
    bg.addColorStop(0.5, "#0d1b3e");
    bg.addColorStop(1, "#061128");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // ── Subtle radial glow in center ──────────────────────────────────────
    const glow = ctx.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H * 0.45, 600);
    glow.addColorStop(0, "rgba(196, 255, 0, 0.08)");
    glow.addColorStop(1, "rgba(196, 255, 0, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // ── Top accent bar ────────────────────────────────────────────────────
    const accentBar = ctx.createLinearGradient(0, 0, W, 0);
    accentBar.addColorStop(0, "#c4ff00");
    accentBar.addColorStop(0.5, "#a8e600");
    accentBar.addColorStop(1, "#c4ff00");
    ctx.fillStyle = accentBar;
    ctx.fillRect(0, 0, W, 12);

    // ── Academy name (top) ────────────────────────────────────────────────
    ctx.fillStyle = "#c4ff00";
    ctx.font = "bold 52px 'Arial', sans-serif";
    ctx.letterSpacing = "8px";
    ctx.textAlign = "center";
    ctx.fillText("RI TENNIS ACADEMY", W / 2, 130);

    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "32px 'Arial', sans-serif";
    ctx.letterSpacing = "3px";
    ctx.fillText("Coach Mario Llano", W / 2, 180);

    // ── Divider line ──────────────────────────────────────────────────────
    ctx.strokeStyle = "rgba(196, 255, 0, 0.3)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(120, 215);
    ctx.lineTo(W - 120, 215);
    ctx.stroke();

    // ── Big headline ──────────────────────────────────────────────────────
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 110px 'Arial Black', 'Arial', sans-serif";
    ctx.letterSpacing = "-2px";
    ctx.textAlign = "center";
    ctx.fillText("I'M TRAINING", W / 2, 420);

    ctx.fillStyle = "#c4ff00";
    ctx.font = "bold 110px 'Arial Black', 'Arial', sans-serif";
    ctx.fillText("WITH MARIO!", W / 2, 545);

    // ── Tennis ball decoration ────────────────────────────────────────────
    // Draw a simple tennis ball circle
    ctx.beginPath();
    ctx.arc(W / 2, 720, 80, 0, Math.PI * 2);
    ctx.fillStyle = "#c4ff00";
    ctx.fill();
    // Tennis ball lines
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(W / 2, 720, 80, 0.3, Math.PI - 0.3);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(W / 2, 720, 80, Math.PI + 0.3, Math.PI * 2 - 0.3);
    ctx.stroke();

    // ── Session info card ─────────────────────────────────────────────────
    const cardY = 860;
    const cardH = formattedDate ? (formattedTime ? 340 : 260) : 200;
    const cardX = 80;
    const cardW = W - 160;

    // Card background
    ctx.fillStyle = "rgba(255,255,255,0.07)";
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 32);
    ctx.fill();

    // Card border
    ctx.strokeStyle = "rgba(196, 255, 0, 0.25)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 32);
    ctx.stroke();

    // Program label
    ctx.fillStyle = "rgba(196, 255, 0, 0.7)";
    ctx.font = "bold 30px 'Arial', sans-serif";
    ctx.letterSpacing = "4px";
    ctx.textAlign = "center";
    ctx.fillText("PROGRAM", W / 2, cardY + 55);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 52px 'Arial', sans-serif";
    ctx.letterSpacing = "0px";
    ctx.fillText(programName, W / 2, cardY + 115);

    if (formattedDate) {
      ctx.fillStyle = "rgba(196, 255, 0, 0.7)";
      ctx.font = "bold 30px 'Arial', sans-serif";
      ctx.letterSpacing = "4px";
      ctx.fillText("DATE", W / 2, cardY + 175);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 44px 'Arial', sans-serif";
      ctx.letterSpacing = "0px";
      ctx.fillText(formattedDate, W / 2, cardY + 230);
    }

    if (formattedTime) {
      ctx.fillStyle = "rgba(196, 255, 0, 0.7)";
      ctx.font = "bold 30px 'Arial', sans-serif";
      ctx.letterSpacing = "4px";
      ctx.fillText("TIME", W / 2, cardY + 285);

      ctx.fillStyle = "#c4ff00";
      ctx.font = "bold 52px 'Arial', sans-serif";
      ctx.letterSpacing = "0px";
      ctx.fillText(formattedTime, W / 2, cardY + 340);
    }

    // ── Motivational quote ────────────────────────────────────────────────
    const quoteY = cardY + cardH + 80;
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "italic 38px 'Georgia', serif";
    ctx.letterSpacing = "0px";
    ctx.textAlign = "center";
    ctx.fillText('"Delete Fear. Elevate Your Game."', W / 2, quoteY);

    // ── Tag prompt ────────────────────────────────────────────────────────
    const tagY = quoteY + 100;
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "32px 'Arial', sans-serif";
    ctx.fillText("Tag us on your story!", W / 2, tagY);

    ctx.fillStyle = "#c4ff00";
    ctx.font = "bold 40px 'Arial', sans-serif";
    ctx.fillText("@deletefearwithmario", W / 2, tagY + 55);

    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "30px 'Arial', sans-serif";
    ctx.fillText("@RITennisAcademy", W / 2, tagY + 105);

    // ── Hashtags ──────────────────────────────────────────────────────────
    const hashY = tagY + 170;
    ctx.fillStyle = "rgba(196, 255, 0, 0.5)";
    ctx.font = "28px 'Arial', sans-serif";
    ctx.fillText("#DeleteFear  #RITennisAcademy  #Tennis  #CoachMario", W / 2, hashY);

    // ── Website ───────────────────────────────────────────────────────────
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "28px 'Arial', sans-serif";
    ctx.fillText("tennispromario.com", W / 2, H - 60);

    // ── Bottom accent bar ─────────────────────────────────────────────────
    ctx.fillStyle = "#c4ff00";
    ctx.fillRect(0, H - 12, W, 12);

    // Convert to image URL
    const url = canvas.toDataURL("image/jpeg", 0.92);
    setImageUrl(url);
    setGenerating(false);
  }, [programName, formattedDate, formattedTime, userName]);

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `ri-tennis-academy-story.jpg`;
    link.click();
    toast.success("Story card downloaded! Open Instagram or Facebook and share it to your Story.");
  };

  const handleShare = async () => {
    if (!imageUrl) return;
    // Convert data URL to blob for Web Share API
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const file = new File([blob], "ri-tennis-story.jpg", { type: "image/jpeg" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "I'm training with Coach Mario!",
          text: "Just booked a session at RI Tennis Academy! #DeleteFear #RITennisAcademy",
        });
      } else {
        handleDownload();
      }
    } catch {
      handleDownload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div
        className="relative bg-card rounded-2xl overflow-hidden shadow-2xl max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-bold text-foreground text-sm">Share to Stories 📸</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Canvas (hidden, used for generation) */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Preview */}
        <div className="p-4">
          {generating ? (
            <div className="aspect-[9/16] bg-muted rounded-xl flex items-center justify-center">
              <div className="text-muted-foreground text-sm">Generating your story card...</div>
            </div>
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt="Story card preview"
              className="w-full aspect-[9/16] object-cover rounded-xl"
            />
          ) : null}
        </div>

        {/* Actions */}
        <div className="p-4 pt-0 space-y-2">
          <p className="text-xs text-muted-foreground text-center mb-3">
            Download this card and share it to your Instagram or Facebook Story. Tag{" "}
            <span className="text-accent font-semibold">@deletefearwithmario</span> to be featured!
          </p>
          <button
            onClick={handleShare}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] text-white font-bold py-3 rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Share2 className="w-4 h-4" />
            Share to Stories
          </button>
          <button
            onClick={handleDownload}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2 border border-border text-foreground font-medium py-2.5 rounded-xl text-sm hover:bg-muted transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Download Image
          </button>
        </div>
      </div>
    </div>
  );
}
