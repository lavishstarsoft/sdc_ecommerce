import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Banner } from '@/lib/storeService';

const defaultBanners = [
  "https://picsum.photos/seed/hero1/1500/600",
  "https://picsum.photos/seed/hero2/1500/600",
  "https://picsum.photos/seed/hero3/1500/600",
  "https://picsum.photos/seed/hero4/1500/600",
];

export default function HeroSection({ banners = [], loading = false }: { banners?: Banner[]; loading?: boolean }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const displayBanners = banners && banners.length > 0 
    ? banners 
    : (defaultBanners.map((url, i) => ({ id: `default-${i}`, image_url: url })) as Banner[]);

  const totalSlides = displayBanners.length;

  // Reset timer helper
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (totalSlides <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrentSlide((prev) => prev + 1);
    }, 5000);
  }, [totalSlides]);

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [resetTimer]);

  // When we reach the cloned first slide, snap back to real first slide
  useEffect(() => {
    if (currentSlide === totalSlides) {
      const timeout = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentSlide(0);
      }, 500); // wait for transition to finish
      return () => clearTimeout(timeout);
    } else {
      // Re-enable transition after snap
      if (!isTransitioning) {
        const raf = requestAnimationFrame(() => setIsTransitioning(true));
        return () => cancelAnimationFrame(raf);
      }
    }
  }, [currentSlide, totalSlides, isTransitioning]);

  const nextSlide = () => {
    setCurrentSlide((prev) => prev + 1);
    resetTimer();
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => {
      if (prev === 0) return totalSlides - 1;
      return prev - 1;
    });
    resetTimer();
  };

  if (loading) {
    return (
      <div className="relative w-full aspect-[2/1] md:aspect-[2.5/1] lg:aspect-[2.5/1] max-h-[600px] bg-gray-300 animate-pulse flex items-center justify-center">
        <div className="text-gray-400">Loading Banners...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden bg-[#e3e6e6]">
      {/* Container aspect ratio to look like amazon's long banners */}
      <div 
        className={`relative w-full aspect-[2/1] md:aspect-[2.5/1] lg:aspect-[2.5/1] max-h-[600px] flex ${isTransitioning ? 'transition-transform duration-500 ease-in-out' : ''}`}
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {/* Render all banners + a clone of the first for seamless loop */}
        {[...displayBanners, ...(totalSlides > 1 ? [displayBanners[0]] : [])].map((banner, index) => {
          const content = (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={banner.image_url} 
                alt={banner.title || `Banner ${index + 1}`} 
                className="absolute inset-0 w-full h-full object-cover object-top"
                referrerPolicy="no-referrer"
              />
              {/* Gradient overlay at bottom to blend with background */}
              <div className="absolute inset-x-0 bottom-0 h-1/5 bg-gradient-to-t from-[#e3e6e6] via-[#e3e6e6]/40 to-transparent pointer-events-none"></div>
            </>
          );

          const key = index < totalSlides ? banner.id : `${banner.id}-clone`;

          if (banner.link_url && banner.link_url !== "#" && banner.link_url !== "") {
            return (
              <a 
                key={key}
                href={banner.link_url} 
                className="relative w-full h-full flex-shrink-0 block cursor-pointer"
              >
                {content}
              </a>
            );
          }

          return (
            <div key={key} className="relative w-full h-full flex-shrink-0">
              {content}
            </div>
          );
        })}
      </div>

      {/* Navigation Buttons - Hidden on very small screens */}
      {displayBanners.length > 1 && (
        <>
          <button 
            onClick={prevSlide}
            className="hidden md:flex absolute top-1/4 left-4 z-20 bg-transparent hover:bg-black/10 items-center justify-center h-48 w-12 text-white/80 hover:text-white rounded-md transition-colors duration-200 outline-none focus:outline-none"
            style={{ textShadow: "0 0 10px rgba(0,0,0,0.5)" }}
          >
            <ChevronLeft size={48} />
          </button>
          <button 
            onClick={nextSlide}
            className="hidden md:flex absolute top-1/4 right-4 z-20 bg-transparent hover:bg-black/10 items-center justify-center h-48 w-12 text-white/80 hover:text-white rounded-md transition-colors duration-200 outline-none focus:outline-none"
            style={{ textShadow: "0 0 10px rgba(0,0,0,0.5)" }}
          >
            <ChevronRight size={48} />
          </button>
        </>
      )}
    </div>
  );
}
