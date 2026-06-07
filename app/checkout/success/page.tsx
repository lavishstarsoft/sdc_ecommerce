"use client";

import React, { useEffect, useState, Suspense } from "react";
import { CheckCircle2, ArrowRight, ShoppingBag, Truck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";

function OrderSuccessPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const authRes = await fetch("/api/auth/me");
        if (authRes.ok) {
          const authData = await authRes.json();
          if (authData.authenticated && authData.user) {
            setUser(authData.user);
          } else {
            router.push("/login");
          }
        } else {
          router.push("/login");
        }
      } catch (err) {
        console.error("Auth check error:", err);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [router]);

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

  // Delivery estimate date computation
  const deliverDate = new Date();
  deliverDate.setDate(deliverDate.getDate() + 3);
  const dateStr = deliverDate.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="min-h-screen bg-[#e3e6e6] flex flex-col font-sans mb-16 md:mb-0">
      <Navbar />

      <main className="flex-grow w-full max-w-[600px] mx-auto p-4 sm:p-8 flex flex-col justify-center items-center">
        <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-sm border border-gray-200/50 w-full text-center space-y-6">
          <div className="flex justify-center">
            <div className="bg-green-50 p-4 rounded-full border border-green-100 flex items-center justify-center">
              <CheckCircle2 size={54} className="text-[#5ab946] animate-bounce" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Order Placed Successfully!</h1>
            <p className="text-gray-500 text-xs sm:text-sm font-semibold">
              Thank you for shopping with Saidurga Computers. Your order details are confirmed.
            </p>
          </div>

          {orderId && (
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-1">
              <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider block">Order Reference ID</span>
              <span className="text-xs font-bold text-gray-800 font-mono block select-all">{orderId}</span>
            </div>
          )}

          <div className="bg-[#5ab946]/5 rounded-2xl p-4 border border-[#5ab946]/10 flex gap-3 text-left">
            <Truck size={24} className="text-[#5ab946] flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="text-[10px] text-[#5ab946] font-black uppercase tracking-wider block">Estimated Delivery</span>
              <span className="text-xs font-extrabold text-gray-800 block">Deliver by {dateStr}</span>
              <span className="text-[10px] text-gray-500 font-medium block">Free delivery tracking is enabled for this order.</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => router.push("/orders")}
              className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <ShoppingBag size={14} /> View History
            </button>
            <button
              onClick={() => router.push("/")}
              className="flex-1 bg-gradient-to-r from-[#5ab946] to-[#49a836] hover:from-[#4ba03a] hover:to-[#3e892e] text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(90,185,70,0.2)]"
            >
              Continue Shopping <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#e3e6e6] flex flex-col font-sans mb-16 md:mb-0">
        <Navbar />
        <div className="flex-grow flex items-center justify-center py-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#5ab946]"></div>
        </div>
        <BottomNav />
      </div>
    }>
      <OrderSuccessPageContent />
    </Suspense>
  );
}
