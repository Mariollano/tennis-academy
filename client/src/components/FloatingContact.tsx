import { useState } from "react";
import { Phone, Mail, X, MessageCircle } from "lucide-react";

export default function FloatingContact() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start gap-2">
      {/* Expanded contact options */}
      {open && (
        <div className="flex flex-col gap-2 animate-in slide-in-from-bottom-4 duration-200">
          {/* Email */}
          <a
            href="mailto:ritennismario@gmail.com"
            className="flex items-center gap-2 bg-white text-gray-800 rounded-full shadow-lg px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors border border-gray-200 whitespace-nowrap"
          >
            <Mail className="w-4 h-4 text-blue-600 shrink-0" />
            ritennismario@gmail.com
          </a>
          {/* Phone */}
          <a
            href="tel:+14019655873"
            className="flex items-center gap-2 bg-white text-gray-800 rounded-full shadow-lg px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors border border-gray-200 whitespace-nowrap"
          >
            <Phone className="w-4 h-4 text-green-600 shrink-0" />
            (401) 965-5873
          </a>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full shadow-xl px-4 py-3 font-bold text-sm transition-all duration-200 text-white"
        style={{ background: open ? "#ef4444" : "#1e3a8a" }}
        aria-label="Contact Coach Mario"
      >
        {open ? (
          <>
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Close</span>
          </>
        ) : (
          <>
            <MessageCircle className="w-4 h-4" />
            <span>Contact Mario</span>
          </>
        )}
      </button>
    </div>
  );
}
