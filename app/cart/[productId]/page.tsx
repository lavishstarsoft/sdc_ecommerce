"use client";

import React, { useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { Loader2 } from "lucide-react";

export default function ProductCartLinkPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const productId = params.productId as string;
  const quantity = Math.max(1, Math.min(10, Number(searchParams.get("qty") || "1") || 1));

  useEffect(() => {
    if (!productId) return;

    let isMounted = true;

    const run = async () => {
      const authRes = await fetch("/api/auth/me");
      if (!authRes.ok) {
        if (isMounted) {
          router.push(`/login?redirect=/cart/${productId}`);
        }
        return;
      }

      const authData = await authRes.json();
      if (!authData.authenticated || !authData.user) {
        if (isMounted) {
          router.push(`/login?redirect=/cart/${productId}`);
        }
        return;
      }

      const cartRes = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity, action: "add" }),
      });

      if (cartRes.ok && isMounted) {
        window.dispatchEvent(new Event("cart-updated"));
        router.push("/cart");
      }
    };

    void run().catch((err) => {
      console.error("Failed to open product cart link:", err);
      if (isMounted) {
        router.push("/cart");
      }
    });

    return () => {
      isMounted = false;
    };
  }, [productId, router]);

  return (
    <div className="min-h-screen bg-[#e3e6e6] flex flex-col font-sans mb-16 md:mb-0">
      <Navbar />
      <main className="flex-grow flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-[#5ab946]" size={36} />
          <p className="text-gray-600 font-medium text-sm">Opening cart...</p>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
