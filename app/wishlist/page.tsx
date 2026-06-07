"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import { Heart, Trash2, ShoppingCart, Loader2, ArrowRight } from "lucide-react";
import { getProducts, Product } from "@/lib/storeService";

export default function WishlistPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [wishlist, setWishlist] = useState<Record<string, boolean>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: "" });

  useEffect(() => {
    if (!toast.show) return;
    const timer = setTimeout(() => setToast({ show: false, message: "" }), 2500);
    return () => clearTimeout(timer);
  }, [toast.show]);

  useEffect(() => {
    async function initPage() {
      try {
        // 1. Verify Authentication
        const authRes = await fetch("/api/auth/me");
        if (!authRes.ok) {
          router.push("/login");
          return;
        }
        const authData = await authRes.json();
        if (!authData.authenticated || !authData.user) {
          router.push("/login");
          return;
        }
        
        setUser(authData.user);
        setAuthChecking(false);

        // 2. Load Wishlist from LocalStorage
        const savedWishlist = localStorage.getItem(`sdc_wishlist_${authData.user.id}`);
        const wishlistObj = savedWishlist ? JSON.parse(savedWishlist) : {};
        setWishlist(wishlistObj);

        // 3. Load Products catalog
        const productsData = await getProducts();
        setProducts(productsData);
      } catch (err) {
        console.error("Failed to load wishlist page data:", err);
      } finally {
        setLoading(false);
      }
    }
    initPage();
  }, [router]);

  // Remove from Wishlist
  const removeFromWishlist = async (productId: string) => {
    if (!user) return;
    try {
      const wlRes = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, action: "remove" })
      });

      if (wlRes.ok) {
        const updatedWishlist = await wlRes.json();
        setWishlist(updatedWishlist);
        localStorage.setItem(`sdc_wishlist_${user.id}`, JSON.stringify(updatedWishlist));
        window.dispatchEvent(new Event("wishlist-updated"));
      } else {
        throw new Error("Failed to remove wishlist item from database");
      }
    } catch (err) {
      console.error("Failed to remove item from wishlist:", err);
    }
  };

  // Mock Move to Cart with success feedback
  const handleMoveToCart = async (product: Product) => {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) throw new Error("Auth check failed");
      const data = await res.json();
      if (!data.authenticated || !data.user) {
        router.push("/login");
        return;
      }

      const cartRes = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, quantity: 1, action: "add" })
      });

      if (cartRes.ok) {
        window.dispatchEvent(new Event("cart-updated"));
        setToast({ show: true, message: `"${product.title}" added to cart.` });
        removeFromWishlist(product.id);
      } else {
        const errData = await cartRes.json();
        throw new Error(errData.error || "Failed to add to cart");
      }
    } catch (err) {
      console.error("Failed to add wishlist item to cart:", err);
    }
  };

  // Filter products currently in wishlist
  const wishlistedProducts = products.filter(p => !!wishlist[p.id]);

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#e3e6e6] flex flex-col font-sans mb-16 md:mb-0">
        <Navbar />
        <main className="flex-grow flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-[#5ab946]" size={36} />
            <p className="text-gray-600 font-medium">Checking authentication...</p>
          </div>
        </main>
        <Footer />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#e3e6e6] flex flex-col font-sans mb-16 md:mb-0">
      <Navbar />
      
      <main className="flex-grow w-full max-w-[1500px] mx-auto p-4 md:p-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/60">
          {/* Header */}
          <div className="border-b border-gray-200 pb-5 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 flex items-center gap-2">
                My <span className="text-[#5ab946]">Wishlist</span>
                <span className="text-sm bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full font-bold">
                  {wishlistedProducts.length} {wishlistedProducts.length === 1 ? 'Item' : 'Items'}
                </span>
              </h1>
              <p className="text-gray-400 text-xs md:text-sm mt-1">
                Manage your saved products. Sign in on any device to view them.
              </p>
            </div>
            <button 
              onClick={() => router.push('/')}
              className="px-5 py-2.5 bg-gray-50 border border-gray-300 hover:border-[#5ab946] hover:text-[#5ab946] text-gray-700 text-sm font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              Continue Shopping →
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-[#5ab946]" size={32} />
            </div>
          ) : wishlistedProducts.length === 0 ? (
            /* Empty State */
            <div className="text-center py-20 max-w-md mx-auto">
              <div className="w-20 h-20 bg-red-50 text-[#e61923] rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <Heart size={36} fill="#e61923" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Your Wishlist is Empty</h3>
              <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                Explore our catalog and tap the heart icon on any product to save it here for later.
              </p>
              <button
                onClick={() => router.push('/')}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#5ab946] hover:bg-[#4ca03a] text-white font-bold rounded-xl shadow-lg shadow-[#5ab946]/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Explore Products
                <ArrowRight size={18} />
              </button>
            </div>
          ) : (
            /* Wishlist Products Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {wishlistedProducts.map((product) => {
                const mrp = Math.round(product.price * 1.25);
                
                return (
                  <div 
                    key={product.id} 
                    className="w-full border border-gray-200/80 rounded-2xl p-4 hover:shadow-lg transition-all flex flex-col justify-between bg-white group relative"
                  >
                    {/* Remove Button */}
                    <button 
                      onClick={() => removeFromWishlist(product.id)}
                      className="absolute top-6 right-6 z-10 p-2 rounded-full bg-white/90 hover:bg-red-50 border border-gray-100 shadow-sm text-gray-400 hover:text-[#e61923] transition-colors cursor-pointer"
                      title="Remove from Wishlist"
                    >
                      <Trash2 size={16} />
                    </button>

                    <div>
                      {/* Image Frame */}
                      <div 
                        onClick={() => router.push(`/products/${product.id}`)}
                        className="relative w-full aspect-square bg-[#f3f4f6]/60 rounded-xl flex items-center justify-center p-4 mb-4 cursor-pointer overflow-hidden"
                      >
                        <img 
                          src={product.image_url} 
                          alt={product.title} 
                          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300" 
                        />
                      </div>
                      
                      {/* Category & Title */}
                      <span className="text-[10px] uppercase font-black tracking-wider text-gray-400">
                        {product.category}
                      </span>
                      <h3 
                        onClick={() => router.push(`/products/${product.id}`)}
                        className="text-xs md:text-sm font-semibold text-gray-800 line-clamp-2 min-h-[40px] group-hover:text-[#5ab946] cursor-pointer transition-colors leading-tight mt-1 mb-3"
                      >
                        {product.title}
                      </h3>
                    </div>

                    {/* Price and Action Section */}
                    <div className="space-y-4">
                      <div className="text-left space-y-1">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-base md:text-lg font-extrabold text-gray-900 font-mono">
                            ₹{product.price.toLocaleString("en-IN")}
                          </span>
                          <span className="text-[10px] md:text-xs font-bold text-green-600">
                            20% OFF
                          </span>
                        </div>
                        <div className="text-[10px] md:text-xs text-gray-400 font-medium">
                          MRP <span className="line-through font-mono">₹{mrp.toLocaleString("en-IN")}</span>
                        </div>
                      </div>

                      {/* Add to Cart / Action */}
                      <button
                        onClick={() => handleMoveToCart(product)}
                        className="w-full py-3 bg-[#5ab946] hover:bg-[#4ca03a] text-white font-bold rounded-xl shadow-md hover:shadow-[#5ab946]/10 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
                      >
                        <ShoppingCart size={14} />
                        Add to Cart
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
      <BottomNav />

      {toast.show && (
        <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-[120] bg-gray-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-gray-800 text-xs font-semibold">
          {toast.message}
        </div>
      )}
    </div>
  );
}
