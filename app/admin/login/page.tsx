"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginAdmin, getAdminUser } from "@/lib/authService";
import { isSupabaseConfigured } from "@/lib/supabase";
import { Lock, Mail, ShieldAlert, CheckCircle, ArrowRight, Eye, EyeOff } from "lucide-react";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Status states
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSupabaseActive, setIsSupabaseActive] = useState(false);

  useEffect(() => {
    // Check if Supabase env is active
    setIsSupabaseActive(isSupabaseConfigured());

    // Check if already authenticated, if yes, redirect to admin overview
    async function checkSession() {
      try {
        const user = await getAdminUser();
        if (user) {
          router.push("/admin");
        }
      } catch (err) {
        console.error("Session check error:", err);
      } finally {
        setCheckingSession(false);
      }
    }
    checkSession();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    
    try {
      const result = await loginAdmin(email, password);
      if (result.success) {
        // Redirect to admin panel by forcing a full page reload/hydration to reset the layout guard
        window.location.href = "/admin";
      } else {
        setError(result.error || "Authentication failed.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5ab946]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background radial gradients for rich tech aesthetics */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#5ab946]/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#e61923]/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-[#111827] border border-gray-800/80 rounded-2xl overflow-hidden shadow-2xl relative z-10 p-8 space-y-6">
        
        {/* Brand Logo Header */}
        <div className="flex flex-col items-center text-center space-y-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-xl">
            <div className="flex items-end">
              <span className="text-[#5ab946] font-black text-3xl italic leading-none drop-shadow-md">S</span>
              <span className="text-[#5ab946] font-extrabold text-xs leading-none mb-0.5 -ml-0.5">DC</span>
            </div>
            <div className="flex flex-col justify-center items-start text-left">
              <div className="bg-[#e61923] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none tracking-wider">
                SAIDURGA
              </div>
              <div className="text-white text-[7px] font-black tracking-[0.15em] leading-none mt-1 ml-0.5">
                COMPUTERS
              </div>
            </div>
          </div>
          <h2 className="text-xl font-black tracking-tight text-white mt-4">Administrator Login</h2>
          <p className="text-gray-400 text-xs">Access the store management dashboard control panel.</p>
        </div>

        {/* Status Indicators */}
        {!isSupabaseActive && (
          <div className="p-3.5 bg-gray-900/50 border border-gray-800/60 rounded-xl space-y-1.5 text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-500 animate-pulse"></div>
              <span className="font-semibold text-white">
                Local Mock Mode Active
              </span>
            </div>
            <p className="leading-relaxed text-[11px]">
              Credentials fallback is active. Enter the default developer credentials:
            </p>
            <div className="mt-2 bg-gray-950 p-2 rounded-lg border border-gray-800 font-mono text-[10px] space-y-1 text-gray-300">
              <div>Email: <span className="text-[#5ab946]">admin@sdc.com</span></div>
              <div>Password: <span className="text-[#5ab946]">admin123</span></div>
            </div>
          </div>
        )}

        {/* Alert block */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3.5 rounded-xl flex items-start gap-2.5 text-xs">
            <ShieldAlert size={16} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@sdc.com"
                className="w-full pl-11 pr-4 py-2.5 bg-gray-950/60 border border-gray-800 focus:border-[#5ab946] rounded-xl text-sm text-white placeholder:text-gray-600 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-10 py-2.5 bg-gray-950/60 border border-gray-800 focus:border-[#5ab946] rounded-xl text-sm text-white placeholder:text-gray-600 outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-[#5ab946] hover:bg-[#4ca03a] text-white py-2.5 rounded-xl font-semibold shadow-lg shadow-[#5ab946]/10 transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
        
        {/* Footer Link */}
        <div className="text-center pt-2">
          <a href="/" className="text-xs text-gray-500 hover:text-[#5ab946] transition-colors">
            Return to storefront
          </a>
        </div>

      </div>
    </div>
  );
}
