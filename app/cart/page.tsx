"use client";

import React, { useEffect, useState, useCallback } from "react";
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, ShieldCheck, Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { getDeliveryChargeForQuantity } from "@/lib/storeService";

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    title: string;
    price: number;
    mrp: number | null;
    imageUrl: string;
    brand: string | null;
    freeDelivery: boolean;
    deliveryCharge: number;
    deliverySlabs: { min_qty: number; max_qty?: number | null; charge: number }[];
  };
}

export default function CartPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [user, setUser] = useState<any>(null);

  const fetchCart = useCallback(async () => {
    try {
      const res = await fetch("/api/cart");
      if (res.ok) {
        const data = await res.json();
        setCartItems(data);
      }
    } catch (err) {
      console.error("Failed to load cart items:", err);
    }
  }, []);

  useEffect(() => {
    async function checkAuthAndFetchCart() {
      try {
        const authRes = await fetch("/api/auth/me");
        if (authRes.ok) {
          const authData = await authRes.json();
          if (authData.authenticated && authData.user) {
            setUser(authData.user);
            await fetchCart();
          } else {
            router.push("/login?redirect=/cart");
          }
        } else {
          router.push("/login?redirect=/cart");
        }
      } catch (err) {
        console.error("Auth / Cart error:", err);
      } finally {
        setLoading(false);
      }
    }

    checkAuthAndFetchCart();
  }, [router, fetchCart]);

  const handleUpdateQuantity = async (productId: string, currentQty: number, change: number) => {
    const targetQty = currentQty + change;
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          quantity: targetQty,
          action: "update"
        })
      });

      if (res.ok) {
        const data = await res.json();
        setCartItems(data);
        window.dispatchEvent(new Event("cart-updated"));
      }
    } catch (err) {
      console.error("Failed to update cart quantity:", err);
    }
  };

  const handleRemoveItem = async (productId: string) => {
    try {
      const res = await fetch(`/api/cart?productId=${productId}`, {
        method: "DELETE"
      });

      if (res.ok) {
        const data = await res.json();
        setCartItems(data);
        window.dispatchEvent(new Event("cart-updated"));
      }
    } catch (err) {
      console.error("Failed to delete cart item:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#e3e6e6] flex flex-col font-sans mb-16 md:mb-0">
        <Navbar />
        <div className="flex-grow flex items-center justify-center py-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#5ab946]"></div>
        </div>
        <BottomNav />
      </div>
    );
  }

  // Calculate pricing summaries
  const totalItemsCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalSellingPrice = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const totalDeliveryCharges = cartItems.reduce((acc, item) => acc + getDeliveryChargeForQuantity(item.product, item.quantity), 0);
  const totalMRP = cartItems.reduce((acc, item) => {
    const itemMRP = item.product.mrp && item.product.mrp > item.product.price ? item.product.mrp : Math.round(item.product.price * 1.25);
    return acc + (itemMRP * item.quantity);
  }, 0);
  const discountAmount = totalMRP - totalSellingPrice;
  const savingsPercentage = totalMRP > 0 ? Math.round((discountAmount / totalMRP) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#e3e6e6] flex flex-col font-sans mb-16 md:mb-0">
      <Navbar />

      <main className="flex-grow w-full max-w-[1400px] mx-auto p-3 sm:p-5">
        <div className="flex flex-col lg:flex-row gap-5">
          {/* Cart Items List Container */}
          <div className="flex-grow bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200/50">
            <div className="flex items-center justify-between border-b border-gray-250 pb-4 mb-4">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                <ShoppingCart size={22} className="text-[#5ab946]" /> Shopping Cart
              </h1>
              <span className="text-gray-500 text-xs sm:text-sm font-bold bg-gray-100 px-3 py-1 rounded-full">
                {totalItemsCount} {totalItemsCount === 1 ? "item" : "items"}
              </span>
            </div>

            {cartItems.length === 0 ? (
              <div className="text-center py-20 bg-gray-50/20 border border-dashed border-gray-200 rounded-2xl space-y-4">
                <div className="text-gray-400 font-extrabold text-lg">Your SDC Store Cart is empty.</div>
                <p className="text-gray-500 text-xs font-semibold max-w-sm mx-auto">
                  Add computers, hardware components, quick services, or premium accessories to your cart and make them yours!
                </p>
                <button
                  onClick={() => router.push("/")}
                  className="bg-[#5ab946] hover:bg-[#4ca03a] text-white text-xs font-black px-6 py-2.5 rounded-xl transition-all active:scale-95 shadow-md hover:shadow-lg inline-flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
                >
                  Shop Best Sellers <ArrowRight size={14} />
                </button>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {cartItems.map((item) => {
                  const mrpSingle = item.product.mrp && item.product.mrp > item.product.price ? item.product.mrp : Math.round(item.product.price * 1.25);
                  const discountSingle = mrpSingle - item.product.price;
                  const discountPercentSingle = Math.round((discountSingle / mrpSingle) * 100);

                  return (
                    <div 
                      key={item.id}
                      className="flex gap-3 sm:gap-5 pb-4 sm:pb-6 border-b border-gray-150 last:border-b-0 last:pb-0 relative"
                    >
                      {/* Product Image Frame */}
                      <div className="w-[85px] h-[85px] sm:w-[130px] sm:h-[130px] bg-gray-50 rounded-xl flex items-center justify-center p-2 flex-shrink-0 border border-gray-150">
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.title}
                          className="max-h-full max-w-full object-contain cursor-pointer"
                          onClick={() => router.push(`/products/${item.product.id}`)}
                        />
                      </div>

                      {/* Details Area */}
                      <div className="flex-grow flex flex-col justify-between min-w-0">
                        <div className="space-y-0.5 sm:space-y-1">
                          <h3 
                            onClick={() => router.push(`/products/${item.product.id}`)}
                            className="text-xs sm:text-sm font-extrabold text-gray-800 line-clamp-2 hover:text-[#5ab946] transition-colors leading-snug cursor-pointer pr-4"
                          >
                            {item.product.title}
                          </h3>
                          {item.product.brand && (
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider">
                              Brand: {item.product.brand}
                            </p>
                          )}
                          <div className="flex items-baseline gap-2 flex-wrap pt-0.5">
                            <span className="text-xs sm:text-sm font-black text-gray-900 font-mono">
                              ₹{item.product.price.toLocaleString("en-IN")}
                            </span>
                            {mrpSingle > item.product.price && (
                              <>
                                <span className="text-[10px] sm:text-xs text-gray-400 line-through font-mono">
                                  ₹{mrpSingle.toLocaleString("en-IN")}
                                </span>
                                <span className="text-[#e61923] text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-red-50 border border-red-100 px-1 rounded-sm">
                                  -{discountPercentSingle}% OFF
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Quantity controls and Action Bar */}
                        <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
                          <div className="flex items-center border border-gray-250 bg-gray-50 rounded-lg overflow-hidden shadow-xs h-8">
                            <button
                              onClick={() => handleUpdateQuantity(item.product.id, item.quantity, -1)}
                              className="px-2.5 py-1 text-gray-500 hover:bg-gray-200 transition-colors h-full flex items-center justify-center cursor-pointer"
                            >
                              <Minus size={11} className="stroke-[3]" />
                            </button>
                            <span className="px-3.5 text-xs font-black text-gray-800 bg-white h-full flex items-center justify-center font-mono">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleUpdateQuantity(item.product.id, item.quantity, 1)}
                              className="px-2.5 py-1 text-gray-500 hover:bg-gray-200 transition-colors h-full flex items-center justify-center cursor-pointer"
                            >
                              <Plus size={11} className="stroke-[3]" />
                            </button>
                          </div>

                          <button
                            onClick={() => handleRemoveItem(item.product.id)}
                            className="flex items-center gap-1.5 text-gray-450 hover:text-red-500 transition-colors py-1 px-2.5 rounded-lg hover:bg-red-50 text-[10px] sm:text-xs font-black cursor-pointer uppercase tracking-wider"
                          >
                            <Trash2 size={13} /> Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pricing Summary Side Card */}
          {cartItems.length > 0 && (
            <div className="w-full lg:w-[380px] flex-shrink-0 space-y-4">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200/50 space-y-4">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider border-b border-gray-150 pb-2">
                  Price Details
                </h3>

                <div className="space-y-3 font-semibold text-xs text-gray-700">
                  <div className="flex justify-between">
                    <span>Price ({totalItemsCount} {totalItemsCount === 1 ? "item" : "items"})</span>
                    <span className="font-mono text-gray-950">₹{totalMRP.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discount</span>
                    <span className="font-mono text-[#5ab946] font-bold">-₹{discountAmount.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Charges</span>
                    <span className={totalDeliveryCharges > 0 ? "font-mono text-gray-950 font-bold" : "text-[#5ab946] font-bold uppercase tracking-wider"}>
                      {totalDeliveryCharges > 0 ? `₹${totalDeliveryCharges.toLocaleString("en-IN")}` : "Free"}
                    </span>
                  </div>
                  <div className="border-t border-dashed border-gray-200 my-2 pt-3 flex justify-between items-baseline">
                    <span className="text-sm font-black text-gray-900">Total Amount</span>
                    <span className="text-base sm:text-lg font-black text-gray-900 font-mono">
                      ₹{(totalSellingPrice + totalDeliveryCharges).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                <div className="bg-[#5ab946]/5 rounded-xl p-3 border border-[#5ab946]/10 text-[10px] text-gray-600 leading-relaxed font-bold">
                  🎉 You will save <span className="text-[#5ab946] font-extrabold font-mono">₹{discountAmount.toLocaleString("en-IN")} ({savingsPercentage}%)</span> on this order!
                </div>

                <button
                  onClick={() => router.push("/checkout")}
                  className="w-full bg-gradient-to-r from-[#5ab946] to-[#49a836] hover:from-[#4ba03a] hover:to-[#3e892e] text-white py-3.5 rounded-xl font-black transition-all shadow-[0_4px_14px_rgba(90,185,70,0.25)] hover:shadow-[0_6px_20px_rgba(90,185,70,0.35)] active:scale-[0.98] cursor-pointer text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
                >
                  Proceed to Checkout <ArrowRight size={14} />
                </button>
              </div>

              {/* Security trust badge */}
              <div className="bg-white/80 p-4 rounded-xl border border-gray-200/50 flex gap-3 text-[10px] text-gray-500 leading-relaxed font-medium">
                <ShieldCheck size={18} className="text-[#5ab946] flex-shrink-0" />
                <div>
                  <p className="font-bold text-gray-750">Secure Transactions</p>
                  <p>All items in your cart are backed by Saidurga Computers. Safe payment methods, easy replacements, and authentic warranties guaranteed.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
