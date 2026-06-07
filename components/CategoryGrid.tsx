"use client";
import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { CategoryGrid as CategoryGridType } from '@/lib/storeService';

const defaultGrids: CategoryGridType[] = [
  {
    id: 'default-cg1',
    title: 'Revamp your home in style',
    link_text: 'Explore all',
    items: [
      { name: 'Cushion covers', image: 'https://picsum.photos/seed/cushion/200/200' },
      { name: 'Vases', image: 'https://picsum.photos/seed/vase/200/200' },
      { name: 'Home storage', image: 'https://picsum.photos/seed/storage/200/200' },
      { name: 'Lighting solutions', image: 'https://picsum.photos/seed/light/200/200' },
    ]
  },
  {
    id: 'default-cg2',
    title: 'Up to 60% off | Styles for men',
    link_text: 'See all offers',
    items: [
      { name: 'Clothing', image: 'https://picsum.photos/seed/clothing/200/200' },
      { name: 'Footwear', image: 'https://picsum.photos/seed/shoes/200/200' },
      { name: 'Watches', image: 'https://picsum.photos/seed/watch/200/200' },
      { name: 'Bags & wallets', image: 'https://picsum.photos/seed/bag/200/200' },
    ]
  },
  {
    id: 'default-cg3',
    title: 'Appliances for your home | Up to 55% off',
    link_text: 'See more',
    items: [
      { name: 'Air conditioners', image: 'https://picsum.photos/seed/ac/200/200' },
      { name: 'Refrigerators', image: 'https://picsum.photos/seed/fridge/200/200' },
      { name: 'Microwaves', image: 'https://picsum.photos/seed/microwave/200/200' },
      { name: 'Washing machines', image: 'https://picsum.photos/seed/washing/200/200' },
    ]
  },
  {
    id: 'default-cg4',
    title: 'Starting ₹149 | Headphones',
    link_text: 'See all offers',
    items: [
      { name: 'boAt', image: 'https://picsum.photos/seed/boat/200/200' },
      { name: 'boult', image: 'https://picsum.photos/seed/boult/200/200' },
      { name: 'Noise', image: 'https://picsum.photos/seed/noise/200/200' },
      { name: 'Zebronics', image: 'https://picsum.photos/seed/zeb/200/200' },
    ]
  }
];

export default function CategoryGrid({ grids = [], loading = false }: { grids?: CategoryGridType[]; loading?: boolean }) {
  const router = useRouter();
  const displayGrids = grids && grids.length > 0 ? grids : defaultGrids;

  if (loading) {
    return (
      <div className="flex overflow-x-auto gap-4 px-3 md:px-4 relative z-10 -mt-20 sm:-mt-32 md:-mt-48 lg:-mt-60 pb-4 w-full hide-scrollbar">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="bg-white p-4 flex flex-col justify-between h-[360px] animate-pulse z-20 min-w-[290px] sm:min-w-[320px] flex-grow flex-shrink-0 rounded-md shadow-sm">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="grid grid-cols-2 gap-4 w-full flex-grow">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-full aspect-square bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mt-4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex overflow-x-auto gap-4 px-3 md:px-4 relative z-10 -mt-20 sm:-mt-32 md:-mt-48 lg:-mt-60 pb-4 w-full hide-scrollbar snap-x scroll-smooth">
      {displayGrids.map((category) => {
        const itemCount = category.items.length;
        const gridCols = itemCount === 1 ? 'grid-cols-1' : 'grid-cols-2';
        
        return (
          <div 
            key={category.id} 
            className="bg-white p-4 flex flex-col items-center justify-between z-20 shadow-sm rounded-md min-w-[290px] sm:min-w-[320px] md:min-w-[330px] flex-grow flex-shrink-0 snap-start hover:shadow-md transition-shadow duration-300"
          >
            <h2 className="text-lg font-bold w-full mb-4 text-gray-900 line-clamp-1">{category.title}</h2>
            <div className={`grid ${gridCols} gap-3 md:gap-4 w-full flex-grow content-start`}>
              {category.items.map((item, i) => (
                <div 
                  key={i} 
                  onClick={() => {
                    const target = item.link || item.name;
                    if (target.startsWith('/') || target.startsWith('http')) {
                      router.push(target);
                    } else {
                      router.push(`/?category=${encodeURIComponent(target)}`);
                    }
                  }}
                  className="flex flex-col items-center cursor-pointer group w-full"
                >
                  <div className={`relative w-full ${itemCount === 1 ? 'aspect-[1.5/1]' : 'aspect-square'} bg-gray-50 flex items-center justify-center overflow-hidden mb-1.5 rounded-sm`}>
                     <Image 
                       src={item.image} 
                       alt={item.name} 
                       fill
                       sizes="(max-width: 768px) 50vw, 25vw"
                       className="object-cover group-hover:scale-105 transition-transform duration-300" 
                       referrerPolicy={"no-referrer"}
                     />
                  </div>
                  <span className="text-xs text-gray-700 w-full text-left line-clamp-1 group-hover:text-[#5ab946] transition-colors">{item.name}</span>
                </div>
              ))}
            </div>
            <div 
              onClick={() => router.push(`/?category=${encodeURIComponent(category.title)}`)}
              className="w-full mt-4 text-sm text-[#5ab946] hover:text-[#e61923] hover:underline cursor-pointer text-left font-semibold"
            >
              {category.link_text || 'Explore all'}
            </div>
          </div>
        );
      })}
    </div>
  );
}

