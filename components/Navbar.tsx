import React, { useState, useEffect } from "react";
import { Search, ShoppingCart, MapPin, Menu, User, Mic, LogOut, ChevronDown, Heart, X } from "lucide-react";
import { getSettings, Setting } from "@/lib/storeService";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [menuCategories, setMenuCategories] = useState<{ id: string; name: string }[]>([]);
  const [allCategories, setAllCategories] = useState<{ id: string; name: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [settings, setSettings] = useState<Setting>({
    id: "default",
    siteName: "Saidurga Computers",
    logoUrl: ""
  });

  // Watch for wishlist updates in localStorage
  useEffect(() => {
    const handleOpenMenu = () => setMobileMenuOpen(true);
    window.addEventListener("toggle-mobile-menu", handleOpenMenu);
    return () => window.removeEventListener("toggle-mobile-menu", handleOpenMenu);
  }, []);

  useEffect(() => {
    function updateCount() {
      if (user && user.id) {
        const saved = localStorage.getItem(`sdc_wishlist_${user.id}`);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setWishlistCount(Object.keys(parsed).length);
          } catch {
            setWishlistCount(0);
          }
        } else {
          setWishlistCount(0);
        }
      } else {
        setWishlistCount(0);
      }
    }

    updateCount();

    window.addEventListener("wishlist-updated", updateCount);
    window.addEventListener("storage", updateCount);

    return () => {
      window.removeEventListener("wishlist-updated", updateCount);
      window.removeEventListener("storage", updateCount);
    };
  }, [user]);

  // Load and listen to cart count
  useEffect(() => {
    async function updateCartCount() {
      if (user && user.id) {
        try {
          const res = await fetch("/api/cart");
          if (res.ok) {
            const data = await res.json();
            const totalItems = data.reduce((total: number, item: any) => total + item.quantity, 0);
            setCartCount(totalItems);
          } else {
            setCartCount(0);
          }
        } catch (err) {
          console.error("Failed to fetch cart:", err);
          setCartCount(0);
        }
      } else {
        setCartCount(0);
      }
    }

    updateCartCount();

    window.addEventListener("cart-updated", updateCartCount);
    return () => {
      window.removeEventListener("cart-updated", updateCartCount);
    };
  }, [user]);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const data = await res.json();
          setAllCategories(data);
          // Filter those designated to show in the navigation menu
          const menuOnly = data.filter((c: any) => c.showInMenu);
          setMenuCategories(menuOnly);
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    }
    loadCategories();
  }, []);

  useEffect(() => {
    async function checkUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setUser(data.user);
            
            // Sync user's wishlist from DB to LocalStorage on initial load
            try {
              const wlRes = await fetch("/api/wishlist");
              if (wlRes.ok) {
                const wlData = await wlRes.json();
                localStorage.setItem(`sdc_wishlist_${data.user.id}`, JSON.stringify(wlData));
                window.dispatchEvent(new Event("wishlist-updated"));
              }
            } catch (wlErr) {
              console.error("Failed to sync wishlist from DB:", wlErr);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch user state:", err);
      }
    }
    checkUser();
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        setUser(null);
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to logout:", err);
    }
  };

  useEffect(() => {
    async function loadSettings() {
      try {
        if (isSupabaseConfigured()) {
          const res = await fetch("/api/settings", { cache: "no-store" });
          if (res.ok) {
            const data = await res.json();
            setSettings(data);
            return;
          }
        }
        const data = await getSettings();
        setSettings(data);
      } catch (err) {
        console.error("Failed to load navbar settings:", err);
      }
    }
    loadSettings();
  }, []);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      router.push(`/?category=${encodeURIComponent(query)}`);
    } else if (selectedCategory !== "All") {
      router.push(`/?category=${encodeURIComponent(selectedCategory)}`);
    } else {
      router.push("/");
    }
  };

  const getTextLogoDetails = (name: string) => {
    const normalized = name.trim();
    if (normalized.toLowerCase().includes("saidurga") && normalized.toLowerCase().includes("computers")) {
      return {
        bigInitial: "S",
        smallInitials: "DC",
        word1: "SAIDURGA",
        word2: "COMPUTERS"
      };
    }
    
    const words = normalized.split(/\s+/);
    if (words.length >= 2) {
      const word1 = words[0].toUpperCase();
      const word2 = words.slice(1).join(" ").toUpperCase();
      const bigInitial = word1.charAt(0);
      const smallInitials = words.slice(1).map(w => w.charAt(0)).join("").toUpperCase().slice(0, 3);
      return { bigInitial, smallInitials, word1, word2 };
    } else {
      const word1 = words[0].toUpperCase();
      const bigInitial = word1.charAt(0);
      const smallInitials = word1.slice(1, 3).toUpperCase();
      return { bigInitial, smallInitials, word1, word2: "" };
    }
  };

  const logoDetails = getTextLogoDetails(settings.siteName);

  return (
    <>
      <header className="w-full sticky top-0 z-[1000] drop-shadow-sm">
      {/* --- DESKTOP VIEW --- */}
      <div className="hidden md:flex bg-[#111820] text-white items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div 
            onClick={() => window.location.href = "/"}
            className="flex items-center gap-1.5 px-2 py-1 border border-transparent rounded-sm cursor-pointer transition-colors"
          >
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt={settings.siteName} className="h-10 max-w-[220px] object-contain" />
            ) : (
              <>
                <div className="flex items-end">
                  <span className="text-[#5ab946] font-black text-3xl md:text-3xl leading-none italic drop-shadow-md">
                    {logoDetails.bigInitial}
                  </span>
                  <span className="text-[#5ab946] font-extrabold text-sm md:text-sm leading-none mb-0.5 -ml-0.5">
                    {logoDetails.smallInitials}
                  </span>
                </div>
                <div className="flex flex-col justify-center items-start mt-1">
                  <div className="bg-[#e61923] text-white text-[11px] md:text-xs font-black px-2 py-0.5 rounded-full leading-none tracking-wider shadow-sm">
                    {logoDetails.word1}
                  </div>
                  {logoDetails.word2 && (
                    <div className="text-white text-[9px] md:text-[10px] font-black tracking-[0.15em] leading-none mt-1 ml-1">
                      {logoDetails.word2}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex flex-1 mx-4 max-w-3xl">
          <div className="flex w-full rounded-md overflow-hidden ring-2 ring-transparent focus-within:ring-[#5ab946]">
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-[#1c232c] text-white text-sm px-2 py-2 border-r border-gray-700 outline-none w-auto focus:ring-0 cursor-pointer"
            >
              <option value="All">All Categories</option>
              {(allCategories.length > 0 ? allCategories : [
                { id: "1", name: "Laptops" },
                { id: "2", name: "Component Parts" },
                { id: "3", name: "Hot Accessories" },
                { id: "4", name: "Printers & CCTV" },
                { id: "5", name: "Quick Service Desk" }
              ]).map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${settings.siteName}`} 
              className="flex-1 px-3 py-2 text-white placeholder:text-white bg-[#1c232c] outline-none w-full"
            />
            <button type="submit" className="bg-[#5ab946] hover:bg-[#4ca03a] px-5 py-2 text-white transition-colors cursor-pointer flex items-center justify-center">
              <Search size={24} />
            </button>
          </div>
        </form>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="relative group">
              <div className="flex flex-col items-center px-2.5 py-1 border border-transparent rounded-sm cursor-pointer hover:bg-gray-800/40 transition-colors text-center">
                <User size={20} className="text-[#5ab946]" />
                <span className="text-xs font-semibold text-white mt-0.5 relative flex items-center justify-center pl-3.5 pr-3.5">
                  {user.name.split(' ')[0]}
                  <ChevronDown size={12} className="text-gray-400 absolute right-0 top-1/2 -translate-y-1/2" />
                </span>
              </div>
              
              {/* Dropdown Menu on Hover */}
              <div className="absolute right-0 top-full pt-1 w-40 z-50 hidden group-hover:block">
                <div className="bg-[#1c232c] border border-gray-700 rounded shadow-xl overflow-hidden">
                  <button 
                    onClick={() => router.push("/profile")} 
                    className="w-full text-left px-4 py-2.5 text-xs font-semibold text-white hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    Profile
                  </button>
                  <button 
                    onClick={() => router.push("/wishlist")} 
                    className="w-full text-left px-4 py-2.5 text-xs font-semibold text-white hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    Wishlist
                  </button>
                  <button 
                    onClick={handleLogout} 
                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-white bg-[#e61923] hover:bg-[#c9121b] border-t border-gray-700 transition-colors cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div 
              onClick={() => router.push("/login")}
              className="flex flex-col items-center px-2.5 py-1 border border-transparent rounded-sm cursor-pointer hover:text-[#5ab946] group transition-colors text-center"
            >
              <User size={20} className="text-white group-hover:text-[#5ab946] transition-colors" />
              <span className="text-xs font-semibold text-white group-hover:text-[#5ab946] transition-colors mt-0.5">login</span>
            </div>
          )}

          {/* Wishlist Link */}
          <div 
            onClick={() => router.push("/wishlist")}
            className="flex flex-col items-center px-2.5 py-1 border border-transparent rounded-sm cursor-pointer relative hover:text-[#5ab946] group transition-colors text-center"
          >
            <div className="relative">
              <Heart size={20} className="text-white group-hover:text-red-500 transition-colors" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-[#e61923] text-white text-[9px] font-extrabold px-1 rounded-full text-center leading-none flex items-center justify-center h-4 min-w-[16px]">
                  {wishlistCount}
                </span>
              )}
            </div>
            <span className="text-xs font-semibold text-white group-hover:text-[#5ab946] transition-colors mt-0.5">Wishlist</span>
          </div>

          {/* Cart Link */}
          <div 
            onClick={() => router.push("/cart")}
            className="flex flex-col items-center px-2.5 py-1 border border-transparent rounded-sm cursor-pointer relative hover:text-[#5ab946] group transition-colors text-center"
          >
            <div className="relative">
              <ShoppingCart size={20} className="text-white group-hover:text-[#5ab946] transition-colors" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-[#e61923] text-white text-[9px] font-extrabold px-1 rounded-full text-center leading-none flex items-center justify-center h-4 min-w-[16px]">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="text-xs font-semibold text-white group-hover:text-[#5ab946] transition-colors mt-0.5">Cart</span>
          </div>
        </div>
      </div>

      <div className="hidden md:flex bg-[#1c232c] text-white items-center px-4 py-1 gap-4 text-sm">
        <button 
          onClick={() => router.push("/")}
          className="flex items-center gap-1 font-bold px-1 py-1 border border-transparent rounded-sm hover:text-[#5ab946] transition-colors cursor-pointer"
        >
          Home
        </button>
        {(menuCategories.length > 0 ? menuCategories : [
          { id: "1", name: "Laptops" },
          { id: "2", name: "Component Parts" },
          { id: "3", name: "Hot Accessories" },
          { id: "4", name: "Printers & CCTV" },
          { id: "5", name: "Quick Service Desk" }
        ]).map((cat, idx) => (
          <span 
            key={cat.id} 
            onClick={() => router.push(`/?category=${encodeURIComponent(cat.name)}`)}
            className={`cursor-pointer px-1 py-1 border border-transparent rounded-sm hover:text-[#5ab946] transition-colors ${idx === 0 ? "text-[#5ab946] font-bold" : ""}`}
          >
            {cat.name}
          </span>
        ))}
      </div>

      {/* --- MOBILE VIEW (Native App Feel) --- */}
      <div className="flex md:hidden flex-col w-full bg-[#111820]">
        <div className="flex items-center justify-between px-3 pt-3 pb-2 relative min-h-[48px]">
          {/* Mobile Menu Icon (Left) */}
          <button 
            onClick={() => setMobileMenuOpen(true)} 
            className="text-white hover:text-[#5ab946] p-1 cursor-pointer flex items-center justify-center"
          >
            <Menu size={24} />
          </button>

          {/* Mobile Logo (Center) */}
          <div 
            onClick={() => window.location.href = "/"} 
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 cursor-pointer"
          >
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt={settings.siteName} className="h-8 max-w-[150px] object-contain" />
            ) : (
              <>
                <div className="flex items-end">
                  <span className="text-[#5ab946] font-black text-2xl leading-none italic drop-shadow-md">
                    {logoDetails.bigInitial}
                  </span>
                  <span className="text-[#5ab946] font-extrabold text-xs leading-none mb-0.5 -ml-0.5">
                    {logoDetails.smallInitials}
                  </span>
                </div>
                <div className="flex flex-col justify-center items-start">
                  <div className="bg-[#e61923] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none tracking-wider shadow-sm">
                    {logoDetails.word1}
                  </div>
                  {logoDetails.word2 && (
                    <div className="text-white text-[7px] font-black tracking-[0.15em] leading-none mt-1 ml-1">
                      {logoDetails.word2}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Status Icons (Right) */}
          <div className="flex items-center gap-5 text-white">
            {user ? (
              <div className="relative">
                <div 
                  onClick={() => setMobileDropdownOpen(!mobileDropdownOpen)}
                  className="flex items-center gap-1 cursor-pointer py-1"
                >
                  <User size={20} />
                  <ChevronDown size={12} className="text-gray-400" />
                </div>
                {/* Dropdown Menu on Click */}
                {mobileDropdownOpen && (
                  <div className="absolute right-0 top-full pt-1 w-32 z-50">
                    <div className="bg-[#1c232c] border border-gray-700 rounded shadow-xl overflow-hidden">
                      <button 
                        onClick={() => {
                          setMobileDropdownOpen(false);
                          router.push("/profile");
                        }} 
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-white hover:bg-gray-700 transition-colors cursor-pointer"
                      >
                        Profile
                      </button>
                      <button 
                        onClick={() => {
                          setMobileDropdownOpen(false);
                          router.push("/wishlist");
                        }} 
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-white hover:bg-gray-700 border-t border-gray-700 transition-colors cursor-pointer"
                      >
                        Wishlist
                      </button>
                      <button 
                        onClick={() => {
                          setMobileDropdownOpen(false);
                          handleLogout();
                        }} 
                        className="w-full text-left px-3 py-2 text-xs font-bold text-white bg-[#e61923] hover:bg-[#c9121b] border-t border-gray-700 transition-colors cursor-pointer"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div onClick={() => router.push("/login")} className="flex mt-1 cursor-pointer">
                <User size={20} />
              </div>
            )}
          </div>
        </div>
        <form onSubmit={handleSearchSubmit} className="px-3 pb-3">
          <div className="flex items-center bg-[#1c232c] rounded-md px-2 py-1.5 shadow-sm focus-within:ring-2 focus-within:ring-[#5ab946]">
            <Search size={20} className="text-white mr-2 cursor-pointer" onClick={() => handleSearchSubmit()} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${settings.siteName.split(' ')[0]}`}
              className="flex-1 outline-none text-white text-base bg-transparent placeholder:text-white"
            />
            <Mic size={20} className="text-white/80 ml-2" />
          </div>
        </form>
      </div>
      
      {/* Category Strip (Mobile) */}
      <div className="flex md:hidden bg-[#f3f4f6] text-black items-center px-4 py-2.5 gap-6 text-sm overflow-x-auto whitespace-nowrap hide-scrollbar shadow-sm border-b border-gray-200">
        {(menuCategories.length > 0 ? menuCategories : [
          { id: "1", name: "Laptops" },
          { id: "2", name: "Component Parts" },
          { id: "3", name: "Hot Accessories" },
          { id: "4", name: "Printers & CCTV" },
          { id: "5", name: "Quick Service Desk" }
        ]).map((cat, idx) => (
          <span 
            key={cat.id}
            onClick={() => router.push(`/?category=${encodeURIComponent(cat.name)}`)}
            className={`cursor-pointer font-medium hover:text-[#e61923] transition-colors ${idx === 0 ? "text-[#5ab946] font-bold" : ""}`}
          >
            {cat.name}
          </span>
        ))}
      </div>
    </header>

    {/* Mobile Menu Drawer Overlay */}
    {mobileMenuOpen && (
        <div className="fixed inset-0 z-[9999] md:hidden flex animate-fade-in">
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
          />
          <div className="relative w-full max-w-[280px] bg-[#111820] text-white h-full shadow-2xl p-5 overflow-y-auto flex flex-col animate-slide-right border-r border-gray-800">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-5">
              <span className="font-extrabold text-sm uppercase tracking-wider text-[#5ab946]">Categories</span>
              <button onClick={() => setMobileMenuOpen(false)} className="text-gray-400 hover:text-white cursor-pointer p-1">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex flex-col gap-4">
              {(allCategories.length > 0 ? allCategories : [
                { id: "1", name: "Laptops" },
                { id: "2", name: "Component Parts" },
                { id: "3", name: "Hot Accessories" },
                { id: "4", name: "Printers & CCTV" },
                { id: "5", name: "Quick Service Desk" }
              ]).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    router.push(`/?category=${encodeURIComponent(cat.name)}`);
                  }}
                  className="w-full text-left py-2.5 px-3 text-sm font-semibold hover:bg-gray-850 hover:text-[#5ab946] rounded-xl transition-all cursor-pointer"
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html:`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        /* Safe Area padding for notches/home indicators */
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 16px); }

        @keyframes slideRight {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-right {
          animation: slideRight 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />
    </>
  );
}
