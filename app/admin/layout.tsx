"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getAdminUser, logoutAdmin } from "@/lib/authService";
import { isSupabaseConfigured } from "@/lib/supabase";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  ClipboardList,
  Image as ImageIcon, 
  Grid, 
  Sliders, 
  ArrowLeft,
  Menu,
  X,
  LogOut,
  Settings,
  ChevronDown,
  ChevronRight,
  Mail
} from "lucide-react";

import { Suspense } from "react";

function AdminLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  
  const tabSearchParams = useSearchParams();
  const activeTab = tabSearchParams.get("tab") || "general";
  const isSettingsRoute = pathname.startsWith("/admin/settings");
  const settingsMenuOpen = isSettingsRoute || settingsOpen;

  const isCategoriesRoute = pathname.startsWith("/admin/categories");
  const categoriesMenuOpen = isCategoriesRoute || categoriesOpen;
  const activeCategoryTab = isCategoriesRoute ? (tabSearchParams.get("tab") || "grids") : null;

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    async function enforceAuth() {
      if (isLoginPage) {
        setAuthorized(true);
        setCheckingAuth(false);
        return;
      }

      try {
        const user = await getAdminUser();
        if (user) {
          setAuthorized(true);
        } else {
          router.push("/admin/login");
        }
      } catch (err) {
        console.error("Auth guard error:", err);
        router.push("/admin/login");
      } finally {
        setCheckingAuth(false);
      }
    }
    enforceAuth();
  }, [pathname, isLoginPage, router]);

  const handleLogout = async () => {
    if (confirm("Are you sure you want to sign out?")) {
      await logoutAdmin();
      window.location.href = "/admin/login";
    }
  };

  const menuItems = [
    { name: "Overview", href: "/admin", icon: LayoutDashboard },
    { name: "Products", href: "/admin/products", icon: ShoppingBag },
    { name: "Orders", href: "/admin/orders", icon: ClipboardList },
    { name: "Banners", href: "/admin/banners", icon: ImageIcon },
    { name: "Subscribers", href: "/admin/newsletter", icon: Mail },
  ];

  const categorySubItems = [
    { name: "Home Page Category Grids", tab: "grids", href: "/admin/categories?tab=grids" },
    { name: "Navbar Menu Categories", tab: "menu", href: "/admin/categories?tab=menu" },
    { name: "Sidebar Filters", tab: "filters", href: "/admin/categories?tab=filters" },
  ];

  const subMenuItems = [
    { name: "General Settings", tab: "general", href: "/admin/settings?tab=general" },
    { name: "SEO Settings", tab: "seo", href: "/admin/settings?tab=seo" },
    { name: "Integrations & Tags", tab: "integrations", href: "/admin/settings?tab=integrations" },
    { name: "Newsletter Setup", tab: "newsletter", href: "/admin/settings?tab=newsletter" },
  ];

  // If loading or checking auth, show spinner (unless it's the login page itself)
  if (checkingAuth && !isLoginPage) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5ab946]"></div>
      </div>
    );
  }

  // If checking has finished and user is not authorized, don't render layout (redirecting)
  if (!authorized && !isLoginPage) {
    return null;
  }

  // Bypasses the sidebar/headers if it's the login page
  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 flex flex-col md:flex-row font-sans">
      {/* MOBILE HEADER */}
      <header className="md:hidden bg-[#111827] border-b border-gray-800 px-4 py-3 flex items-center justify-between z-50">
        <div className="flex items-center gap-2">
          <span className="text-[#5ab946] font-black text-2xl italic">S</span>
          <span className="text-white text-sm font-bold tracking-wider">SDC ADMIN</span>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-gray-400 hover:text-white focus:outline-none"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* SIDEBAR (Desktop & Mobile Overlay) */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-[#111827] border-r border-gray-800 flex flex-col z-40 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen
        ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Sidebar Header */}
        <div className="p-5 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[#5ab946] font-black text-3xl italic">S</span>
            <div className="flex flex-col">
              <span className="text-white font-bold leading-none">SDC STORE</span>
              <span className="text-xs text-gray-400 font-medium mt-0.5">Control Panel</span>
            </div>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-150
                  ${isActive 
                    ? "bg-[#5ab946] text-white shadow-md shadow-[#5ab946]/10" 
                    : "text-gray-400 hover:bg-gray-800/60 hover:text-white"}
                `}
              >
                <item.icon size={20} />
                {item.name}
              </Link>
            );
          })}

          {/* Categories Collapsible Dropdown */}
          <div className="space-y-1">
            <button
              onClick={() => setCategoriesOpen(!categoriesOpen)}
              className={`
                flex items-center justify-between w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-150 cursor-pointer
                ${isCategoriesRoute
                  ? "bg-gray-800/50 text-[#5ab946]"
                  : "text-gray-400 hover:bg-gray-800/60 hover:text-white"}
              `}
            >
              <div className="flex items-center gap-3">
                <Grid size={20} />
                <span>Categories</span>
              </div>
              {categoriesMenuOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            
            {categoriesMenuOpen && (
              <div className="pl-3 space-y-0.5 mt-1 border-l border-gray-800/60 ml-7 animate-in slide-in-from-top-1 duration-150">
                {categorySubItems.map((subItem) => {
                  const isSubActive = isCategoriesRoute && activeCategoryTab === subItem.tab;
                  return (
                    <Link
                      key={subItem.name}
                      href={subItem.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`
                        flex items-center px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 whitespace-nowrap overflow-hidden text-ellipsis
                        ${isSubActive
                          ? "text-[#5ab946] bg-gray-800/40"
                          : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/20"}
                      `}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full mr-2 flex-shrink-0 ${isSubActive ? "bg-[#5ab946]" : "bg-gray-700"}`}></span>
                      {subItem.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Carousels Item */}
          <Link
            href="/admin/carousels"
            onClick={() => setMobileMenuOpen(false)}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-150
              ${pathname === "/admin/carousels"
                ? "bg-[#5ab946] text-white shadow-md shadow-[#5ab946]/10" 
                : "text-gray-400 hover:bg-gray-800/60 hover:text-white"}
            `}
          >
            <Sliders size={20} />
            Carousels
          </Link>

          {/* Settings Collapsible Dropdown */}
          <div className="space-y-1">
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className={`
                flex items-center justify-between w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-150
                ${isSettingsRoute
                  ? "bg-gray-800/50 text-[#5ab946]"
                  : "text-gray-400 hover:bg-gray-800/60 hover:text-white"}
              `}
            >
              <div className="flex items-center gap-3">
                <Settings size={20} />
                <span>Settings</span>
              </div>
              {settingsMenuOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            
            {settingsMenuOpen && (
              <div className="pl-3 space-y-0.5 mt-1 border-l border-gray-800/60 ml-7 animate-in slide-in-from-top-1 duration-150">
                {subMenuItems.map((subItem) => {
                  const isSubActive = isSettingsRoute && activeTab === subItem.tab;
                  return (
                    <Link
                      key={subItem.name}
                      href={subItem.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`
                        flex items-center px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 whitespace-nowrap overflow-hidden text-ellipsis
                        ${isSubActive
                          ? "text-[#5ab946] bg-gray-800/40"
                          : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/20"}
                      `}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full mr-2 flex-shrink-0 ${isSubActive ? "bg-[#5ab946]" : "bg-gray-700"}`}></span>
                      {subItem.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-800 space-y-2">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg text-sm transition-colors duration-150 font-semibold"
          >
            <LogOut size={16} />
            Sign Out
          </button>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white rounded-lg text-sm transition-colors duration-150"
          >
            <ArrowLeft size={16} />
            Back to Website
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-grow flex flex-col min-h-screen md:h-screen md:overflow-y-auto bg-[#0b0f19]">
        {/* Top Header Bar */}
        <header className="hidden md:flex bg-[#111827] border-b border-gray-800/80 px-8 py-4 items-center justify-between sticky top-0 z-30">
          <h1 className="text-lg font-semibold text-white">SDC Store Administration</h1>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 bg-gray-800 px-2.5 py-1 rounded-full border border-gray-700">
              Admin Portal
            </span>
          </div>
        </header>

        {/* Page Content wrapper */}
        <div className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5ab946]"></div>
      </div>
    }>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </Suspense>
  );
}
