import React, { useEffect, useState } from "react";
import { Home, User, ShoppingCart, Heart, LayoutGrid } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [wishlistCount, setWishlistCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    function updateWishlistCount() {
      // Find logged in user key to read local storage wishlist count
      const keys = Object.keys(localStorage);
      const userWishlistKey = keys.find(k => k.startsWith("sdc_wishlist_"));
      if (userWishlistKey) {
        try {
          const saved = localStorage.getItem(userWishlistKey);
          if (saved) {
            const parsed = JSON.parse(saved);
            setWishlistCount(Object.keys(parsed).length);
          }
        } catch {
          setWishlistCount(0);
        }
      } else {
        setWishlistCount(0);
      }
    }

    updateWishlistCount();
    window.addEventListener("wishlist-updated", updateWishlistCount);
    window.addEventListener("storage", updateWishlistCount);
    return () => {
      window.removeEventListener("wishlist-updated", updateWishlistCount);
      window.removeEventListener("storage", updateWishlistCount);
    };
  }, []);

  // Fetch cart items and count
  useEffect(() => {
    async function updateCartCount() {
      try {
        const res = await fetch("/api/cart");
        if (res.ok) {
          const data = await res.json();
          // data is an array of CartItem
          const totalItems = data.reduce((total: number, item: any) => total + item.quantity, 0);
          setCartCount(totalItems);
        } else {
          setCartCount(0);
        }
      } catch (err) {
        console.error("Failed to fetch cart count:", err);
        setCartCount(0);
      }
    }

    updateCartCount();
    window.addEventListener("cart-updated", updateCartCount);
    return () => {
      window.removeEventListener("cart-updated", updateCartCount);
    };
  }, []);

  const handleOpenCategories = () => {
    // If not on home page, go to home page first
    if (pathname !== "/") {
      router.push("/");
    }
    // Delay slightly to allow navigation to complete, then open menu
    setTimeout(() => {
      window.dispatchEvent(new Event("toggle-mobile-menu"));
    }, 100);
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#111820] border-t border-gray-800 flex justify-around items-center pb-safe pt-2 px-2 z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.25)]">
      {/* Home */}
      <button 
        onClick={() => router.push("/")}
        className={`flex flex-col items-center w-16 transition-colors duration-200 cursor-pointer ${pathname === "/" ? "text-[#5ab946]" : "text-gray-400 hover:text-white"}`}
      >
        <Home size={22} />
        <span className={`text-[10px] mt-1 font-bold ${pathname === "/" ? "text-[#5ab946]" : "text-gray-400"}`}>Home</span>
      </button>

      {/* Categories */}
      <button 
        onClick={handleOpenCategories}
        className="flex flex-col items-center text-gray-400 hover:text-white w-16 transition-colors duration-200 cursor-pointer"
      >
        <LayoutGrid size={22} />
        <span className="text-[10px] mt-1 font-bold text-gray-400">Categories</span>
      </button>

      {/* Wishlist */}
      <button 
        onClick={() => router.push("/wishlist")}
        className={`flex flex-col items-center w-16 relative transition-colors duration-200 cursor-pointer ${pathname === "/wishlist" ? "text-[#5ab946]" : "text-gray-400 hover:text-white"}`}
      >
        <div className="relative">
          <Heart size={22} fill={pathname === "/wishlist" ? "currentColor" : "none"} />
          {wishlistCount > 0 && (
            <span className="absolute -top-1.5 -right-2.5 bg-[#e61923] text-white text-[9px] font-black px-1.5 rounded-full text-center min-w-[15px] h-4 flex items-center justify-center">
              {wishlistCount}
            </span>
          )}
        </div>
        <span className={`text-[10px] mt-1 font-bold ${pathname === "/wishlist" ? "text-[#5ab946]" : "text-gray-400"}`}>Wishlist</span>
      </button>

      {/* Cart */}
      <button 
        onClick={() => router.push("/cart")}
        className={`flex flex-col items-center w-16 relative transition-colors duration-200 cursor-pointer ${pathname === "/cart" ? "text-[#5ab946]" : "text-gray-400 hover:text-white"}`}
      >
        <div className="relative">
          <ShoppingCart size={22} />
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-2.5 bg-[#e61923] text-white text-[9px] font-black px-1.5 rounded-full text-center min-w-[15px] h-4 flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </div>
        <span className={`text-[10px] mt-1 font-bold ${pathname === "/cart" ? "text-[#5ab946]" : "text-gray-400"}`}>Cart</span>
      </button>

      {/* Profile */}
      <button 
        onClick={() => router.push("/profile")}
        className={`flex flex-col items-center w-16 transition-colors duration-200 cursor-pointer ${(pathname === "/profile" || pathname === "/login") ? "text-[#5ab946]" : "text-gray-400 hover:text-white"}`}
      >
        <User size={22} />
        <span className={`text-[10px] mt-1 font-bold ${(pathname === "/profile" || pathname === "/login") ? "text-[#5ab946]" : "text-gray-400"}`}>Profile</span>
      </button>
    </div>
  );
}
