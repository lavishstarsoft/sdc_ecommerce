"use client";
import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { Product as ProductType } from '@/lib/storeService';

export default function ProductCarousel({ 
  title, 
  products = [], 
  wishlist = {}, 
  onToggleWishlist 
}: { 
  title: string; 
  products: ProductType[]; 
  wishlist?: Record<string, boolean>; 
  onToggleWishlist?: (e: React.MouseEvent, id: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [localWishlist, setLocalWishlist] = useState<Record<string, boolean>>({});

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  const toggleWishlist = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (onToggleWishlist) {
      onToggleWishlist(e, id);
    } else {
      setLocalWishlist(prev => ({ ...prev, [id]: !prev[id] }));
    }
  };

  return (
    <div className="bg-white m-4 p-5 relative group rounded-2xl border border-gray-200/60 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg md:text-xl font-bold text-gray-900">{title}</h2>
        <span 
          onClick={() => router.push('/')}
          className="text-sm font-bold text-[#5ab946] hover:text-[#e61923] hover:underline cursor-pointer"
        >
          View all
        </span>
      </div>
      
      <div className="relative">
        <button 
          onClick={scrollLeft}
          className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-gray-50 shadow-md border border-gray-200 rounded-full h-10 w-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer duration-200"
        >
          <ChevronLeft size={24} className="text-gray-700" />
        </button>
 
        <div 
          ref={scrollRef}
          className="flex overflow-x-auto gap-4 hide-scrollbar px-1 py-2 scroll-smooth"
        >
          {products.map(product => {
            const mrp = product.mrp && product.mrp > product.price ? product.mrp : Math.round(product.price * 1.25);
            const savings = mrp - product.price;
            const discountPercentage = mrp > product.price ? Math.round((savings / mrp) * 100) : 0;
            const isFavorite = onToggleWishlist ? !!wishlist[product.id] : !!localWishlist[product.id];
            
            return (
              <div 
                key={product.id} 
                onClick={() => router.push(`/products/${product.id}`)}
                className="min-w-[200px] md:min-w-[240px] max-w-[260px] cursor-pointer group flex flex-col justify-between p-4 rounded-xl border border-gray-200/80 bg-white hover:shadow-lg transition-all duration-300 relative flex-shrink-0"
              >
                <button 
                  onClick={(e) => toggleWishlist(e, product.id)}
                  className="absolute top-6 right-6 z-10 p-1.5 rounded-full bg-white/80 hover:bg-white border border-gray-100 shadow-sm text-gray-400 hover:text-red-500 transition-colors duration-200 cursor-pointer"
                >
                  <Heart size={16} fill={isFavorite ? "#e61923" : "none"} className={isFavorite ? "text-[#e61923]" : "text-gray-400"} />
                </button>

                <div>
                  <div className="relative w-full aspect-square bg-[#f3f4f6]/60 rounded-xl flex items-center justify-center p-4 mb-4">
                    <img 
                      src={product.image_url} 
                      alt={product.title} 
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  
                  <div className="text-left mt-2">
                    <h3 className="text-xs md:text-sm font-semibold text-gray-800 line-clamp-2 min-h-[40px] group-hover:text-[#5ab946] transition-colors leading-tight mb-2">
                      {product.title}
                    </h3>
                  </div>
                </div>

                <div className="text-left space-y-1 mt-2">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-sm md:text-base font-extrabold text-gray-900 font-mono">
                      ₹{product.price.toLocaleString("en-IN")}
                    </span>
                    {discountPercentage > 0 && (
                      <span className="text-[10px] md:text-xs font-bold text-[#e61923] bg-[#e61923]/10 px-1.5 py-0.5 rounded-md">
                        {discountPercentage}% OFF
                      </span>
                    )}
                  </div>
                  {discountPercentage > 0 && (
                    <div className="text-[10px] md:text-xs text-gray-400 font-medium">
                      MRP <span className="line-through font-mono">₹{mrp.toLocaleString("en-IN")}</span>
                      <span className="text-green-600 font-bold ml-1">(Save ₹{savings.toLocaleString("en-IN")})</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
 
        <button 
          onClick={scrollRight}
          className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-gray-50 shadow-md border border-gray-200 rounded-full h-10 w-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer duration-200"
        >
          <ChevronRight size={24} className="text-gray-700" />
        </button>
      </div>
 
      <style dangerouslySetInnerHTML={{__html:`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}
