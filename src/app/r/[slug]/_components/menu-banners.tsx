"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type MenuBanner = { id: string; imageUrl: string };

const AUTOPLAY_MS = 5000;

// Banners de promoção no topo do cardápio. Com 1 banner é só a imagem;
// com 2+ vira carrossel com rolagem nativa (scroll-snap), autoplay e
// bolinhas. O autoplay pausa enquanto o cliente está tocando/arrastando.
export default function MenuBanners({
  banners,
  accent,
  onSelect,
}: {
  banners: MenuBanner[];
  accent: string;
  onSelect?: (banner: MenuBanner) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const [index, setIndex] = useState(0);
  const isCarousel = banners.length > 1;

  useEffect(() => {
    if (banners.length < 2) return;
    const timer = setInterval(() => {
      const el = trackRef.current;
      if (!el || pausedRef.current) return;
      const current = Math.round(el.scrollLeft / el.clientWidth);
      const next = (current + 1) % banners.length;
      el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (banners.length === 0) return null;

  function step(direction: -1 | 1) {
    const el = trackRef.current;
    if (!el) return;
    const current = Math.round(el.scrollLeft / el.clientWidth);
    const next = Math.min(Math.max(current + direction, 0), banners.length - 1);
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  }

  function handleScroll() {
    const el = trackRef.current;
    if (!el) return;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  }

  const pause = () => {
    pausedRef.current = true;
  };
  const resume = () => {
    pausedRef.current = false;
  };

  return (
    <div className="px-5 pt-4">
      <div className="relative group">
      <div
        ref={trackRef}
        onScroll={isCarousel ? handleScroll : undefined}
        onTouchStart={pause}
        onTouchEnd={resume}
        onMouseEnter={pause}
        onMouseLeave={resume}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none rounded-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {banners.map((b, i) => {
          const img = (
            <img
              src={b.imageUrl}
              alt={`Promoção ${i + 1}`}
              className="w-full h-full object-cover select-none"
              draggable={false}
            />
          );
          return (
            <div key={b.id} className="w-full shrink-0 snap-center aspect-[2/1] md:aspect-[3/1]">
              {onSelect ? (
                <button type="button" onClick={() => onSelect(b)} className="block w-full h-full">
                  {img}
                </button>
              ) : (
                img
              )}
            </div>
          );
        })}
      </div>

        {isCarousel && index > 0 && (
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Promoção anterior"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity duration-200"
            >
              <ChevronLeft size={18} />
            </button>
        )}
        {isCarousel && index < banners.length - 1 && (
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Próxima promoção"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity duration-200"
            >
              <ChevronRight size={18} />
            </button>
        )}
      </div>
    </div>
  );
}