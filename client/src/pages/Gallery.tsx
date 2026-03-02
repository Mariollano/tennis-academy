import { useState } from "react";
import { X } from "lucide-react";

const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310519663342968318/kzZFsCRUb4iWMZR8LEwAKz";

const photos = [
  { src: `${CDN}/IMG_2882_4dfd31c8.jpg`, alt: "Coach Mario with summer camp students", caption: "Summer Camp 2024 — RI Tennis Academy" },
  { src: `${CDN}/IMG_2867_fa17ab01.jpg`, alt: "Player hitting backhand", caption: "South Kingstown Tennis — Championship Season" },
  { src: `${CDN}/IMG_2866_846b0ea1.jpg`, alt: "Championship trophy winners", caption: "State Champions — South Kingstown Tennis" },
  { src: `${CDN}/IMG_2886_220d66ff.jpg`, alt: "Advanced player on grass court", caption: "Grass Court Technique" },
  { src: `${CDN}/IMG_2891_c12742f2.jpg`, alt: "High five on court", caption: "Every great shot deserves a high five" },
  { src: `${CDN}/IMG_2865_0694faf1.jpg`, alt: "Junior players in tennis hoodies", caption: "Junior Players — RI Tennis Academy" },
  { src: `${CDN}/IMG_2881_baaab9b5.jpg`, alt: "Junior player backhand clay court", caption: "Backhand technique — Summer Training" },
  { src: `${CDN}/IMG_2883_18ff44ca.jpg`, alt: "Junior player forehand jump", caption: "Jump forehand — Junior Development" },
  { src: `${CDN}/IMG_2887_9adc372b.jpg`, alt: "Junior player forehand", caption: "Forehand fundamentals — Summer Camp" },
  { src: `${CDN}/IMG_2884_19472c09.jpg`, alt: "Junior in Tennis Academy shirt", caption: "Young champion in training" },
  { src: `${CDN}/IMG_2885_b0ce7285.jpg`, alt: "Young player forehand", caption: "Building the foundation — beginner program" },
  { src: `${CDN}/IMG_2892_41ec0d25.jpg`, alt: "Happy student on court", caption: "The joy of tennis — RI Tennis Academy" },
];

export default function Gallery() {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-16">
        <div className="container text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3">Photo Gallery</h1>
          <p className="text-primary-foreground/70 text-lg max-w-xl mx-auto">
            Real moments from the court — juniors, champions, summer camps, and the joy of tennis at RI Tennis Academy.
          </p>
        </div>
      </div>

      {/* Masonry-style grid */}
      <div className="container py-12">
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          {photos.map((photo, i) => (
            <div
              key={i}
              className="break-inside-avoid rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group relative"
              onClick={() => setSelected(i)}
            >
              <img
                src={photo.src}
                alt={photo.alt}
                className="w-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-end">
                <p className="text-white text-sm font-medium p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
                  {photo.caption}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {selected !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <button
            className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
            onClick={() => setSelected(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <div
            className="max-w-4xl max-h-[90vh] flex flex-col items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={photos[selected].src}
              alt={photos[selected].alt}
              className="max-h-[80vh] max-w-full object-contain rounded-xl shadow-2xl"
            />
            <p className="text-white/80 text-sm text-center">{photos[selected].caption}</p>
            <div className="flex gap-2 mt-1">
              <button
                className="text-white/60 hover:text-white px-4 py-1 rounded-full border border-white/20 hover:border-white/50 text-sm transition-colors"
                onClick={() => setSelected((selected - 1 + photos.length) % photos.length)}
              >
                ← Prev
              </button>
              <span className="text-white/40 text-sm self-center">{selected + 1} / {photos.length}</span>
              <button
                className="text-white/60 hover:text-white px-4 py-1 rounded-full border border-white/20 hover:border-white/50 text-sm transition-colors"
                onClick={() => setSelected((selected + 1) % photos.length)}
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
