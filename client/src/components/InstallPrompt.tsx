import { useState, useEffect } from "react";
import { X, Download, Share, MoreVertical } from "lucide-react";

export function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed (running as PWA)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setInstalled(true);
      return;
    }

    // Check if user dismissed before
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) return;

    const ua = navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua);
    const android = /android/i.test(ua);

    setIsIOS(ios);
    setIsAndroid(android);

    if (ios || android) {
      // Show after 3 seconds on mobile
      const timer = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(timer);
    }

    // Listen for Chrome's beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShow(true), 3000);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShow(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem("pwa-install-dismissed", "1");
  };

  if (!show || installed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-4 duration-300">
      <div
        className="max-w-lg mx-auto rounded-2xl p-4 shadow-2xl border border-[#2563EB]/30"
        style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)" }}
      >
        <div className="flex items-start gap-3">
          {/* App icon */}
          <div className="w-12 h-12 rounded-xl bg-[#2563EB] flex items-center justify-center flex-shrink-0 text-xl">
            🎾
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="font-bold text-white text-sm">Add to Home Screen</p>
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-white p-1 -mr-1"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-gray-400 text-xs mb-3">
              Install the RI Tennis Academy app for quick access to booking, schedules & more.
            </p>

            {isIOS && (
              <div className="bg-white/5 rounded-xl p-3 text-xs text-gray-300 space-y-1.5">
                <p className="font-semibold text-[#ccff00] mb-2">📱 iPhone / iPad:</p>
                <p>1. Tap the <strong className="text-white">Share</strong> button <span className="text-[#ccff00]">↑</span> at the bottom of Safari</p>
                <p>2. Scroll down and tap <strong className="text-white">"Add to Home Screen"</strong></p>
                <p>3. Tap <strong className="text-white">"Add"</strong> — done! ✅</p>
              </div>
            )}

            {isAndroid && !deferredPrompt && (
              <div className="bg-white/5 rounded-xl p-3 text-xs text-gray-300 space-y-1.5">
                <p className="font-semibold text-[#ccff00] mb-2">🤖 Android:</p>
                <p>1. Tap the <strong className="text-white">3-dot menu ⋮</strong> at the top right</p>
                <p>2. Tap <strong className="text-white">"Add to Home Screen"</strong> or <strong className="text-white">"Install App"</strong></p>
                <p>3. Tap <strong className="text-white">"Install"</strong> — done! ✅</p>
              </div>
            )}

            {deferredPrompt && (
              <button
                onClick={handleInstall}
                className="w-full py-2.5 rounded-xl font-bold text-sm text-black flex items-center justify-center gap-2"
                style={{ background: "#ccff00" }}
              >
                <Download size={16} />
                Install App — It's Free!
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
