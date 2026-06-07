"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, ArrowLeft, ShieldCheck, HelpCircle } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

function ValidationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("Missing Order ID parameter.");
      setLoading(false);
      return;
    }

    async function verifyLabel() {
      try {
        const res = await fetch(`/api/orders/validate?id=${id}`);
        const data = await res.json();
        setResult(data);
      } catch (err: any) {
        console.error(err);
        setError("Failed to connect to the verification server.");
      } finally {
        setLoading(false);
      }
    }

    verifyLabel();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-12">
        <Loader2 className="animate-spin text-[#5ab946] w-12 h-12" />
        <p className="text-sm text-gray-500 font-semibold">Verifying Shipping Label Authenticity...</p>
      </div>
    );
  }

  if (error || (result && result.error)) {
    return (
      <div className="text-center space-y-5 py-6">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto border border-red-100 shadow-md">
          <XCircle size={32} />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-black text-gray-900 uppercase tracking-wider">Verification Error</h2>
          <p className="text-xs text-gray-500 leading-relaxed font-semibold max-w-sm mx-auto">
            {error || result?.error || "We could not find an active shipment matching this code."}
          </p>
        </div>
        <div className="pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#5ab946] hover:bg-[#4ca03a] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95"
          >
            <ArrowLeft size={14} /> Back to SDC Store
          </Link>
        </div>
      </div>
    );
  }

  const isValid = result?.valid;

  return (
    <div className="space-y-6">
      {isValid ? (
        <div className="text-center space-y-5 py-4">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-full bg-green-500/10 animate-ping duration-1000" />
            <div className="relative w-20 h-20 bg-green-50 text-[#5ab946] rounded-full flex items-center justify-center border border-green-100 shadow-md">
              <CheckCircle2 size={40} className="stroke-[2.5]" />
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-black text-green-600 uppercase tracking-wider">
              {result.status === 'SHIPPED' || result.status === 'DELIVERED'
                ? "Already Shipped"
                : "Verification Valid"}
            </h2>
            <p className="text-xs text-gray-400 font-semibold">
              {result.status === 'SHIPPED' || result.status === 'DELIVERED'
                ? "Authentic SDC Package (Dispatched)"
                : "Authorized Shipment & SDC Packing Slip"}
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-150 rounded-2xl p-4 text-left space-y-3 mt-6 text-xs max-w-sm mx-auto">
            <div className="flex justify-between border-b border-gray-200/80 pb-2">
              <span className="text-gray-400 font-semibold">Order Reference:</span>
              <span className="font-mono font-bold text-gray-900">#{result.orderId.substring(0, 8)}...</span>
            </div>
            <div className="flex justify-between border-b border-gray-200/80 pb-2">
              <span className="text-gray-400 font-semibold">Shipment Status:</span>
              <span className={`font-black text-[9px] px-2 py-0.5 rounded-sm uppercase tracking-wider ${
                result.status === 'SHIPPED' || result.status === 'DELIVERED'
                  ? 'bg-green-50 border border-green-100 text-green-600'
                  : 'bg-blue-50 border border-blue-100 text-blue-600'
              }`}>
                {result.status}
              </span>
            </div>
            <div className="flex justify-between border-b border-gray-200/80 pb-2">
              <span className="text-gray-400 font-semibold">Recipient:</span>
              <span className="font-bold text-gray-900">{result.recipient}</span>
            </div>
            <div className="flex justify-between pb-1">
              <span className="text-gray-400 font-semibold">Destination:</span>
              <span className="font-bold text-gray-900 text-right">{result.destination}</span>
            </div>
          </div>
          
          <div className="pt-2 text-[10px] text-gray-400 font-semibold leading-relaxed max-w-xs mx-auto">
            {result.status === 'SHIPPED' || result.status === 'DELIVERED'
              ? "🛡️ This QR code validation verifies that this shipping label belongs to a genuine order from Saidurga Computers which has already been shipped."
              : "🛡️ This QR code validation verifies that this shipping label belongs to an active, unfulfilled order at Saidurga Computers."}
          </div>
        </div>
      ) : (
        <div className="text-center space-y-5 py-4">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto border border-red-100 shadow-md">
            <XCircle size={40} className="stroke-[2.5]" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-black text-red-500 uppercase tracking-wider">
              Verification Failed
            </h2>
            <p className="text-xs text-gray-400 font-semibold">
              Label Inactive or Outdated
            </p>
          </div>

          <div className="bg-red-50/50 border border-red-100 rounded-2xl p-4 text-left space-y-3 mt-6 text-xs max-w-sm mx-auto text-red-700">
            <p className="font-semibold text-center leading-relaxed">
              {result.reason || "This shipping label has already been processed and is no longer active."}
            </p>
            {result.orderId && (
              <div className="flex justify-between border-t border-red-100 pt-2.5 text-red-500 text-[10px] font-mono">
                <span>Ref: #{result.orderId.substring(0, 8)}...</span>
                <span>Status: {result.status}</span>
              </div>
            )}
          </div>
          
          <div className="pt-2 text-[10px] text-gray-400 font-semibold leading-relaxed max-w-xs mx-auto">
            ⚠️ Scans on this label are disabled because the order has already been dispatched/shipped or cancelled.
          </div>
        </div>
      )}

      <div className="pt-4 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#5ab946] hover:bg-[#4ca03a] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95"
        >
          <ArrowLeft size={14} /> Back to Homepage
        </Link>
      </div>
    </div>
  );
}

export default function OrderValidationPage() {
  return (
    <div className="min-h-screen bg-[#e3e6e6] flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-200 flex flex-col space-y-6">
        <div className="flex flex-col items-center border-b border-gray-150 pb-5">
          <span className="text-[#5ab946] font-black text-3xl italic tracking-tighter">SDC STORE</span>
          <span className="text-[10px] font-black tracking-[0.2em] text-gray-400 uppercase mt-1">Shipping Slip Authentication</span>
        </div>

        <Suspense fallback={
          <div className="flex flex-col items-center justify-center space-y-4 py-12">
            <Loader2 className="animate-spin text-[#5ab946] w-12 h-12" />
            <p className="text-sm text-gray-500 font-semibold">Loading verification details...</p>
          </div>
        }>
          <ValidationContent />
        </Suspense>
      </div>
    </div>
  );
}
