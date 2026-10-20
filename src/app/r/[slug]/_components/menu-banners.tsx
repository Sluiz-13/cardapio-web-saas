"use client";

import { useEffect, useRef } from "react";
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

  // Setas: anda 1 banner pra frente/trás, dando a volta no fim/começo.
  function step(direction: -1 | 1) {
    const el = trackRef.current;
    if (!el) return;
    const current = Math.round(el.scrollLeft / el.clientWidth);
    const next = (current + direction + banners.length) % banners.length;
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  }

  const pause = () => {
    pausedRef.current = true;
  };
  const resume = () => {
    pausedRef.current = false;
  };

  return (
    <div className="px-5 pt-4">
      <div className="relative">
      <div
        ref={trackRef}
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

        {isCarousel && (
          <>
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Promoção anterior"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/85 hover:bg-white shadow flex items-center justify-center"
              style={{ color: accent }}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Próxima promoção"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/85 hover:bg-white shadow flex items-center justify-center"
              style={{ color: accent }}
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}