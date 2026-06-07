"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import ProductCarousel from "@/components/ProductCarousel";
import { Product } from "@/lib/storeService";
import { 
  ShoppingCart, 
  Star, 
  ShieldCheck, 
  Truck, 
  RefreshCw, 
  Award, 
  Heart, 
  Share2, 
  MapPin, 
  Tag, 
  ChevronRight,
  ChevronLeft,
  X,
  Info,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  Minus
} from "lucide-react";

function ProductDetailsContent() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [wishlist, setWishlist] = useState<Record<string, boolean>>({});
  const [userId, setUserId] = useState<string | null>(null);
  
  // Delivery estimator state
  const [pincode, setPincode] = useState("");
  const [deliveryStatus, setDeliveryStatus] = useState<{
    estimatedDate?: string;
    success?: boolean;
    message?: string;
  } | null>(null);

  // Lightbox overlay state
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImageIndex, setLightboxImageIndex] = useState(0);

  // Auth redirect modal state
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "info";
  }>({ show: false, message: "", type: "success" });

  const showToast = (message: string, type: "success" | "info" = "success") => {
    setToast({ show: true, message, type });
  };

  useEffect(() => {
    if (!toast.show) return;
    const timer = setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast.show]);

  // Gallery images array defined at top level for hook safety
  const galleryImages = product ? (
    product.gallery_images && product.gallery_images.length > 0
      ? [product.image_url, ...product.gallery_images]
      : [
          product.image_url,
          product.image_url_2,
          product.image_url_3
        ].filter(Boolean)
  ) : [];

  // Load product details, related products, and auth state
  useEffect(() => {
    if (!id) return;
    async function loadProductDetails() {
      setLoading(true);
      try {
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) throw new Error("Failed to fetch product");
        const data = await res.json();
        setProduct(data);

        // Fetch related products in same category
        const allRes = await fetch("/api/products");
        if (allRes.ok) {
          const allData: Product[] = await allRes.json();
          const related = allData.filter(p => p.category === data.category && p.id !== data.id);
          setRelatedProducts(related);
        }

        // Fetch user auth status to load wishlist
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
        console.error("Failed to load product details:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProductDetails();
  }, [id]);

  // Lightbox keyboard navigation
  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsLightboxOpen(false);
      } else if (e.key === "ArrowLeft") {
        setLightboxImageIndex(prev => (prev === 0 ? galleryImages.length - 1 : prev - 1));
      } else if (e.key === "ArrowRight") {
        setLightboxImageIndex(prev => (prev === galleryImages.length - 1 ? 0 : prev + 1));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, galleryImages.length]);

  // Wishlist handler
  const handleToggleWishlist = async () => {
    if (!product) return;
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
      
      const productId = product.id;

      // Call API to toggle wishlist in database
      const wlRes = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, action: "toggle" })
      });

      if (wlRes.ok) {
        const updatedWishlist = await wlRes.json();
        const newStatus = !!updatedWishlist[productId];
        setWishlist(updatedWishlist);
        localStorage.setItem(`sdc_wishlist_${activeUserId}`, JSON.stringify(updatedWishlist));
        window.dispatchEvent(new Event("wishlist-updated"));

        showToast(
          newStatus 
            ? `Saved "${product.title}" to your wishlist.` 
            : `Removed "${product.title}" from your wishlist.`,
          newStatus ? "success" : "info"
        );
      } else {
        throw new Error("Failed to update wishlist on database");
      }
    } catch (err) {
      console.error(err);
      setShowAuthModal(true);
    }
  };

  // Handle add to cart with real API
  const handleAddToCart = async () => {
    if (!product) return;
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
        body: JSON.stringify({ productId: product.id, quantity, action: "add" })
      });

      if (cartRes.ok) {
        window.dispatchEvent(new Event("cart-updated"));
        showToast(`Added ${quantity} ${quantity === 1 ? "item" : "items"} of "${product.title}" to your cart.`, "success");
      } else {
        const errData = await cartRes.json();
        throw new Error(errData.error || "Failed to add to cart");
      }
    } catch (err) {
      console.error(err);
      setShowAuthModal(true);
    }
  };

  // Handle buy now with real API
  const handleBuyNow = async () => {
    if (!product) return;
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
        body: JSON.stringify({ productId: product.id, quantity, action: "add" })
      });

      if (cartRes.ok) {
        window.dispatchEvent(new Event("cart-updated"));
        router.push("/checkout");
      } else {
        const errData = await cartRes.json();
        throw new Error(errData.error || "Failed to add to cart");
      }
    } catch (err) {
      console.error(err);
      setShowAuthModal(true);
    }
  };

  // Mock delivery check
  const handleCheckDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    if (!pincode.trim() || pincode.length < 6) {
      setDeliveryStatus({
        success: false,
        message: "Please enter a valid 6-digit Pincode."
      });
      return;
    }
    
    // Simulate lookup
    const days = Math.floor(Math.random() * 3) + 2; // 2 to 4 days
    const date = new Date();
    date.setDate(date.getDate() + days);
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'short', day: 'numeric' };
    const dateStr = date.toLocaleDateString('en-IN', options);
    
    setDeliveryStatus({
      success: true,
      estimatedDate: dateStr,
      message: product.free_delivery
        ? `Delivery by ${dateStr} | Free Delivery available.`
        : product.delivery_slabs?.length
        ? `Delivery by ${dateStr} | Quantity-based delivery charges apply.`
        : `Delivery by ${dateStr} | Delivery charge ₹${(product.delivery_charge || 0).toLocaleString("en-IN")} applies.`
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#e3e6e6] flex flex-col font-sans mb-16 md:mb-0">
        <Navbar />
        <main className="flex-grow flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-[#5ab946]" size={36} />
            <p className="text-gray-600 font-medium text-sm">Loading product details...</p>
          </div>
        </main>
        <Footer />
        <BottomNav />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#e3e6e6] flex flex-col font-sans mb-16 md:mb-0">
        <Navbar />
        <main className="flex-grow flex flex-col items-center justify-center py-20 bg-white m-4 rounded-2xl border border-gray-200">
          <AlertCircle size={48} className="text-[#e61923] mb-4" />
          <h2 className="text-xl font-bold text-gray-800">Product Not Found</h2>
          <p className="text-gray-500 text-sm mt-1">The product may have been discontinued or removed.</p>
          <button 
            onClick={() => router.push("/")}
            className="mt-6 bg-[#5ab946] hover:bg-[#4ca03a] text-white px-6 py-3 rounded-xl font-semibold shadow-md cursor-pointer transition-all"
          >
            Go Back Home
          </button>
        </main>
        <Footer />
        <BottomNav />
      </div>
    );
  }

  const mrpPrice = product.mrp && product.mrp > product.price ? product.mrp : Math.round(product.price * 1.25);
  const savings = mrpPrice - product.price;
  const discountPercentage = mrpPrice > product.price ? Math.round(((mrpPrice - product.price) / mrpPrice) * 100) : 0;
  const isWishlisted = !!wishlist[product.id];
  
  // Determine layout and content for Key Features
  let keyFeaturesRows: { label: string; value: string }[] = [];
  let isTableLayout = true;
  
  if (product.specs_layout === "PARAGRAPH") {
    isTableLayout = false;
  } else {
    // TABLE layout
    if (product.specs_content) {
      try {
        const parsed = JSON.parse(product.specs_content);
        if (Array.isArray(parsed)) {
          keyFeaturesRows = parsed;
        }
      } catch (e) {
        console.error("Failed to parse specs_content as JSON:", e);
      }
    }
    
    // Backwards compatibility fallback if no custom rows are set
    if (keyFeaturesRows.length === 0) {
      keyFeaturesRows = [
        { label: "Brand", value: product.brand || "Saidurga Premium" },
        { label: "Category", value: product.category },
        { label: "Warranty Details", value: product.warranty || "1 Year SDC Store warranty card" },
        { label: "Item Dimensions", value: product.dimensions || "45 x 30 x 12 cm" },
        { label: "Package Weight", value: product.weight || "1.8 Kilograms" },
      ];
    }
  }

  // Dynamic offers parsing
  let offersList: { title: string; description: string }[] = [];
  if (product.offers) {
    try {
      offersList = typeof product.offers === 'string' ? JSON.parse(product.offers) : product.offers;
    } catch (e) {
      console.error("Failed to parse offers:", e);
    }
  }

  // Active badges helper
  const activeBadges: { icon: React.ReactNode; text: string }[] = [];
  if (product.free_delivery) {
    activeBadges.push({
      icon: <Truck size={18} className="text-[#5ab946] mb-1" />,
      text: "Free Delivery"
    });
  } else {
    activeBadges.push({
      icon: <Truck size={18} className="text-[#5ab946] mb-1" />,
      text: product.delivery_slabs?.length ? "Qty-based delivery" : `Delivery ₹${(product.delivery_charge || 0).toLocaleString("en-IN")}`
    });
  }
  if (product.return_policy) {
    activeBadges.push({
      icon: <RefreshCw size={18} className="text-[#5ab946] mb-1" />,
      text: product.return_policy
    });
  }
  if (product.warranty) {
    activeBadges.push({
      icon: <ShieldCheck size={18} className="text-[#5ab946] mb-1" />,
      text: product.warranty
    });
  }

  // Generated mock images to present an advanced image switcher gallery

  return (
    <div className="min-h-screen bg-[#e3e6e6] flex flex-col font-sans mb-16 md:mb-0">
      <Navbar />
      
      <main className="flex-grow w-full max-w-[1500px] mx-auto p-4 pb-12">
        {/* Breadcrumb strip */}
        <div className="text-xs text-gray-650 mb-4 px-1 flex items-center gap-1.5 flex-wrap">
          <span className="hover:text-[#5ab946] hover:underline cursor-pointer" onClick={() => router.push("/")}>Home</span>
          <ChevronRight size={12} className="text-gray-400" />
          <span className="hover:text-[#5ab946] hover:underline cursor-pointer" onClick={() => router.push(`/?category=${encodeURIComponent(product.category)}`)}>{product.category}</span>
          <ChevronRight size={12} className="text-gray-400" />
          <span className="text-gray-900 font-bold truncate max-w-[240px]">{product.title}</span>
        </div>

        {/* Main Grid: Gallery, Specs & Checkout Card */}
        <div className="bg-white rounded-3xl shadow-sm p-4 md:p-8 border border-gray-200/60 grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* 1. Left Gallery Column (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col md:flex-row gap-4 md:items-start">
            
            {/* Thumbnails Sidebar */}
            <div className="flex md:flex-col gap-2.5 order-2 md:order-1 justify-start">
              {galleryImages.map((img, idx) => (
                <div 
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-14 h-14 md:w-16 md:h-16 border rounded-xl cursor-pointer p-1 bg-white flex items-center justify-center overflow-hidden transition-all
                    ${activeImageIndex === idx ? 'border-[#5ab946] ring-2 ring-[#5ab946]/20' : 'border-gray-200 hover:border-gray-450'}
                  `}
                >
                  <img src={img} alt="" className="max-h-full max-w-full object-contain" />
                </div>
              ))}
            </div>

            {/* Main Interactive Display Image Box */}
            <div 
              onClick={() => {
                setLightboxImageIndex(activeImageIndex);
                setIsLightboxOpen(true);
              }}
              className="flex-grow order-1 md:order-2 relative aspect-square bg-[#f8f9fa] border border-gray-100 rounded-2xl flex items-center justify-center p-6 group cursor-zoom-in hover:border-gray-300/80 transition-all duration-300"
              title="Click to zoom image"
            >
              <img 
                src={galleryImages[activeImageIndex]} 
                alt={product.title} 
                className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
              />
              
              {/* Float Actions */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleWishlist();
                  }}
                  className={`p-3 rounded-full border shadow-sm transition-all duration-200 cursor-pointer
                    ${isWishlisted 
                      ? 'bg-red-50 text-red-500 border-red-200 hover:bg-red-100' 
                      : 'bg-white text-gray-400 border-gray-100 hover:text-red-500 hover:bg-gray-50'
                    }
                  `}
                  title="Add to Wishlist"
                >
                  <Heart size={18} fill={isWishlisted ? "currentColor" : "none"} />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(window.location.href);
                    showToast("Product link copied to clipboard!", "success");
                  }}
                  className="p-3 rounded-full bg-white text-gray-400 border border-gray-100 shadow-sm hover:text-[#5ab946] hover:bg-gray-50 transition-all duration-200 cursor-pointer"
                  title="Share Product"
                >
                  <Share2 size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* 2. Middle Specification Column (4 Cols) */}
          <div className="lg:col-span-4 flex flex-col space-y-5">
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-[#5ab946] bg-[#5ab946]/10 px-3 py-1 rounded-full">
                {product.category}
              </span>
              <h1 className="text-xl md:text-2xl font-black text-gray-900 leading-snug mt-3">
                {product.title}
              </h1>
            </div>

            {/* Pricing Section */}
            <div className="bg-[#5ab946]/5 rounded-2xl p-4 border border-[#5ab946]/15 space-y-1.5">
              <div className="flex items-baseline gap-2.5 flex-wrap">
                <span className="text-3xl font-black text-gray-900 font-mono">
                  ₹{product.price.toLocaleString("en-IN")}
                </span>
                {discountPercentage > 0 && (
                  <span className="text-sm font-bold text-[#e61923] bg-[#e61923]/10 px-2 py-0.5 rounded-md">
                    {discountPercentage}% OFF
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 font-medium">
                MRP <span className="line-through font-mono">₹{mrpPrice.toLocaleString("en-IN")}</span> 
                <span className="text-green-600 ml-1.5">(Save ₹{savings.toLocaleString("en-IN")})</span>
              </div>
              <p className="text-[10px] text-gray-400 font-bold italic">Inclusive of all local taxes</p>
            </div>

            {/* Offers Carousel / Promotion block */}
            {Array.isArray(offersList) && offersList.length > 0 && (
              <div className="space-y-2.5">
                <h3 className="text-xs font-black uppercase text-gray-500 tracking-wider">Available Offers</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {offersList.map((offer, idx) => (
                    <div key={idx} className="border border-dashed border-green-300 rounded-xl p-3 bg-green-50/20 text-left space-y-1">
                      <div className="flex items-center gap-1 text-[#5ab946]">
                        <Tag size={14} />
                        <span className="text-xs font-bold">{offer.title}</span>
                      </div>
                      <p className="text-[10px] text-gray-600 leading-tight">{offer.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <hr className="border-gray-100" />

            {/* Bullet Points */}
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase text-gray-500 tracking-wider">Key Description</h3>
              <p className="text-xs md:text-sm text-gray-700 leading-relaxed">
                {product.description || "Premium quality product from Saidurga Computers. Highly recommended for heavy workflows, technical applications, and regular enterprise computing tasks. Built with reliable standards for long life and durability."}
              </p>
            </div>

            {/* Icons Strip */}
            {activeBadges.length > 0 && (
              <div className={`grid grid-cols-${activeBadges.length} gap-1 bg-[#f8f9fa] rounded-2xl p-2 border border-gray-100 text-center`}>
                {activeBadges.map((badge, idx) => (
                  <div key={idx} className="flex flex-col items-center p-1.5">
                    {badge.icon}
                    <span className="text-[8px] font-black text-gray-700 uppercase">
                      {badge.text.length > 20 ? badge.text.substring(0, 18) + '...' : badge.text}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Right Purchase & Checkout Column (3 Cols) */}
          <div className="lg:col-span-3">
            <div className="bg-white border border-gray-200/80 rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300 space-y-6 sticky top-6">
              
              {/* Pincode Estimator Checker */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Delivery Availability</label>
                  {pincode.length === 6 && (
                    <span className="text-[9px] text-green-600 font-bold">Valid format</span>
                  )}
                </div>
                <form onSubmit={handleCheckDelivery} className="flex gap-2">
                  <div className="relative flex-1 group">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#5ab946] transition-colors" size={14} />
                    <input 
                      type="text" 
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 6-digit Pincode"
                      className="w-full pl-8.5 pr-2.5 py-2.5 bg-gray-50 border border-gray-200 focus:border-[#5ab946] focus:bg-white rounded-xl text-xs outline-none transition-all focus:ring-4 focus:ring-[#5ab946]/10 font-medium text-gray-800 placeholder-gray-400"
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="bg-gray-900 hover:bg-black text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all hover:scale-[1.02] active:scale-95 cursor-pointer shadow-sm"
                  >
                    Check
                  </button>
                </form>

                {deliveryStatus && (
                  <div className={`p-3 rounded-xl flex items-start gap-2 text-[10px] leading-snug border transition-all duration-300
                    ${deliveryStatus.success 
                      ? 'bg-emerald-50/50 text-emerald-800 border-emerald-100' 
                      : 'bg-rose-50/50 text-rose-800 border-rose-100'
                    }
                  `}>
                    {deliveryStatus.success 
                      ? <CheckCircle2 size={13} className="mt-0.5 flex-shrink-0 text-emerald-600" /> 
                      : <Info size={13} className="mt-0.5 flex-shrink-0 text-rose-600" />
                    }
                    <span>{deliveryStatus.message}</span>
                  </div>
                )}
              </div>

              {/* Custom Quantity Counter Selection */}
              <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Quantity</span>
                  <p className="text-[9px] text-gray-400">Limit 10 per customer</p>
                </div>
                <div className="flex items-center bg-gray-50 border border-gray-200/80 rounded-xl p-1">
                  <button 
                    type="button"
                    onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                    disabled={quantity <= 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200/50 text-gray-600 hover:text-black hover:bg-gray-50 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <Minus size={10} strokeWidth={3} />
                  </button>
                  <span className="w-10 text-center font-bold font-mono text-xs text-gray-800">{quantity}</span>
                  <button 
                    type="button"
                    onClick={() => quantity < 10 && setQuantity(quantity + 1)}
                    disabled={quantity >= 10}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200/50 text-gray-600 hover:text-black hover:bg-gray-50 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <Plus size={10} strokeWidth={3} />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-1">
                <button 
                  onClick={handleAddToCart}
                  className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#5ab946] to-[#49a836] hover:from-[#4ba03a] hover:to-[#3e892e] text-white py-3.5 rounded-xl font-bold transition-all shadow-[0_4px_14px_rgba(90,185,70,0.25)] hover:shadow-[0_6px_20px_rgba(90,185,70,0.35)] active:scale-[0.98] cursor-pointer text-xs uppercase tracking-wider"
                >
                  <ShoppingCart size={15} />
                  Add to Cart
                </button>
                <button 
                  onClick={handleBuyNow}
                  className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#f2333b] to-[#c70c14] hover:from-[#c70c14] hover:to-[#a3060c] text-white py-3.5 rounded-xl font-bold transition-all shadow-[0_4px_14px_rgba(199,12,20,0.2)] hover:shadow-[0_6px_20px_rgba(199,12,20,0.3)] active:scale-[0.98] cursor-pointer text-xs uppercase tracking-wider"
                >
                  Buy Now
                </button>
              </div>

              {/* Trust Badge Footer */}
              <div className="flex items-start gap-2.5 bg-[#5ab946]/5 rounded-xl p-3.5 border border-[#5ab946]/10 text-[10px] text-gray-650 leading-relaxed font-medium">
                <ShieldCheck size={16} className="text-[#5ab946] flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-gray-800">SDC Trust Shield</p>
                  <p className="text-gray-500">100% genuine products with GST Invoice. 7 Days Replacement guarantee.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Advanced Key Features Section */}
        <div className="bg-white rounded-3xl shadow-sm p-6 md:p-8 mt-8 border border-gray-200/60 space-y-5">
          <h2 className="text-lg md:text-xl font-black text-gray-900 border-b border-gray-100 pb-3">
            Key <span className="text-[#5ab946]">Features</span>
          </h2>
          
          {isTableLayout ? (
            <div className="border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-150">
              {keyFeaturesRows.map((row, idx) => (
                <div key={idx} className={`grid grid-cols-3 p-3 text-xs md:text-sm ${idx % 2 === 0 ? "bg-gray-50/50" : ""}`}>
                  <span className="font-bold text-gray-500 col-span-1">{row.label}</span>
                  <span className={`col-span-2 ${row.label.toLowerCase() === 'brand' ? 'text-gray-800 font-semibold' : 'text-gray-700'}`}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-5 bg-gray-50/50 border border-gray-100 rounded-2xl text-xs md:text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {product.specs_content || "No key features listed."}
            </div>
          )}
        </div>



        {/* 6. Related Products Carousel */}
        {relatedProducts.length > 0 && (
          <div className="mt-8">
            <ProductCarousel 
              title="Customers who viewed this item also viewed" 
              products={relatedProducts} 
              wishlist={wishlist}
              onToggleWishlist={handleToggleWishlist}
            />
          </div>
        )}
      </main>

      <Footer />
      <BottomNav />

      {/* Lightbox Modal Overlay */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md animate-fade-in">
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
          
          {/* Header Strip */}
          <div className="w-full h-20 flex-shrink-0 flex items-center justify-between px-6 md:px-10 bg-gradient-to-b from-black/80 to-transparent relative z-50">
            <h2 className="text-white text-xs md:text-sm font-bold truncate max-w-[75%] opacity-90">{product.title}</h2>
            <button 
              onClick={() => setIsLightboxOpen(false)}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer hover:scale-105 active:scale-95"
              title="Close (Esc)"
            >
              <X size={20} />
            </button>
          </div>

          {/* Main Content: Left arrow, Image, Right arrow */}
          <div className="w-full flex-grow flex items-center justify-between px-4 md:px-12 max-w-6xl relative">
            <button 
              onClick={() => setLightboxImageIndex(prev => (prev === 0 ? galleryImages.length - 1 : prev - 1))}
              className="p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer z-10 active:scale-95 hover:scale-105"
              title="Previous Image (Left Arrow)"
            >
              <ChevronLeft size={24} />
            </button>

            <div className="flex-1 h-[60vh] flex items-center justify-center p-4">
              <img 
                src={galleryImages[lightboxImageIndex]} 
                alt="" 
                className="max-h-full max-w-full object-contain rounded-2xl select-none shadow-2xl animate-scale-in bg-white/5 p-4" 
              />
            </div>

            <button 
              onClick={() => setLightboxImageIndex(prev => (prev === galleryImages.length - 1 ? 0 : prev + 1))}
              className="p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer z-10 active:scale-95 hover:scale-105"
              title="Next Image (Right Arrow)"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          {/* Bottom Thumbnails Strip */}
          <div className="pb-8 flex gap-3.5 px-4 overflow-x-auto max-w-full">
            {galleryImages.map((img, idx) => (
              <div 
                key={idx}
                onClick={() => setLightboxImageIndex(idx)}
                className={`w-16 h-16 md:w-20 md:h-20 border rounded-2xl cursor-pointer p-1.5 bg-white flex items-center justify-center overflow-hidden transition-all duration-200
                  ${lightboxImageIndex === idx ? 'ring-4 ring-[#5ab946] scale-105 border-transparent' : 'opacity-40 hover:opacity-90 border-gray-700'}
                `}
              >
                <img src={img} alt="" className="max-h-full max-w-full object-contain" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Auth Redirect Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in px-4">
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

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-[120] flex items-center gap-3 bg-gray-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl max-w-sm animate-toast-slide-up border border-gray-800">
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes toastSlideUp {
              from { transform: translateY(16px); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
            .animate-toast-slide-up {
              animation: toastSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
          `}} />
          {toast.message.toLowerCase().includes("wishlist") ? (
            toast.type === "success" ? (
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-450 flex items-center justify-center flex-shrink-0">
                <Heart size={13} fill="currentColor" className="text-emerald-400" />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-white/10 text-gray-400 flex items-center justify-center flex-shrink-0">
                <Heart size={13} />
              </div>
            )
          ) : (
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-450 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={13} className="text-emerald-400" />
            </div>
          )}
          <span className="text-xs font-semibold leading-tight pr-2">{toast.message}</span>
          <button 
            onClick={() => setToast(prev => ({ ...prev, show: false }))}
            className="text-white/40 hover:text-white transition-colors cursor-pointer pl-1 ml-auto flex-shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function ProductDetailsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#e3e6e6] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#5ab946]"></div>
      </div>
    }>
      <ProductDetailsContent />
    </Suspense>
  );
}
