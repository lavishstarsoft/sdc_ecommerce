"use client";
import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import CategoryGrid from "@/components/CategoryGrid";
import ProductCarousel from "@/components/ProductCarousel";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import { Heart, X, Sliders, Star } from "lucide-react";
import {
  getBanners,
  getCategoryGrids,
  getProducts,
  getCarousels,
  getSidebarFilters,
  Banner,
  CategoryGrid as CategoryGridType,
  Product,
  Carousel,
  SidebarFilter
} from "@/lib/storeService";

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category");
  const [wishlist, setWishlist] = useState<Record<string, boolean>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: "" });

  const [banners, setBanners] = useState<Banner[]>([]);
  const [grids, setGrids] = useState<CategoryGridType[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [carousels, setCarousels] = useState<Carousel[]>([]);
  const [sidebarFilters, setSidebarFilters] = useState<SidebarFilter[]>([]);
  const [loading, setLoading] = useState(true);

  const enabledFilters = useMemo(() => {
    return [...sidebarFilters].filter((f) => f.isEnabled).sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  }, [sidebarFilters]);
  
  const showSort = enabledFilters.some((f) => f.filterType === "SORT");

  useEffect(() => {
    if (!toast.show) return;
    const timer = setTimeout(() => setToast({ show: false, message: "" }), 2500);
    return () => clearTimeout(timer);
  }, [toast.show]);

  // Filters & Sorting States
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedWarranties, setSelectedWarranties] = useState<string[]>([]);
  const [sliderMinVal, setSliderMinVal] = useState<number>(0);
  const [sliderMaxVal, setSliderMaxVal] = useState<number>(100000);
  const [activeThumb, setActiveThumb] = useState<"min" | "max">("min");
  const [selectedDeliveries, setSelectedDeliveries] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("featured");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Reset filters on category changes
  useEffect(() => {
    setSelectedBrands([]);
    setSelectedWarranties([]);
    setSelectedDeliveries([]);
    setSortBy("featured");
  }, [activeCategory]);

  useEffect(() => {
    async function loadData() {
      try {
        const [bannersData, gridsData, productsData, carouselsData, sidebarFiltersData] = await Promise.all([
          getBanners(),
          getCategoryGrids(),
          getProducts(),
          getCarousels(),
          getSidebarFilters(),
        ]);
        setBanners(bannersData);
        setGrids(gridsData);
        setProducts(productsData);
        setCarousels(carouselsData);
        setSidebarFilters(sidebarFiltersData);

        // Fetch user auth status to load their specific wishlist
        const meRes = await fetch("/api/auth/me");
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.authenticated && meData.user) {
            setUserId(meData.user.id);
            const saved = localStorage.getItem(`sdc_wishlist_${meData.user.id}`);
            if (saved) {
              setWishlist(JSON.parse(saved));
            }
          }
        }
      } catch (err) {
        console.error("Failed to load storefront data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const addToCart = async (productId: string, productTitle: string) => {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) throw new Error("Auth check failed");
      const data = await res.json();
      if (!data.authenticated || !data.user) {
        setShowAuthModal(true);
        return;
      }

      const cartRes = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1, action: "add" })
      });

      if (cartRes.ok) {
        window.dispatchEvent(new Event("cart-updated"));
        setToast({ show: true, message: `"${productTitle}" added to cart.` });
      } else {
        const errData = await cartRes.json();
        throw new Error(errData.error || "Failed to add to cart");
      }
    } catch (err) {
      console.error("Cart error:", err);
      setShowAuthModal(true);
    }
  };

  const toggleWishlist = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) throw new Error("Auth check failed");
      const data = await res.json();
      if (!data.authenticated || !data.user) {
        setShowAuthModal(true);
        return;
      }

      const activeUserId = data.user.id;
      setUserId(activeUserId);

      // Call API to toggle wishlist in database
      const wlRes = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: id, action: "toggle" })
      });

      if (wlRes.ok) {
        const updatedWishlist = await wlRes.json();
        setWishlist(updatedWishlist);
        localStorage.setItem(`sdc_wishlist_${activeUserId}`, JSON.stringify(updatedWishlist));
        window.dispatchEvent(new Event("wishlist-updated"));
      } else {
        throw new Error("Failed to update wishlist on database");
      }
    } catch (err) {
      console.error("Wishlist sync error:", err);
      setShowAuthModal(true);
    }
  };

  const baseProducts = products.filter((p) => {
    if (!activeCategory) return false;
    const catMatch = p.category?.toLowerCase() === activeCategory.toLowerCase();
    const titleMatch = p.title?.toLowerCase().includes(activeCategory.toLowerCase());
    const descMatch = p.description?.toLowerCase().includes(activeCategory.toLowerCase());
    return catMatch || titleMatch || descMatch;
  });

  // Calculate dynamic filter options based on base matching products
  const availableBrands = Array.from(new Set(baseProducts.map((p) => p.brand).filter(Boolean))) as string[];
  const availableWarranties = Array.from(new Set(baseProducts.map((p) => p.warranty).filter(Boolean))) as string[];

  const basePrices = baseProducts.map((p) => p.price);
  const absoluteMinPrice = basePrices.length > 0 ? Math.min(...basePrices) : 0;
  const absoluteMaxPrice = basePrices.length > 0 ? Math.max(...basePrices) : 100000;

  // Sync range slider defaults when search selection (base products) changes
  useEffect(() => {
    if (baseProducts.length > 0) {
      const prices = baseProducts.map((p) => p.price);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      setSliderMinVal(min);
      setSliderMaxVal(max);
    } else {
      setSliderMinVal(0);
      setSliderMaxVal(100000);
    }
  }, [baseProducts]);

  // Apply filters
  let filteredProducts = baseProducts.filter((p) => {
    if (selectedBrands.length > 0 && (!p.brand || !selectedBrands.includes(p.brand))) {
      return false;
    }
    if (selectedWarranties.length > 0 && (!p.warranty || !selectedWarranties.includes(p.warranty))) {
      return false;
    }
    if (enabledFilters.some(f => f.filterType === "PRICE_RANGE")) {
      if (p.price < sliderMinVal || p.price > sliderMaxVal) {
        return false;
      }
    }
    if (enabledFilters.some(f => f.filterType === "DELIVERY")) {
      const wantsFreeDelivery = selectedDeliveries.some(d => d.toLowerCase().includes("free"));
      if (wantsFreeDelivery && !p.free_delivery) {
        return false;
      }
    }
    return true;
  });

  // Apply sorting (always enabled)
  filteredProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "price-asc") {
      return a.price - b.price;
    } else if (sortBy === "price-desc") {
      return b.price - a.price;
    } else if (sortBy === "newest") {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    }
    return 0;
  });

  const renderFilterContent = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
        <h3 className="font-extrabold text-gray-900 text-xs uppercase tracking-wider">Filters</h3>
        {(selectedBrands.length > 0 || selectedWarranties.length > 0 || selectedDeliveries.length > 0 || sliderMinVal !== absoluteMinPrice || sliderMaxVal !== absoluteMaxPrice) && (
          <button
            type="button"
            onClick={() => {
              setSelectedBrands([]);
              setSelectedWarranties([]);
              setSelectedDeliveries([]);
              setSliderMinVal(absoluteMinPrice);
              setSliderMaxVal(absoluteMaxPrice);
            }}
            className="text-[11px] text-rose-500 hover:text-rose-600 hover:underline font-bold cursor-pointer"
          >
            Clear All
          </button>
        )}
      </div>

      {enabledFilters.map((filter) => {
        if (filter.filterType === "PRICE_RANGE") {
          return (
            <div key={filter.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{filter.label}</h4>
                {(sliderMinVal !== absoluteMinPrice || sliderMaxVal !== absoluteMaxPrice) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSliderMinVal(absoluteMinPrice);
                      setSliderMaxVal(absoluteMaxPrice);
                    }}
                    className="text-[9px] text-[#5ab946] hover:text-[#4ca03a] font-extrabold uppercase hover:underline cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>

              <div className="text-sm font-extrabold text-gray-800 font-mono">
                ₹{sliderMinVal.toLocaleString("en-IN")} — ₹{sliderMaxVal.toLocaleString("en-IN")}
              </div>

              <div className="relative h-6 flex items-center mt-2 px-1">
                <div
                  className="absolute h-1.5 w-full rounded-full"
                  style={{
                    background: `linear-gradient(to right, #e5e7eb ${
                      absoluteMaxPrice - absoluteMinPrice > 0 ? ((sliderMinVal - absoluteMinPrice) / (absoluteMaxPrice - absoluteMinPrice)) * 100 : 0
                    }%, #5ab946 ${
                      absoluteMaxPrice - absoluteMinPrice > 0 ? ((sliderMinVal - absoluteMinPrice) / (absoluteMaxPrice - absoluteMinPrice)) * 100 : 0
                    }%, #5ab946 ${
                      absoluteMaxPrice - absoluteMinPrice > 0 ? ((sliderMaxVal - absoluteMinPrice) / (absoluteMaxPrice - absoluteMinPrice)) * 100 : 100
                    }%, #e5e7eb ${
                      absoluteMaxPrice - absoluteMinPrice > 0 ? ((sliderMaxVal - absoluteMinPrice) / (absoluteMaxPrice - absoluteMinPrice)) * 100 : 100
                    }%)`,
                  }}
                />

                <input
                  type="range"
                  min={absoluteMinPrice}
                  max={absoluteMaxPrice}
                  value={sliderMinVal}
                  onChange={(e) => {
                    const val = Math.min(Number(e.target.value), sliderMaxVal - 1);
                    setSliderMinVal(val);
                    setActiveThumb("min");
                  }}
                  className={`absolute w-full h-1.5 appearance-none bg-transparent pointer-events-none cursor-pointer focus:outline-none ${activeThumb === "min" ? "z-30" : "z-20"}`}
                />
                <input
                  type="range"
                  min={absoluteMinPrice}
                  max={absoluteMaxPrice}
                  value={sliderMaxVal}
                  onChange={(e) => {
                    const val = Math.max(Number(e.target.value), sliderMinVal + 1);
                    setSliderMaxVal(val);
                    setActiveThumb("max");
                  }}
                  className={`absolute w-full h-1.5 appearance-none bg-transparent pointer-events-none cursor-pointer focus:outline-none ${activeThumb === "max" ? "z-30" : "z-20"}`}
                />
              </div>
            </div>
          );
        }

        if (filter.filterType === "BRAND") {
          const configOptions = (filter.config as any)?.options;
          const displayBrands = Array.isArray(configOptions) && configOptions.length > 0 
            ? configOptions 
            : availableBrands;

          return (
            <div key={filter.id} className="space-y-3">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{filter.label}</h4>
              <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto pr-1">
                {displayBrands.map((brandName: string) => {
                  const isChecked = selectedBrands.includes(brandName);
                  return (
                    <label key={brandName} className="flex items-center gap-2.5 text-xs text-gray-700 hover:text-gray-900 cursor-pointer font-semibold">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setSelectedBrands((prev) => prev.filter((b) => b !== brandName));
                          } else {
                            setSelectedBrands((prev) => [...prev, brandName]);
                          }
                        }}
                        className="w-4 h-4 rounded accent-[#5ab946] border-gray-300 focus:ring-[#5ab946] cursor-pointer"
                      />
                      <span>{brandName}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        }

        if (filter.filterType === "WARRANTY") {
          const configOptions = (filter.config as any)?.options;
          const displayWarranties = Array.isArray(configOptions) && configOptions.length > 0 
            ? configOptions 
            : availableWarranties;

          return (
            <div key={filter.id} className="space-y-3">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{filter.label}</h4>
              <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto pr-1">
                {displayWarranties.map((warrantyName: string) => {
                  const isChecked = selectedWarranties.includes(warrantyName);
                  const displayName = warrantyName.length > 25 ? warrantyName.substring(0, 22) + "..." : warrantyName;
                  return (
                    <label key={warrantyName} className="flex items-center gap-2.5 text-xs text-gray-700 hover:text-gray-900 cursor-pointer font-semibold" title={warrantyName}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setSelectedWarranties((prev) => prev.filter((w) => w !== warrantyName));
                          } else {
                            setSelectedWarranties((prev) => [...prev, warrantyName]);
                          }
                        }}
                        className="w-4 h-4 rounded accent-[#5ab946] border-gray-300 focus:ring-[#5ab946] cursor-pointer"
                      />
                      <span>{displayName}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        }

        if (filter.filterType === "DELIVERY") {
          const configOptions = (filter.config as any)?.options;
          const displayDeliveries = Array.isArray(configOptions) && configOptions.length > 0 
            ? configOptions 
            : ["Free Delivery Only"];

          return (
            <div key={filter.id} className="space-y-3">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{filter.label}</h4>
              <div className="flex flex-col gap-2">
                {displayDeliveries.map((deliveryName: string) => {
                  const isChecked = selectedDeliveries.includes(deliveryName);
                  return (
                    <label key={deliveryName} className="flex items-center gap-2.5 text-xs text-gray-700 hover:text-gray-900 cursor-pointer font-semibold">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setSelectedDeliveries((prev) => prev.filter((d) => d !== deliveryName));
                          } else {
                            setSelectedDeliveries((prev) => [...prev, deliveryName]);
                          }
                        }}
                        className="w-4 h-4 rounded accent-[#5ab946] border-gray-300 focus:ring-[#5ab946] cursor-pointer"
                      />
                      <span>{deliveryName}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        }

        if (filter.filterType === "SORT") {
          const configOptions = (filter.config as any)?.options;
          const displaySorts = Array.isArray(configOptions) && configOptions.length > 0 
            ? configOptions 
            : ["Featured", "Price: Low to High", "Price: High to Low", "Newest Arrivals"];

          return (
            <div key={filter.id} className="space-y-3">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{filter.label}</h4>
              <div className="flex flex-col gap-2">
                {displaySorts.map((sortOptionName: string) => {
                  let val = "featured";
                  const lowerName = sortOptionName.toLowerCase();
                  if (lowerName.includes("low to high")) val = "price-asc";
                  else if (lowerName.includes("high to low")) val = "price-desc";
                  else if (lowerName.includes("newest")) val = "newest";
                  else val = "featured";

                  const isChecked = sortBy === val;
                  return (
                    <label key={sortOptionName} className="flex items-center gap-2.5 text-xs text-gray-700 hover:text-gray-900 cursor-pointer font-semibold">
                      <input
                        type="radio"
                        name="sidebar-sort"
                        checked={isChecked}
                        onChange={() => setSortBy(val)}
                        className="w-4 h-4 accent-[#5ab946] border-gray-300 focus:ring-[#5ab946] cursor-pointer"
                      />
                      <span>{sortOptionName}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#e3e6e6] flex flex-col font-sans mb-16 md:mb-0">
      <Navbar />
      <main className="flex-grow w-full pb-4">
        {activeCategory ? (
          /* Filtered Category View */
          <div className="w-full max-w-[1500px] mx-auto pb-8">
            <div className="bg-white m-4 p-4 md:p-6 rounded-3xl shadow-sm border border-gray-200/50">
              {/* Header section */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-4 mb-6">
                <div>
                  <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
                    Category: <span className="text-[#5ab946]">{activeCategory}</span>
                  </h1>
                  <p className="text-gray-500 text-xs md:text-sm font-semibold mt-1">
                    Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
                  </p>
                </div>
                <button
                  onClick={() => router.push('/')}
                  className="hidden sm:flex mt-3 sm:mt-0 px-5 py-2.5 border border-gray-250 hover:border-[#5ab946] hover:text-[#5ab946] rounded-xl text-xs font-bold transition-all active:scale-95 items-center justify-center gap-1.5 cursor-pointer bg-white text-gray-750"
                >
                  ← Back to Home
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#5ab946]"></div>
                </div>
              ) : (
                /* Split Sidebar filter layout */
                <div className="flex flex-col lg:flex-row gap-8">
                  {/* Left Sidebar Filters - Desktop */}
                  <aside className="hidden lg:block w-[260px] flex-shrink-0 bg-gray-50/50 p-5 rounded-2xl border border-gray-200/60 self-start">
                    {renderFilterContent()}
                  </aside>

                  {/* Right Column - Product display */}
                  <div className="flex-grow">
                    {/* Mobile Controls bar */}
                    <div className="flex lg:hidden flex-col gap-3 mb-5 w-full">
                      {/* Buttons Row */}
                      <div className="flex items-center gap-3 w-full">
                        <button
                          onClick={() => router.push('/')}
                          className="flex items-center justify-center gap-1.5 border border-gray-250 px-4 py-2.5 rounded-xl bg-white text-xs font-bold text-gray-700 hover:border-[#5ab946] hover:text-[#5ab946] active:scale-95 transition-all cursor-pointer flex-1"
                        >
                          ← Back to Home
                        </button>

                        <button
                          onClick={() => setMobileFiltersOpen(true)}
                          className="flex items-center justify-center gap-2 border border-gray-250 px-4 py-2.5 rounded-xl bg-white text-xs font-bold text-gray-700 hover:border-[#5ab946] hover:text-[#5ab946] active:scale-95 transition-all cursor-pointer flex-1"
                        >
                          <Sliders size={14} className="text-[#5ab946]" /> Filters
                        </button>
                      </div>

                      {/* Sort Dropdown Row */}
                      {showSort ? (
                        <div className="flex items-center justify-between gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-200/60 w-full">
                          <span className="text-gray-450 text-[10px] font-black uppercase tracking-wider pl-1">Sort By:</span>
                          <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="border border-gray-250 px-3 py-2 rounded-xl bg-white text-xs font-bold text-gray-700 outline-none cursor-pointer focus:border-[#5ab946] transition-colors"
                          >
                            <option value="featured">Featured</option>
                            <option value="price-asc">Price: Low to High</option>
                            <option value="price-desc">Price: High to Low</option>
                            <option value="newest">Newest Arrivals</option>
                          </select>
                        </div>
                      ) : null}
                    </div>

                    {/* Desktop Controls bar */}
                    <div className="hidden lg:flex items-center justify-between border-b border-gray-100 pb-3 mb-5">
                      <span className="text-gray-450 text-xs font-semibold">
                        Showing 1–{filteredProducts.length} of {filteredProducts.length} results
                      </span>
                      {showSort ? (
                        <div className="flex items-center gap-2.5">
                          <span className="text-gray-450 text-[10px] font-black uppercase tracking-wider">Sort By:</span>
                          <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="border border-gray-200 hover:border-gray-300 focus:border-[#5ab946] px-3 py-2 rounded-xl bg-white text-xs font-bold text-gray-700 outline-none transition-colors cursor-pointer"
                          >
                            <option value="featured">Featured</option>
                            <option value="price-asc">Price: Low to High</option>
                            <option value="price-desc">Price: High to Low</option>
                            <option value="newest">Newest Arrivals</option>
                          </select>
                        </div>
                      ) : null}
                    </div>

                    {/* List Layout (Amazon Style) */}
                    {filteredProducts.length === 0 ? (
                      <div className="text-center py-24 text-gray-400 font-bold bg-gray-50/20 border border-dashed border-gray-200 rounded-2xl">
                        No products found matching your selected filters.
                      </div>
                    ) : (
                      <div className="space-y-4 w-full">
                        {filteredProducts.map((product) => {
                          const mrp = product.mrp && product.mrp > product.price ? product.mrp : Math.round(product.price * 1.25);
                          const savings = mrp - product.price;
                          const discountPercentage = mrp > product.price ? Math.round((savings / mrp) * 100) : 0;
                          const isFavorite = !!wishlist[product.id];

                          const titleLen = product.title?.length || 10;
                          const rating = ((titleLen % 5) * 0.2 + 4.0).toFixed(1);
                          const starsCount = Math.round(parseFloat(rating));
                          const reviewCount = ((product.title?.charCodeAt(0) || 65) * 7) % 450 + 10;
                          const boughtCount = (((product.title?.charCodeAt(1) || 66) * 3) % 8 + 1) * 100;

                          const tomorrow = new Date();
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          const deliveryDay = tomorrow.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

                          return (
                            <div
                              key={product.id}
                              onClick={() => router.push(`/products/${product.id}`)}
                              className="flex flex-row gap-3 sm:gap-5 p-3 sm:p-5 bg-white hover:bg-gray-50/40 border border-gray-200/70 rounded-2xl sm:rounded-3xl hover:shadow-md hover:border-gray-250 transition-all group cursor-pointer relative w-full"
                            >
                              {/* Image Section */}
                              <div className="relative w-[100px] h-[100px] sm:w-[190px] sm:h-[170px] bg-gray-50/60 rounded-xl sm:rounded-2xl flex items-center justify-center p-2 sm:p-4 flex-shrink-0">
                                <img
                                  src={product.image_url}
                                  alt={product.title}
                                  className="max-h-full max-w-full object-contain group-hover:scale-102 transition-transform duration-300"
                                />
                                {product.price > 60000 && (
                                  <span className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-[#e47911] text-white text-[7px] sm:text-[8px] font-black uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-sm shadow-sm">
                                    Best seller
                                  </span>
                                )}
                              </div>

                              {/* Details Section */}
                              <div className="flex-grow flex flex-col justify-between sm:justify-start sm:space-y-1.5 min-w-0">
                                <div className="space-y-1">
                                  {product.price > 40000 && product.price <= 60000 && (
                                    <div className="text-[8px] sm:text-[10px] text-gray-400 font-black uppercase tracking-wider">
                                      Sponsored
                                    </div>
                                  )}

                                  <h3 className="text-xs sm:text-base font-extrabold text-gray-800 line-clamp-2 sm:line-clamp-3 leading-snug group-hover:text-[#5ab946] transition-colors pr-6 sm:pr-8">
                                    {product.title}
                                  </h3>

                                  {product.description && (
                                    <p className="hidden sm:block text-xs text-gray-500 line-clamp-2 leading-relaxed pt-0.5 font-medium">
                                      {product.description}
                                    </p>
                                  )}

                                  <div className="space-y-0.5 pt-0.5">
                                    <div className="flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
                                      <span className="text-sm sm:text-lg font-black text-gray-900 font-mono">
                                        ₹{product.price.toLocaleString("en-IN")}
                                      </span>
                                      {discountPercentage > 0 && (
                                        <>
                                          <span className="text-[9px] sm:text-xs font-bold text-[#e61923] bg-[#e61923]/10 px-1.5 sm:px-2 py-0.5 rounded-md">
                                            {discountPercentage}% OFF
                                          </span>
                                          <span className="text-[9px] sm:text-xs text-gray-400 line-through font-mono">
                                            ₹{mrp.toLocaleString("en-IN")}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                    {product.price > 50000 && (
                                      <div className="hidden sm:block text-[10px] text-gray-500 font-bold">
                                        Save extra with No Cost EMI
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 pt-1 sm:pt-0.5" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => addToCart(product.id, product.title)}
                                    className="bg-[#5ab946] hover:bg-[#4ca03a] text-white rounded-full py-1 sm:py-1.5 px-4 sm:px-6 text-[10px] sm:text-xs font-black shadow-sm active:scale-95 transition-all cursor-pointer hover:shadow-md"
                                  >
                                    Add to cart
                                  </button>
                                </div>
                              </div>

                              {/* Wishlist Button */}
                              <button
                                onClick={(e) => toggleWishlist(e, product.id)}
                                className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 z-10 p-1.5 rounded-full bg-white/90 hover:bg-white border border-gray-150 shadow-sm text-gray-400 hover:text-red-500 transition-all active:scale-90 cursor-pointer flex"
                              >
                                <Heart size={14} fill={isFavorite ? "#e61923" : "none"} className={isFavorite ? "text-[#e61923]" : "text-gray-400"} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile slide-out drawer overlay for filters */}
            {mobileFiltersOpen && (
              <div className="fixed inset-0 z-[9999] lg:hidden flex justify-end">
                <div
                  onClick={() => setMobileFiltersOpen(false)}
                  className="absolute inset-0 bg-black/50 backdrop-blur-xs animate-fade-in"
                />
                <div className="relative w-full max-w-[300px] bg-white h-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between animate-slide-left">
                  <style
                    dangerouslySetInnerHTML={{
                      __html: `
                    @keyframes fadeIn {
                      from { opacity: 0; }
                      to { opacity: 1; }
                    }
                    @keyframes slideLeft {
                      from { transform: translateX(100%); }
                      to { transform: translateX(0); }
                    }
                    .animate-fade-in {
                      animation: fadeIn 0.18s ease-out forwards;
                    }
                    .animate-slide-left {
                      animation: slideLeft 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    }
                  `,
                    }}
                  />

                  <div>
                    <div className="flex items-center justify-between pb-4 border-b border-gray-150 mb-4">
                      <span className="font-bold text-gray-900">Filter Products</span>
                      <button onClick={() => setMobileFiltersOpen(false)} className="text-gray-450 hover:text-gray-700 cursor-pointer p-1">
                        <X size={18} />
                      </button>
                    </div>
                    {renderFilterContent()}
                  </div>

                  <div className="pt-4 border-t border-gray-150 mt-6 flex gap-3">
                    <button
                      onClick={() => {
                        setSelectedBrands([]);
                        setSelectedWarranties([]);
                        setSelectedDeliveries([]);
                        setSliderMinVal(absoluteMinPrice);
                        setSliderMaxVal(absoluteMaxPrice);
                        setMobileFiltersOpen(false);
                      }}
                      className="flex-1 py-3 border border-gray-300 hover:border-gray-400 text-gray-700 font-bold rounded-xl text-xs text-center cursor-pointer bg-white"
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => setMobileFiltersOpen(false)}
                      className="flex-1 py-3 bg-[#5ab946] hover:bg-[#4ca03a] text-white font-bold rounded-xl text-xs text-center shadow-lg shadow-green-500/10 cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Default Homepage View */
          <>
            <HeroSection banners={banners} loading={loading} />

            <div className="w-full max-w-[1500px] mx-auto">
              <CategoryGrid grids={grids} loading={loading} />

              {loading ? (
                <div className="flex items-center justify-center py-20 bg-white m-4 p-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#5ab946]"></div>
                </div>
              ) : (
                carousels.map((carousel) => {
                  let sectionProducts: Product[] = [];

                  if (carousel.source_type === "BEST_SELLERS") {
                    sectionProducts = products.slice(0, 6);
                  } else if (carousel.source_type === "OFFERS") {
                    sectionProducts = products.filter((p) => p.price < 40000).slice(0, 6);
                  } else if (carousel.source_type === "CATEGORY" && carousel.source_value) {
                    sectionProducts = products.filter((p) => p.category.toLowerCase() === carousel.source_value?.toLowerCase());
                  } else {
                    sectionProducts = products.filter((p) => carousel.product_ids?.includes(p.id));
                  }

                  if (sectionProducts.length === 0) return null;

                  if (carousel.layout === "GRID") {
                    return (
                      <div key={carousel.id} className="bg-white m-4 p-5 rounded-2xl border border-gray-200/60 shadow-sm">
                        <div className="flex items-center justify-between mb-5">
                          <h2 className="text-lg md:text-xl font-bold text-gray-900">{carousel.title}</h2>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 justify-items-center">
                          {sectionProducts.map((product) => {
                            const mrp = product.mrp && product.mrp > product.price ? product.mrp : Math.round(product.price * 1.25);
                            const savings = mrp - product.price;
                            const discountPercentage = mrp > product.price ? Math.round((savings / mrp) * 100) : 0;
                            const isFavorite = !!wishlist[product.id];
                            return (
                              <div
                                key={product.id}
                                onClick={() => router.push(`/products/${product.id}`)}
                                className="w-full max-w-[260px] border border-gray-200/80 rounded-xl p-4 hover:shadow-lg transition-all flex flex-col justify-between bg-white group cursor-pointer relative"
                              >
                                <button
                                  onClick={(e) => toggleWishlist(e, product.id)}
                                  className="absolute top-6 right-6 z-10 p-1.5 rounded-full bg-white/80 hover:bg-white border border-gray-100 shadow-sm text-gray-400 hover:text-red-500 transition-colors duration-200 cursor-pointer"
                                >
                                  <Heart size={16} fill={isFavorite ? "#e61923" : "none"} className={isFavorite ? "text-[#e61923]" : "text-gray-400"} />
                                </button>
                                <div>
                                  <div className="relative w-full aspect-square bg-[#f3f4f6]/60 rounded-xl flex items-center justify-center p-4 mb-4">
                                    <img src={product.image_url} alt={product.title} className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300" />
                                  </div>
                                  <h3 className="text-xs md:text-sm font-semibold text-gray-800 line-clamp-2 min-h-[40px] group-hover:text-[#5ab946] transition-colors leading-tight mb-2">{product.title}</h3>
                                </div>
                                <div className="text-left space-y-1 mt-2">
                                  <div className="flex items-baseline gap-2 flex-wrap">
                                    <span className="text-sm md:text-base font-extrabold text-gray-900 font-mono">₹{product.price.toLocaleString("en-IN")}</span>
                                    {discountPercentage > 0 && (
                                      <span className="text-[10px] md:text-xs font-bold text-[#e61923] bg-[#e61923]/10 px-1.5 py-0.5 rounded-md">{discountPercentage}% OFF</span>
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
                      </div>
                    );
                  }

                  return (
                    <ProductCarousel
                      key={carousel.id}
                      title={carousel.title}
                      products={sectionProducts}
                      wishlist={wishlist}
                      onToggleWishlist={toggleWishlist}
                    />
                  );
                })
              )}
            </div>
          </>
        )}
      </main>
      <Footer />
      <BottomNav />

      {toast.show && (
        <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-[120] bg-gray-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-gray-800 text-xs font-semibold">
          {toast.message}
        </div>
      )}

      {showAuthModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in px-4">
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes scaleIn {
              from { transform: scale(0.96); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
            .animate-fade-in {
              animation: fadeIn 0.18s ease-out forwards;
            }
            .animate-scale-in {
              animation: scaleIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
          `}} />
          <div className="bg-white rounded-[2rem] p-8 shadow-2xl max-w-sm w-full border border-gray-100 flex flex-col items-center text-center space-y-5 animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
              <Heart size={26} className="animate-pulse" fill="currentColor" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-gray-900 leading-tight">Sign In Required</h3>
              <p className="text-xs text-gray-550 font-medium leading-relaxed px-2">
                Please sign in to add items to your wishlist and save them for later.
              </p>
            </div>

            <div className="flex w-full gap-3 pt-2">
              <button
                onClick={() => setShowAuthModal(false)}
                className="flex-1 py-3 border border-gray-200 hover:border-gray-300 rounded-xl text-xs font-bold text-gray-650 hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowAuthModal(false);
                  router.push("/login");
                }}
                className="flex-1 py-3 bg-gradient-to-r from-[#5ab946] to-[#49a836] hover:from-[#4ba03a] hover:to-[#3e892e] text-white text-xs font-bold shadow-md shadow-green-500/10 active:scale-95 transition-all cursor-pointer rounded-xl"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#e3e6e6] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#5ab946]"></div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
