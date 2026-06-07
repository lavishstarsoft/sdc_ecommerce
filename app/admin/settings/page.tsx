"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getSettings, saveSettings, Setting } from "@/lib/storeService";
import { isSupabaseConfigured } from "@/lib/supabase";
import { 
  Save, 
  Upload, 
  Globe, 
  Image as ImageIcon, 
  Settings as SettingsIcon,
  Check, 
  AlertCircle,
  Sparkles,
  BarChart2,
  Code2,
  Target,
  Mail
} from "lucide-react";

function AdminSettingsContent() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "general";

  const [siteName, setSiteName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState("");
  const [googleSearchConsoleId, setGoogleSearchConsoleId] = useState("");
  const [googleAdsId, setGoogleAdsId] = useState("");
  
  // Newsletter states
  const [newsletterTitle, setNewsletterTitle] = useState("");
  const [newsletterSubtitle, setNewsletterSubtitle] = useState("");
  const [newsletterPlaceholder, setNewsletterPlaceholder] = useState("");
  const [newsletterButtonText, setNewsletterButtonText] = useState("");
  const [newsletterUnsubscribe, setNewsletterUnsubscribe] = useState("");
  const [newsletterPrivacyText, setNewsletterPrivacyText] = useState("");
  
  // Status states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      try {
        if (isSupabaseConfigured()) {
          const res = await fetch("/api/settings", { cache: "no-store" });
          if (res.ok) {
            const data = await res.json();
            setSiteName(data.siteName);
            setLogoUrl(data.logoUrl || "");
            setMetaDescription(data.metaDescription || "");
            setGoogleAnalyticsId(data.googleAnalyticsId || "");
            setGoogleSearchConsoleId(data.googleSearchConsoleId || "");
            setGoogleAdsId(data.googleAdsId || "");
            setNewsletterTitle(data.newsletterTitle || "");
            setNewsletterSubtitle(data.newsletterSubtitle || "");
            setNewsletterPlaceholder(data.newsletterPlaceholder || "");
            setNewsletterButtonText(data.newsletterButtonText || "");
            setNewsletterUnsubscribe(data.newsletterUnsubscribe || "");
            setNewsletterPrivacyText(data.newsletterPrivacyText || "");
            return;
          }
        }
        const data = await getSettings();
        setSiteName(data.siteName);
        setLogoUrl(data.logoUrl || "");
        setMetaDescription(data.metaDescription || "");
        setGoogleAnalyticsId(data.googleAnalyticsId || "");
        setGoogleSearchConsoleId(data.googleSearchConsoleId || "");
        setGoogleAdsId(data.googleAdsId || "");
        setNewsletterTitle(data.newsletterTitle || "");
        setNewsletterSubtitle(data.newsletterSubtitle || "");
        setNewsletterPlaceholder(data.newsletterPlaceholder || "");
        setNewsletterButtonText(data.newsletterButtonText || "");
        setNewsletterUnsubscribe(data.newsletterUnsubscribe || "");
        setNewsletterPrivacyText(data.newsletterPrivacyText || "");
      } catch (err) {
        console.error("Failed to load settings:", err);
        setError("Failed to fetch settings from server.");
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setSuccess(null);
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload image");
      
      setLogoUrl(data.url);
      if (data.isMock) {
        setSuccess("Mock mode: uploaded image fallbacked to Picsum URL");
        setTimeout(() => setSuccess(null), 4000);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!siteName.trim()) {
      setError("Please provide a valid website name.");
      return;
    }

    setSubmitting(true);
    
    try {
      const payload = {
        siteName: siteName.trim(),
        logoUrl: logoUrl.trim() || undefined,
        metaDescription: metaDescription.trim() || undefined,
        googleAnalyticsId: googleAnalyticsId.trim() || undefined,
        googleSearchConsoleId: googleSearchConsoleId.trim() || undefined,
        googleAdsId: googleAdsId.trim() || undefined,
        newsletterTitle: newsletterTitle.trim() || undefined,
        newsletterSubtitle: newsletterSubtitle.trim() || undefined,
        newsletterPlaceholder: newsletterPlaceholder.trim() || undefined,
        newsletterButtonText: newsletterButtonText.trim() || undefined,
        newsletterUnsubscribe: newsletterUnsubscribe.trim() || undefined,
        newsletterPrivacyText: newsletterPrivacyText.trim() || undefined
      };

      if (isSupabaseConfigured()) {
        const res = await fetch("/api/settings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to update settings via API");
        }
      } else {
        await saveSettings(payload);
      }

      const successMessages: Record<string, string> = {
        general: "General settings saved successfully! Site name, logo, and branding are updated.",
        seo: "SEO settings saved successfully! Meta descriptions and search optimization are updated.",
        integrations: "Integration settings saved! Analytics and marketing tags are now updated.",
        newsletter: "Newsletter settings saved! Your newsletter section has been updated."
      };
      setSuccess(successMessages[activeTab] || "Settings updated successfully!");
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to update settings.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#5ab946]"></div>
      </div>
    );
  }

  // Tab metadata
  const tabInfo: Record<string, { title: string; description: string; icon: React.ReactNode }> = {
    general: {
      title: "General Settings",
      description: "Configure your store name, brand logo, and corporate identity across the storefront.",
      icon: <SettingsIcon className="text-[#5ab946]" size={24} />
    },
    seo: {
      title: "SEO Configuration",
      description: "Optimize your store for search engines with meta descriptions and structured data.",
      icon: <Globe className="text-blue-400" size={24} />
    },
    integrations: {
      title: "Integrations & Tags",
      description: "Connect Google Analytics, Search Console, and Ads conversion tracking to your store.",
      icon: <Code2 className="text-purple-400" size={24} />
    },
    newsletter: {
      title: "Newsletter Setup",
      description: "Customize the newsletter subscription section displayed in your website footer.",
      icon: <Mail className="text-orange-400" size={24} />
    }
  };

  const currentTab = tabInfo[activeTab] || tabInfo.general;

  return (
    <div className="space-y-6 w-full max-w-7xl">
      {/* Header Panel */}
      <div>
        <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
          {currentTab.icon}
          {currentTab.title}
        </h2>
        <p className="text-gray-400 text-sm mt-1">{currentTab.description}</p>
      </div>

      {/* Messages */}
      {success && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-4 rounded-xl flex items-start gap-3 text-sm animate-in fade-in slide-in-from-top-4 duration-200">
          <Check size={18} className="flex-shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-start gap-3 text-sm animate-in fade-in slide-in-from-top-4 duration-200">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* 2-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Form Details (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit}>
            
            {/* ═══════════════════════════════════════════ */}
            {/* GENERAL TAB */}
            {/* ═══════════════════════════════════════════ */}
            {activeTab === "general" && (
              <div className="bg-[#111827] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-6 border-b border-gray-800 bg-gray-900/20">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <SettingsIcon className="text-[#5ab946]" size={18} />
                    Storefront Identity
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Your store name and logo are used across headers, footers, and search results.</p>
                </div>

                <div className="p-6 space-y-6">
                  {/* Site Name Field */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Website Name / Brand Name</label>
                    <input
                      type="text"
                      required
                      value={siteName}
                      onChange={(e) => setSiteName(e.target.value)}
                      placeholder="e.g. Saidurga Computers"
                      className="w-full bg-gray-950/60 border border-gray-800 focus:border-[#5ab946] rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none transition-colors"
                    />
                    <p className="text-[11px] text-gray-500">This title controls the headers, search inputs, footers, and copyright markers across your site.</p>
                  </div>

                  {/* Logo Field */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Store Logo</label>
                    
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                      <label className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700/80 text-gray-200 px-4 py-2.5 rounded-xl border border-gray-700 cursor-pointer text-sm font-semibold transition-all">
                        <Upload size={16} />
                        {uploading ? "Uploading..." : "Upload Logo Image"}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploading}
                          className="hidden"
                        />
                      </label>
                      <span className="text-xs text-gray-500">or insert a custom image URL below:</span>
                    </div>

                    <input
                      type="text"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://example.com/logo.png"
                      className="w-full bg-gray-950/60 border border-gray-800 focus:border-[#5ab946] rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none transition-colors"
                    />
                  </div>

                  {/* Submit */}
                  <div className="flex justify-end pt-4 border-t border-gray-800 mt-6">
                    <button
                      type="submit"
                      disabled={submitting || uploading}
                      className="px-6 py-2.5 bg-[#5ab946] hover:bg-[#4ca03a] text-white text-sm font-semibold rounded-xl shadow-lg shadow-[#5ab946]/10 disabled:opacity-50 transition-all flex items-center justify-center gap-2 active:scale-98"
                    >
                      {submitting ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <Save size={16} />
                          <span>Save General Settings</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════ */}
            {/* SEO TAB */}
            {/* ═══════════════════════════════════════════ */}
            {activeTab === "seo" && (
              <div className="bg-[#111827] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-6 border-b border-gray-800 bg-gray-900/20">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Globe className="text-blue-400" size={18} />
                    Search Engine Optimization
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Control how your store appears in Google search results and social media shares.</p>
                </div>

                <div className="p-6 space-y-6">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Meta Description</label>
                    <textarea
                      value={metaDescription}
                      onChange={(e) => setMetaDescription(e.target.value)}
                      placeholder="e.g. Your trusted partner for all computer sales, services, and accessories..."
                      rows={4}
                      className="w-full bg-gray-950/60 border border-gray-800 focus:border-[#5ab946] rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none transition-colors resize-none"
                    />
                    <p className="text-[11px] text-gray-500">Provide a summary description of your business. This is displayed on Google search results pages (max 160 characters recommended).</p>
                  </div>

                  {/* Character count indicator */}
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          metaDescription.length > 160 ? 'bg-red-500' : metaDescription.length > 120 ? 'bg-yellow-500' : 'bg-[#5ab946]'
                        }`}
                        style={{ width: `${Math.min((metaDescription.length / 160) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <span className={`text-[11px] font-mono ${metaDescription.length > 160 ? 'text-red-400' : 'text-gray-500'}`}>
                      {metaDescription.length}/160
                    </span>
                  </div>

                  {/* Submit */}
                  <div className="flex justify-end pt-4 border-t border-gray-800 mt-6">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2.5 bg-[#5ab946] hover:bg-[#4ca03a] text-white text-sm font-semibold rounded-xl shadow-lg shadow-[#5ab946]/10 disabled:opacity-50 transition-all flex items-center justify-center gap-2 active:scale-98"
                    >
                      {submitting ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <Save size={16} />
                          <span>Save SEO Settings</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════ */}
            {/* INTEGRATIONS TAB */}
            {/* ═══════════════════════════════════════════ */}
            {activeTab === "integrations" && (
              <div className="bg-[#111827] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-6 border-b border-gray-800 bg-gray-900/20">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Code2 className="text-purple-400" size={18} />
                    Analytics & Third-Party Tags
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Connect your Google marketing and analytics tools to track store performance.</p>
                </div>

                <div className="p-6 space-y-6">
                  {/* Google Analytics ID */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <BarChart2 size={12} className="text-blue-400" />
                      Google Analytics ID
                    </label>
                    <input
                      type="text"
                      value={googleAnalyticsId}
                      onChange={(e) => setGoogleAnalyticsId(e.target.value)}
                      placeholder="e.g. G-XXXXXXXXXX"
                      className="w-full bg-gray-950/60 border border-gray-800 focus:border-[#5ab946] rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none transition-colors"
                    />
                    <p className="text-[11px] text-gray-500">Insert your Google Analytics Measurement ID (starts with G-).</p>
                  </div>

                  {/* Google Search Console ID */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Code2 size={12} className="text-yellow-400" />
                      Google Search Console ID
                    </label>
                    <input
                      type="text"
                      value={googleSearchConsoleId}
                      onChange={(e) => setGoogleSearchConsoleId(e.target.value)}
                      placeholder="e.g. site-verification code"
                      className="w-full bg-gray-950/60 border border-gray-800 focus:border-[#5ab946] rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none transition-colors"
                    />
                    <p className="text-[11px] text-gray-500">Insert HTML tag content for Google Search Console verification.</p>
                  </div>

                  {/* Google Ads ID */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Target size={12} className="text-red-400" />
                      Google Ads Conversion ID
                    </label>
                    <input
                      type="text"
                      value={googleAdsId}
                      onChange={(e) => setGoogleAdsId(e.target.value)}
                      placeholder="e.g. AW-XXXXXXXXXX"
                      className="w-full bg-gray-950/60 border border-gray-800 focus:border-[#5ab946] rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none transition-colors"
                    />
                    <p className="text-[11px] text-gray-500">Insert your Google Ads conversion / global site tag ID (starts with AW-).</p>
                  </div>

                  {/* Submit */}
                  <div className="flex justify-end pt-4 border-t border-gray-800 mt-6">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2.5 bg-[#5ab946] hover:bg-[#4ca03a] text-white text-sm font-semibold rounded-xl shadow-lg shadow-[#5ab946]/10 disabled:opacity-50 transition-all flex items-center justify-center gap-2 active:scale-98"
                    >
                      {submitting ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <Save size={16} />
                          <span>Save Integrations</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════ */}
            {/* NEWSLETTER TAB */}
            {/* ═══════════════════════════════════════════ */}
            {activeTab === "newsletter" && (
              <div className="bg-[#111827] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-6 border-b border-gray-800 bg-gray-900/20">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Mail className="text-orange-400" size={18} />
                    Newsletter Subscription Section
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Customize the newsletter CTA text, button labels, and privacy notices displayed in the footer.</p>
                </div>

                <div className="p-6 space-y-6">
                  {/* Title Field */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Newsletter Title</label>
                    <input
                      type="text"
                      value={newsletterTitle}
                      onChange={(e) => setNewsletterTitle(e.target.value)}
                      placeholder="e.g. Subscribe to our newsletter to get updates to our latest collections"
                      className="w-full bg-gray-950/60 border border-gray-800 focus:border-[#5ab946] rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none transition-colors"
                    />
                  </div>

                  {/* Subtitle Field */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Subtitle / Discount Offer Text</label>
                    <input
                      type="text"
                      value={newsletterSubtitle}
                      onChange={(e) => setNewsletterSubtitle(e.target.value)}
                      placeholder="e.g. Get 20% off on your first order just by subscribing to our newsletter"
                      className="w-full bg-gray-950/60 border border-gray-800 focus:border-[#5ab946] rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Placeholder Field */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Email Input Placeholder</label>
                      <input
                        type="text"
                        value={newsletterPlaceholder}
                        onChange={(e) => setNewsletterPlaceholder(e.target.value)}
                        placeholder="e.g. Enter your email"
                        className="w-full bg-gray-950/60 border border-gray-800 focus:border-[#5ab946] rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none transition-colors"
                      />
                    </div>

                    {/* Button Text Field */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Subscribe Button Text</label>
                      <input
                        type="text"
                        value={newsletterButtonText}
                        onChange={(e) => setNewsletterButtonText(e.target.value)}
                        placeholder="e.g. Subscribe"
                        className="w-full bg-gray-950/60 border border-gray-800 focus:border-[#5ab946] rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Unsubscribe Message Field */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Unsubscribe Helper Text</label>
                      <input
                        type="text"
                        value={newsletterUnsubscribe}
                        onChange={(e) => setNewsletterUnsubscribe(e.target.value)}
                        placeholder="e.g. You will be able to unsubscribe at any time."
                        className="w-full bg-gray-950/60 border border-gray-800 focus:border-[#5ab946] rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none transition-colors"
                      />
                    </div>

                    {/* Privacy Compliance Field */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Privacy Compliance Link Text</label>
                      <input
                        type="text"
                        value={newsletterPrivacyText}
                        onChange={(e) => setNewsletterPrivacyText(e.target.value)}
                        placeholder="e.g. Read our privacy policy here"
                        className="w-full bg-gray-950/60 border border-gray-800 focus:border-[#5ab946] rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Submit */}
                  <div className="flex justify-end pt-4 border-t border-gray-800 mt-6">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2.5 bg-[#5ab946] hover:bg-[#4ca03a] text-white text-sm font-semibold rounded-xl shadow-lg shadow-[#5ab946]/10 disabled:opacity-50 transition-all flex items-center justify-center gap-2 active:scale-98"
                    >
                      {submitting ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <Save size={16} />
                          <span>Save Newsletter Settings</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </form>
        </div>

        {/* Right Column: Context-Aware Sidebar Previews (1/3 width) */}
        <div className="space-y-6">
          <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 space-y-5 shadow-xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-3">
              <Sparkles className="text-yellow-400" size={18} />
              Live Preview
            </h3>
            
            {/* ── GENERAL TAB PREVIEWS ── */}
            {activeTab === "general" && (
              <>
                {/* Storefront Title Preview */}
                <div className="bg-gray-950/40 p-4 rounded-xl border border-gray-800 space-y-1.5">
                  <span className="text-[10px] text-gray-500 font-bold uppercase block">Storefront Title</span>
                  <div className="text-white text-base font-extrabold truncate">
                    {siteName || "Unnamed Store"}
                  </div>
                </div>

                {/* Logo Preview */}
                <div className="bg-gray-950/40 p-4 rounded-xl border border-gray-800 space-y-1.5 min-h-[90px] flex flex-col justify-between">
                  <span className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Logo Header Preview</span>
                  <div className="flex items-center justify-start h-10">
                    {logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logoUrl} alt="Store logo preview" className="h-full object-contain" />
                    ) : (
                      <div className="text-xs text-gray-500 italic flex items-center gap-1">
                        <ImageIcon size={14} />
                        No Logo (Text logo active)
                      </div>
                    )}
                  </div>
                </div>

                {/* Copyright Preview */}
                <div className="bg-gray-950/40 p-4 rounded-xl border border-gray-800 space-y-1.5">
                  <span className="text-[10px] text-gray-500 font-bold uppercase block">Copyright Footer Text</span>
                  <div className="text-xs text-gray-400 font-medium">
                    © Copyright by {siteName || "Unnamed Store"}. All rights reserved.
                  </div>
                </div>

                {/* Help Box */}
                <div className="p-4 bg-gray-900/60 border border-gray-800/80 rounded-xl text-xs text-gray-400 leading-relaxed space-y-2">
                  <p className="font-bold text-white uppercase tracking-wider text-[10px]">Theme Guidelines</p>
                  <p>When a custom logo image is provided, the website header and footer will automatically display your custom logo image. Clear the logo URL field to revert to the text-based initials styling.</p>
                </div>
              </>
            )}

            {/* ── SEO TAB PREVIEWS ── */}
            {activeTab === "seo" && (
              <>
                {/* Google Search Preview */}
                <div className="bg-gray-950/40 p-4 rounded-xl border border-gray-800 space-y-2">
                  <span className="text-[10px] text-gray-500 font-bold uppercase block">Google Search Preview</span>
                  <div className="bg-white rounded-lg p-3 space-y-1">
                    <div className="text-blue-700 text-sm font-medium truncate">{siteName || "Your Store"} - Official Website</div>
                    <div className="text-green-700 text-[11px] truncate">https://yourstore.com</div>
                    <div className="text-gray-600 text-[11px] line-clamp-2">
                      {metaDescription || "No description configured. Search engines will auto-generate a snippet from your page content."}
                    </div>
                  </div>
                </div>

                {/* Meta Description Preview */}
                <div className="bg-gray-950/40 p-4 rounded-xl border border-gray-800 space-y-1.5">
                  <span className="text-[10px] text-gray-500 font-bold uppercase block">Meta Description</span>
                  <div className="text-xs text-gray-400 font-medium line-clamp-3">
                    {metaDescription || "No custom description configured. Reverting to system defaults."}
                  </div>
                </div>

                {/* SEO Tips */}
                <div className="p-4 bg-gray-900/60 border border-gray-800/80 rounded-xl text-xs text-gray-400 leading-relaxed space-y-2">
                  <p className="font-bold text-white uppercase tracking-wider text-[10px]">SEO Best Practices</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Keep meta descriptions under 160 characters</li>
                    <li>Include your primary keywords naturally</li>
                    <li>Write a unique description for your homepage</li>
                    <li>Make it compelling – it&apos;s your search result ad copy</li>
                  </ul>
                </div>
              </>
            )}

            {/* ── INTEGRATIONS TAB PREVIEWS ── */}
            {activeTab === "integrations" && (
              <>
                {/* Active Marketing Integrations */}
                <div className="bg-gray-950/40 p-4 rounded-xl border border-gray-800 space-y-3">
                  <span className="text-[10px] text-gray-500 font-bold uppercase block">Integration Status</span>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs bg-gray-900/40 p-3 rounded-lg border border-gray-800/50">
                      <span className="text-gray-400 flex items-center gap-2">
                        <BarChart2 size={14} className="text-blue-400" />
                        Google Analytics
                      </span>
                      <span className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${
                        googleAnalyticsId ? 'bg-green-500/20 text-green-400' : 'bg-gray-700/50 text-gray-500'
                      }`}>
                        {googleAnalyticsId ? "Connected" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs bg-gray-900/40 p-3 rounded-lg border border-gray-800/50">
                      <span className="text-gray-400 flex items-center gap-2">
                        <Code2 size={14} className="text-yellow-400" />
                        Search Console
                      </span>
                      <span className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${
                        googleSearchConsoleId ? 'bg-green-500/20 text-green-400' : 'bg-gray-700/50 text-gray-500'
                      }`}>
                        {googleSearchConsoleId ? "Verified" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs bg-gray-900/40 p-3 rounded-lg border border-gray-800/50">
                      <span className="text-gray-400 flex items-center gap-2">
                        <Target size={14} className="text-red-400" />
                        Google Ads
                      </span>
                      <span className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${
                        googleAdsId ? 'bg-green-500/20 text-green-400' : 'bg-gray-700/50 text-gray-500'
                      }`}>
                        {googleAdsId ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Integration Help */}
                <div className="p-4 bg-gray-900/60 border border-gray-800/80 rounded-xl text-xs text-gray-400 leading-relaxed space-y-2">
                  <p className="font-bold text-white uppercase tracking-wider text-[10px]">Where to Find IDs</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li><strong className="text-gray-300">Analytics:</strong> Google Analytics → Admin → Data Streams</li>
                    <li><strong className="text-gray-300">Search Console:</strong> Settings → Ownership Verification</li>
                    <li><strong className="text-gray-300">Ads:</strong> Google Ads → Tools → Conversions</li>
                  </ul>
                </div>
              </>
            )}

            {/* ── NEWSLETTER TAB PREVIEWS ── */}
            {activeTab === "newsletter" && (
              <>
                {/* Newsletter Live Preview */}
                <div className="bg-gray-950/40 p-4 rounded-xl border border-gray-800 space-y-2 text-xs">
                  <span className="text-[10px] text-gray-500 font-bold uppercase block">Footer Newsletter Preview</span>
                  <div className="space-y-2 bg-gray-900/60 p-3 rounded-lg border border-gray-800/80">
                    <span className="font-bold text-white block text-sm leading-snug">{newsletterTitle || "Subscribe to our newsletter..."}</span>
                    <span className="text-[11px] text-gray-400 block">{newsletterSubtitle || "Get 20% off..."}</span>
                    <div className="flex gap-1.5 mt-2">
                      <div className="bg-gray-950 border border-gray-800 px-2.5 py-1.5 text-[10px] text-gray-600 rounded-lg flex-1 truncate">
                        {newsletterPlaceholder || "Enter your email"}
                      </div>
                      <div className="bg-[#5ab946] text-white font-bold px-3 py-1.5 text-[10px] rounded-lg select-none truncate">
                        {newsletterButtonText || "Subscribe"}
                      </div>
                    </div>
                    <div className="text-[9px] text-gray-600 mt-1.5 space-y-0.5">
                      <div>{newsletterUnsubscribe || "You will be able to unsubscribe at any time."}</div>
                      <div className="text-[#5ab946]/60 underline">{newsletterPrivacyText || "Read our privacy policy here"}</div>
                    </div>
                  </div>
                </div>

                {/* Newsletter Tips */}
                <div className="p-4 bg-gray-900/60 border border-gray-800/80 rounded-xl text-xs text-gray-400 leading-relaxed space-y-2">
                  <p className="font-bold text-white uppercase tracking-wider text-[10px]">Newsletter Tips</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Use an attractive discount offer to boost sign-ups</li>
                    <li>Keep the title short and action-oriented</li>
                    <li>Always include an unsubscribe notice for trust</li>
                    <li>Link to your privacy policy for GDPR compliance</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default function AdminSettings() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#5ab946]"></div>
      </div>
    }>
      <AdminSettingsContent />
    </Suspense>
  );
}
