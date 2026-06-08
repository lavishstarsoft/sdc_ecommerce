'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Mail, Phone, Facebook, Twitter, Instagram, Linkedin, Globe } from 'lucide-react';
import { useStoreSettings } from '@/components/StoreSettingsProvider';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const settings = useStoreSettings({
    id: 'default',
    siteName: 'Saidurga Computers',
    logoUrl: '',
  });

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

  const handleSubscribe = async () => {
    if (!email || !email.includes('@')) {
      setStatus('error');
      setMessage('Please enter a valid email address');
      return;
    }
    
    setStatus('loading');
    setMessage('');
    
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setStatus('success');
        setMessage(data.message || 'Subscribed successfully!');
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to subscribe');
      }
    } catch (err) {
      setStatus('error');
      setMessage('An error occurred. Please try again later.');
    }
  };

  return (
    <footer className="w-full mt-16 font-sans relative">
      
      {/* Floating Newsletter Section (Normal flow with negative margin) */}
      <div className="relative z-20 w-[92%] max-w-6xl mx-auto -mb-32 md:-mb-24 lg:-mb-24">
        <div className="bg-[#5ab946] bg-gradient-to-br from-[#5ab946] to-[#429530] rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row items-center justify-between p-8 md:p-12 gap-8 relative">
          
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-5 pointer-events-none blur-2xl"></div>
          <div className="absolute bottom-0 left-10 -mb-16 w-32 h-32 rounded-full bg-white opacity-10 pointer-events-none blur-xl"></div>

          {/* Left Side: 3D Image / Graphic */}
          <div className="hidden md:flex w-1/3 justify-center relative z-10">
            <div className="relative w-48 h-48 lg:w-56 lg:h-56">
              <Image 
                src="https://picsum.photos/seed/tech-devices/400/400" 
                alt="Latest Collections" 
                fill 
                className="object-cover rounded-xl shadow-lg border-2 border-white/20"
                referrerPolicy="no-referrer"
              />
              {/* Fake sparkles */}
              <div className="absolute -top-4 -right-4 text-white text-2xl">✨</div>
              <div className="absolute bottom-10 -left-6 text-white text-xl">✨</div>
            </div>
          </div>

          {/* Right Side: Content & Form */}
          <div className="w-full md:w-2/3 text-white z-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              {settings.newsletterTitle || "Subscribe to our newsletter to get updates to our latest collections"}
            </h2>
            <p className="mb-6 text-white/90 text-sm md:text-base">
              {settings.newsletterSubtitle || "Get 20% off on your first order just by subscribing to our newsletter"}
            </p>
            
            <div className="flex bg-white/20 p-1.5 rounded-full backdrop-blur-md max-w-md border border-white/30 focus-within:bg-white/30 transition-colors">
              <div className="flex items-center pl-3 text-white/90">
                <Mail size={20} />
              </div>
              <input 
                type="email" 
                placeholder={settings.newsletterPlaceholder || "Enter your email"} 
                className="flex-1 bg-transparent px-3 py-2 text-white placeholder:text-white/80 outline-none text-sm md:text-base w-full disabled:opacity-50" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()}
                disabled={status === 'loading'}
              />
              <button 
                className="bg-white text-[#5ab946] font-bold px-4 md:px-6 py-2 rounded-full hover:bg-gray-50 transition-colors text-sm md:text-base disabled:opacity-50 flex items-center justify-center min-w-[100px]"
                onClick={handleSubscribe}
                disabled={status === 'loading'}
              >
                {status === 'loading' ? '...' : (settings.newsletterButtonText || "Subscribe")}
              </button>
            </div>
            
            {message && (
              <p className={`mt-3 text-sm font-medium ${status === 'success' ? 'text-green-100' : 'text-red-200'}`}>
                {message}
              </p>
            )}
            
            <p className="mt-4 text-xs text-white/80">
              {settings.newsletterUnsubscribe || "You will be able to unsubscribe at any time."}<br/>
              {settings.newsletterPrivacyText ? (
                <span>
                  {settings.newsletterPrivacyText.endsWith("here") ? (
                    <>
                      {settings.newsletterPrivacyText.slice(0, -4)}
                      <span className="underline cursor-pointer hover:text-white">here</span>
                    </>
                  ) : (
                    <span className="underline cursor-pointer hover:text-white">{settings.newsletterPrivacyText}</span>
                  )}
                </span>
              ) : (
                <>
                  Read our privacy policy <span className="underline cursor-pointer hover:text-white">here</span>
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Main Footer Container */}
      <div className="bg-white pt-40 md:pt-36 pb-6 px-6 md:px-12 w-full text-gray-800 shadow-[0_-10px_20px_rgba(0,0,0,0.02)] relative z-10">
        <div className="max-w-7xl mx-auto">
          
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 lg:gap-8 mb-16">
            
            {/* Brand / Logo Section */}
            <div className="lg:col-span-2 pr-0 md:pr-10">
              {/* Logo */}
              <div onClick={() => window.location.href = "/"} className="flex items-center gap-1.5 mb-6 cursor-pointer">
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} alt={settings.siteName} className="h-10 max-w-[200px] object-contain" />
                ) : (
                  <>
                    <div className="flex items-end">
                      <span className="text-[#5ab946] font-black text-3xl leading-none italic">
                        {logoDetails.bigInitial}
                      </span>
                      <span className="text-[#5ab946] font-extrabold text-sm leading-none mb-0.5 -ml-0.5">
                        {logoDetails.smallInitials}
                      </span>
                    </div>
                    <div className="flex flex-col justify-center items-start mt-1">
                      <div className="bg-[#e61923] text-white text-[11px] font-black px-2 py-0.5 rounded-full leading-none tracking-wider">
                        {logoDetails.word1}
                      </div>
                      {logoDetails.word2 && (
                        <div className="text-black text-[9px] font-black tracking-[0.14em] leading-none mt-1 ml-1">
                          {logoDetails.word2}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
              
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Your trusted partner for all computer sales, services, and accessories. 
                Providing premium tech solutions with dedicated support for over a decade.
              </p>
              
              <div className="flex items-center gap-4 text-gray-600">
                <button className="hover:text-[#5ab946] transition-colors"><Facebook size={20} strokeWidth={1.5} /></button>
                <button className="hover:text-[#5ab946] transition-colors"><Twitter size={20} strokeWidth={1.5} /></button>
                <button className="hover:text-[#5ab946] transition-colors"><Instagram size={20} strokeWidth={1.5} /></button>
                <button className="hover:text-[#5ab946] transition-colors"><Linkedin size={20} strokeWidth={1.5} /></button>
                <button className="hover:text-[#5ab946] transition-colors"><Globe size={20} strokeWidth={1.5} /></button>
              </div>
            </div>

            {/* Links Columns */}
            <div>
              <h3 className="font-bold text-gray-900 mb-4">Company</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="hover:text-[#5ab946] cursor-pointer">About Us</li>
                <li className="hover:text-[#5ab946] cursor-pointer">Services</li>
                <li className="hover:text-[#5ab946] cursor-pointer">Community</li>
                <li className="hover:text-[#5ab946] cursor-pointer">Testimonial</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-4">Support</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="hover:text-[#5ab946] cursor-pointer">Help Center</li>
                <li className="hover:text-[#5ab946] cursor-pointer">Tweet @ Us</li>
                <li className="hover:text-[#5ab946] cursor-pointer">Service Request</li>
                <li className="hover:text-[#5ab946] cursor-pointer">Feedback</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-4">Links</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="hover:text-[#5ab946] cursor-pointer">Laptops</li>
                <li className="hover:text-[#5ab946] cursor-pointer">Desktop PCs</li>
                <li className="hover:text-[#5ab946] cursor-pointer">Accessories</li>
                <li className="hover:text-[#5ab946] cursor-pointer">Deals & Offers</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-4">Contact Us</h3>
              <ul className="space-y-4 text-sm text-gray-600">
                <li className="flex items-center gap-3 hover:text-[#5ab946] cursor-pointer">
                  <Phone size={18} className="text-[#5ab946]" />
                  <span>(91) 98765 4321 54</span>
                </li>
                <li className="flex items-center gap-3 hover:text-[#5ab946] cursor-pointer">
                  <Mail size={18} className="text-[#5ab946]" />
                  <span>{`support@${settings.siteName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`}</span>
                </li>
              </ul>
            </div>

          </div>

          {/* Copyright Bottom Bar */}
          <div className="border-t border-gray-200 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
            <p>© Copyright by {settings.siteName}. All rights reserved.</p>
            <div className="flex gap-6">
              <span className="hover:text-[#5ab946] cursor-pointer">Privacy Policy</span>
              <span className="hover:text-[#5ab946] cursor-pointer">Terms of Use</span>
              <span className="hover:text-[#5ab946] cursor-pointer">Legal</span>
              <span className="hover:text-[#5ab946] cursor-pointer">Site Map</span>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}

