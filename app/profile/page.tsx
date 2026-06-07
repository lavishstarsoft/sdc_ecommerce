"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import { 
  User, Mail, Phone, MapPin, ShoppingBag, 
  Trash2, Plus, LogOut, ArrowLeft, ArrowRight, Loader2, 
  CheckCircle2, AlertTriangle, Truck, Eye, ShieldCheck, Calendar 
} from "lucide-react";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", 
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", 
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", 
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", 
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

interface Address {
  id: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  landmark: string | null;
  type: string;
  isDefault: boolean;
}

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    title: string;
    imageUrl: string;
  };
}

interface Order {
  id: string;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  address: {
    name: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  items: OrderItem[];
  shippingLink?: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; email: string; phone: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"settings" | "addresses" | "orders">("settings");

  // Edit Profile States
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");

  // Address States
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formFlat, setFormFlat] = useState("");
  const [formArea, setFormArea] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formState, setFormState] = useState("");
  const [formPincode, setFormPincode] = useState("");
  const [formLandmark, setFormLandmark] = useState("");
  const [formCountry, setFormCountry] = useState("India");
  const [formType, setFormType] = useState("Home");
  const [formIsDefault, setFormIsDefault] = useState(false);
  const [addressError, setAddressError] = useState("");

  // Address Delete Confirm Modal States
  const [addressToDelete, setAddressToDelete] = useState<string | null>(null);
  const [isDeletingAddress, setIsDeletingAddress] = useState(false);

  // Order States
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam === "settings" || tabParam === "addresses" || tabParam === "orders") {
        setActiveTab(tabParam);
      }
    }
  }, []);

  const handleTabChange = (tab: "settings" | "addresses" | "orders") => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.history.pushState({}, "", url.toString());
    }
  };

  useEffect(() => {
    async function loadProfileData() {
      try {
        const authRes = await fetch("/api/auth/me");
        if (authRes.ok) {
          const authData = await authRes.json();
          if (authData.authenticated && authData.user) {
            // Fetch complete profile from database
            const profileRes = await fetch("/api/profile");
            if (profileRes.ok) {
              const profileData = await profileRes.json();
              setCurrentUser(profileData);
              setEditName(profileData.name || "");
              setEditPhone(profileData.phone || "");
            }

            // Fetch addresses
            const addrRes = await fetch("/api/addresses");
            if (addrRes.ok) {
              const addrData = await addrRes.json();
              setAddresses(addrData);
            }

            // Fetch orders
            const ordersRes = await fetch("/api/orders");
            if (ordersRes.ok) {
              const ordersData = await ordersRes.json();
              setOrders(ordersData);
            }
          } else {
            router.push("/login?redirect=/profile");
          }
        } else {
          router.push("/login?redirect=/profile");
        }
      } catch (err) {
        console.error("Profile page load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadProfileData();
  }, [router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess("");
    setUpdatingProfile(true);

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          phone: editPhone
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setCurrentUser(updated);
        setProfileSuccess("Profile updated successfully!");
        setTimeout(() => setProfileSuccess(""), 4000);
      } else {
        alert("Failed to update profile.");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong updating profile.");
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressError("");

    if (!formName.trim() || !formPhone.trim() || !formFlat.trim() || !formArea.trim() || !formCity.trim() || !formState.trim() || !formPincode.trim()) {
      setAddressError("Please fill out all required fields.");
      return;
    }

    const streetCombined = `${formFlat.trim()}\n${formArea.trim()}`;

    try {
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          phone: formPhone,
          street: streetCombined,
          city: formCity,
          state: formState,
          pincode: formPincode,
          landmark: formLandmark,
          country: formCountry,
          type: formType,
          isDefault: formIsDefault
        })
      });

      if (res.ok) {
        const newAddr = await res.json();
        setAddresses((prev) => [newAddr, ...prev.map(a => formIsDefault ? { ...a, isDefault: false } : a)]);
        
        // Reset form
        setFormName("");
        setFormPhone("");
        setFormFlat("");
        setFormArea("");
        setFormCity("");
        setFormState("");
        setFormPincode("");
        setFormLandmark("");
        setFormCountry("India");
        setFormType("Home");
        setFormIsDefault(false);
        setShowAddressForm(false);
      } else {
        const errData = await res.json();
        setAddressError(errData.error || "Failed to create address.");
      }
    } catch (err) {
      console.error(err);
      setAddressError("An error occurred. Please try again.");
    }
  };

  const confirmDeleteAddress = async () => {
    if (!addressToDelete) return;
    setIsDeletingAddress(true);
    try {
      const res = await fetch(`/api/addresses?id=${addressToDelete}`, {
        method: "DELETE"
      });

      if (res.ok) {
        const updated = await res.json();
        setAddresses(updated);
        setAddressToDelete(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeletingAddress(false);
    }
  };

  const toggleExpandOrder = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to logout:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col font-sans mb-16 md:mb-0">
        <Navbar />
        <div className="flex-grow flex items-center justify-center py-32">
          <Loader2 className="animate-spin text-[#5ab946] w-10 h-10" />
        </div>
        <Footer />
        <BottomNav />
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans mb-16 md:mb-0">
      <Navbar />

      <main className="flex-grow w-full max-w-[1200px] mx-auto p-4 sm:p-6 relative">
        {/* Glow decoration */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#5ab946] opacity-[0.02] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#e61923] opacity-[0.02] rounded-full blur-3xl pointer-events-none" />

        {/* Back Navigation */}
        <button 
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors cursor-pointer text-xs font-black uppercase tracking-wider"
        >
          <ArrowLeft size={14} /> Back to Store
        </button>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Profile Sidebar Info Card */}
          <div className="w-full lg:w-[280px] flex-shrink-0 bg-white border border-gray-200 rounded-2xl p-5 shadow-lg flex flex-col items-center text-center self-start">
            <div className="w-20 h-20 bg-gradient-to-tr from-[#5ab946] to-[#4ca03a] rounded-full flex items-center justify-center text-white text-3xl font-extrabold shadow-md mb-4 uppercase">
              {currentUser.name.charAt(0)}
            </div>
            <h2 className="text-base font-extrabold text-gray-900 leading-tight">{currentUser.name}</h2>
            <p className="text-[10px] text-gray-500 font-semibold mt-1 font-mono">{currentUser.email}</p>
            <span className="mt-3 bg-[#5ab946]/10 border border-[#5ab946]/20 text-[#5ab946] text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
              Store Customer
            </span>

            {/* Profile Tabs Navigation */}
            <div className="w-full mt-6 border-t border-gray-200 pt-4 flex flex-col gap-1.5 text-left text-xs font-bold text-gray-500">
              <button
                onClick={() => handleTabChange("settings")}
                className={`w-full py-2.5 px-4 rounded-xl transition-all cursor-pointer text-left flex items-center gap-2.5 ${
                  activeTab === "settings" ? "bg-[#5ab946] text-white" : "hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <User size={15} /> Edit Profile
              </button>
              <button
                onClick={() => handleTabChange("addresses")}
                className={`w-full py-2.5 px-4 rounded-xl transition-all cursor-pointer text-left flex items-center gap-2.5 ${
                  activeTab === "addresses" ? "bg-[#5ab946] text-white" : "hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <MapPin size={15} /> Saved Addresses
              </button>
              <button
                onClick={() => handleTabChange("orders")}
                className={`w-full py-2.5 px-4 rounded-xl transition-all cursor-pointer text-left flex items-center gap-2.5 ${
                  activeTab === "orders" ? "bg-[#5ab946] text-white" : "hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <ShoppingBag size={15} /> Order History
              </button>
            </div>

            <button 
              onClick={handleLogout}
              className="w-full mt-6 py-2.5 bg-[#e61923]/10 hover:bg-[#e61923] text-[#e61923] hover:text-white border border-[#e61923]/25 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>

          {/* Active Tab Panel Column */}
          <div className="flex-grow bg-white border border-gray-200 rounded-2xl p-5 sm:p-7 shadow-lg relative min-h-[400px]">
            {/* Tab: Settings */}
            {activeTab === "settings" && (
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-3">
                  <h3 className="text-base font-extrabold text-gray-900">Edit Profile Settings</h3>
                  <p className="text-[10px] text-gray-400 font-semibold mt-1">Keep your personal contact details dynamic and updated</p>
                </div>

                {profileSuccess && (
                  <div className="bg-[#5ab946]/10 border border-[#5ab946]/20 p-3.5 rounded-xl text-[#5ab946] text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 size={16} /> {profileSuccess}
                  </div>
                )}

                <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-lg">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Full Name</label>
                    <div className="flex items-center bg-white border border-gray-200 rounded-xl px-3.5 py-3 focus-within:border-[#5ab946] transition-colors">
                      <User className="text-gray-500 mr-2.5 flex-shrink-0" size={18} />
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Enter full name"
                        className="bg-transparent text-sm font-semibold text-gray-900 outline-none w-full"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Email Address (Read-only)</label>
                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3 opacity-60">
                      <Mail className="text-gray-500 mr-2.5 flex-shrink-0" size={18} />
                      <input
                        type="email"
                        value={currentUser.email}
                        readOnly
                        className="bg-transparent text-sm font-semibold text-gray-500 outline-none w-full cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Mobile Number</label>
                    <div className="flex items-center bg-white border border-gray-200 rounded-xl px-3.5 py-3 focus-within:border-[#5ab946] transition-colors">
                      <Phone className="text-gray-500 mr-2.5 flex-shrink-0" size={18} />
                      <input
                        type="tel"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="10-digit mobile number"
                        className="bg-transparent text-sm font-semibold text-gray-900 outline-none w-full font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={updatingProfile}
                    className="bg-gradient-to-r from-[#5ab946] to-[#49a836] hover:from-[#4ba03a] hover:to-[#3e892e] text-white px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center min-w-[150px]"
                  >
                    {updatingProfile ? (
                      <Loader2 className="animate-spin text-white w-4 h-4" />
                    ) : (
                      "Save Profile Details"
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Tab: Addresses */}
            {activeTab === "addresses" && (
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-3 flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-extrabold text-gray-900">Manage Saved Addresses</h3>
                    <p className="text-[10px] text-gray-400 font-semibold mt-1">Add, edit, or delete shipping addresses for delivery</p>
                  </div>
                  <button
                    onClick={() => setShowAddressForm(!showAddressForm)}
                    className="bg-[#5ab946] hover:bg-[#4ca03a] text-white px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                  >
                    <Plus size={14} className="stroke-[3]" /> Add New
                  </button>
                </div>

                {showAddressForm && (
                  <form onSubmit={handleAddAddress} className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 space-y-4 max-w-xl mx-auto">
                    <h4 className="text-xs font-black text-[#5ab946] uppercase tracking-wider">New Shipping Address</h4>

                    {addressError && <div className="text-[#e61923] text-xs font-bold">{addressError}</div>}

                    {/* Full name (First and Last name) */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Full name (First and Last name)</label>
                      <input
                        type="text"
                        placeholder="Full name (First and Last name)"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        className="bg-white border border-gray-200 p-3 rounded-xl text-xs font-semibold text-gray-900 outline-none w-full focus:border-[#5ab946]"
                      />
                    </div>

                    {/* Mobile number */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Mobile number</label>
                      <input
                        type="text"
                        placeholder="Mobile number"
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        className="bg-white border border-gray-200 p-3 rounded-xl text-xs font-semibold text-gray-900 outline-none w-full focus:border-[#5ab946] font-mono"
                      />
                      <span className="text-[9px] text-gray-450 font-bold block mt-0.5">May be used to assist delivery</span>
                    </div>

                    {/* Pincode */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Pincode</label>
                      <input
                        type="text"
                        placeholder="6 digits [0-9] PIN code"
                        value={formPincode}
                        onChange={(e) => setFormPincode(e.target.value)}
                        className="bg-white border border-gray-200 p-3 rounded-xl text-xs font-semibold text-gray-900 outline-none w-full focus:border-[#5ab946] font-mono"
                      />
                    </div>

                    {/* Flat, House no., Building, Company, Apartment */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Flat, House no., Building, Company, Apartment</label>
                      <input
                        type="text"
                        placeholder="Flat, House no., Building, Company, Apartment"
                        value={formFlat}
                        onChange={(e) => setFormFlat(e.target.value)}
                        className="bg-white border border-gray-200 p-3 rounded-xl text-xs font-semibold text-gray-900 outline-none w-full focus:border-[#5ab946]"
                      />
                    </div>

                    {/* Area, Street, Sector, Village */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Area, Street, Sector, Village</label>
                      <input
                        type="text"
                        placeholder="Area, Street, Sector, Village"
                        value={formArea}
                        onChange={(e) => setFormArea(e.target.value)}
                        className="bg-white border border-gray-200 p-3 rounded-xl text-xs font-semibold text-gray-900 outline-none w-full focus:border-[#5ab946]"
                      />
                    </div>

                    {/* Landmark */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Landmark</label>
                      <input
                        type="text"
                        placeholder="E.g. near apollo hospital"
                        value={formLandmark}
                        onChange={(e) => setFormLandmark(e.target.value)}
                        className="bg-white border border-gray-200 p-3 rounded-xl text-xs font-semibold text-gray-900 outline-none w-full focus:border-[#5ab946]"
                      />
                    </div>

                    {/* Town/City and State inputs side-by-side */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Town/City</label>
                        <input
                          type="text"
                          placeholder="Town/City"
                          value={formCity}
                          onChange={(e) => setFormCity(e.target.value)}
                          className="bg-white border border-gray-200 p-3 rounded-xl text-xs font-semibold text-gray-900 outline-none w-full focus:border-[#5ab946]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">State</label>
                        <select
                          value={formState}
                          onChange={(e) => setFormState(e.target.value)}
                          className="bg-white border border-gray-200 p-3 rounded-xl text-xs font-semibold text-gray-900 outline-none w-full focus:border-[#5ab946] cursor-pointer"
                        >
                          <option value="">Choose a state</option>
                          {INDIAN_STATES.map((state) => (
                            <option key={state} value={state}>{state}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Default address checkbox and radio buttons */}
                    <div className="flex flex-wrap items-center justify-between pt-1 gap-3">
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-xs text-gray-450 font-bold cursor-pointer">
                          <input
                            type="radio"
                            name="profile-addr-type"
                            checked={formType === "Home"}
                            onChange={() => setFormType("Home")}
                            className="w-4 h-4 accent-[#5ab946]"
                          />
                          Home
                        </label>
                        <label className="flex items-center gap-2 text-xs text-gray-450 font-bold cursor-pointer">
                          <input
                            type="radio"
                            name="profile-addr-type"
                            checked={formType === "Work"}
                            onChange={() => setFormType("Work")}
                            className="w-4 h-4 accent-[#5ab946]"
                          />
                          Office
                        </label>
                      </div>

                      <label className="flex items-center gap-2 text-xs text-gray-450 font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formIsDefault}
                          onChange={(e) => setFormIsDefault(e.target.checked)}
                          className="w-4 h-4 rounded accent-[#5ab946]"
                        />
                        Set as default address
                      </label>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddressForm(false)}
                        className="flex-1 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl text-xs transition-colors cursor-pointer bg-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-[#5ab946] hover:bg-[#4ca03a] text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                      >
                        Save Address
                      </button>
                    </div>
                  </form>
                )}

                {addresses.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 font-bold text-xs bg-gray-50 border border-dashed border-gray-200 rounded-2xl">
                    No shipping addresses saved. Click &quot;Add New&quot; to add one.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className="p-4 bg-white border border-gray-200 rounded-2xl flex items-start justify-between gap-3 relative hover:border-gray-300 transition-colors"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-xs text-gray-950">{addr.name}</span>
                            <span className="bg-gray-100 border border-gray-200 text-gray-500 font-extrabold text-[8px] px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                              {addr.type}
                            </span>
                            {addr.isDefault && (
                              <span className="bg-[#5ab946]/10 border border-[#5ab946]/20 text-[#5ab946] font-bold text-[8px] px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
                            {addr.street.replace('\n', ', ')}, {addr.city}, {addr.state} - <span className="font-mono">{addr.pincode}</span>
                          </p>
                          <p className="text-[10px] text-gray-400 font-semibold font-mono">Phone: {addr.phone}</p>
                        </div>

                        <button
                          onClick={() => setAddressToDelete(addr.id)}
                          className="text-gray-500 hover:text-red-500 transition-colors p-1.5 hover:bg-red-500/10 rounded-lg cursor-pointer"
                          title="Delete address"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Orders */}
            {activeTab === "orders" && (
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-3">
                  <h3 className="text-base font-extrabold text-gray-900">Your Order Tracking History</h3>
                  <p className="text-[10px] text-gray-400 font-semibold mt-1">Track and monitor your purchased products status</p>
                </div>

                {orders.length === 0 ? (
                  <div className="text-center py-16 text-gray-500 font-bold text-xs bg-gray-50 border border-dashed border-gray-200 rounded-2xl">
                    No orders placed yet. Add items to your cart to shop!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => {
                      const isExpanded = expandedOrderId === order.id;
                      const orderDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      });

                      return (
                        <div key={order.id} className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                          {/* Order Card Header */}
                          <div
                            onClick={() => toggleExpandOrder(order.id)}
                            className="bg-gray-50 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 cursor-pointer hover:bg-gray-100 transition-colors border-b border-gray-200"
                          >
                            <div className="grid grid-cols-2 sm:flex sm:items-center gap-5 text-[10px] sm:text-xs text-gray-400 font-semibold">
                              <div>
                                <span className="text-gray-500 uppercase block text-[8px] font-black tracking-wider">Date Placed</span>
                                  <span className="text-gray-900 font-bold flex items-center gap-1 mt-0.5">
                                  <Calendar size={12} className="text-[#5ab946]" /> {orderDate}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 uppercase block text-[8px] font-black tracking-wider">Paid Amount</span>
                                <span className="text-[#5ab946] font-black font-mono mt-0.5 text-xs sm:text-sm block">
                                  ₹{order.totalAmount.toLocaleString("en-IN")}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 uppercase block text-[8px] font-black tracking-wider">Delivery Status</span>
                                <span className="text-[#5ab946] font-black tracking-wider block mt-0.5 text-[9px] bg-[#5ab946]/10 border border-[#5ab946]/20 px-2 py-0.5 rounded-full">
                                  {order.status}
                                </span>
                              </div>
                              <div className="hidden sm:block">
                                <span className="text-gray-500 uppercase block text-[8px] font-black tracking-wider">Reference ID</span>
                                <span className="text-gray-300 font-mono mt-0.5 block text-[10px] break-all">{order.id}</span>
                              </div>
                            </div>

                            <button className="text-[10px] font-black text-[#5ab946] uppercase tracking-wider hover:underline flex items-center gap-1">
                              {isExpanded ? "Collapse" : "Expand Details"}
                            </button>
                          </div>

                          {/* Order Card Body details */}
                          {isExpanded && (
                            <div className="p-4 sm:p-5 bg-white space-y-4 border-t border-gray-200">
                              {/* Tracking Section */}
                              {order.status !== "PENDING" && order.status !== "DELIVERED" && order.status !== "CANCELLED" && order.shippingLink && (
                                <div className="bg-[#5ab946]/10 border border-[#5ab946]/20 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#5ab946]/20 flex items-center justify-center text-[#5ab946] flex-shrink-0">
                                      <Truck size={20} />
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-black text-gray-900">Track Your Package</h4>
                                      <p className="text-[11px] text-gray-500 font-semibold mt-0.5">
                                        Your package has been dispatched. Click track to see its status on the courier's website.
                                      </p>
                                    </div>
                                  </div>
                                  <a
                                    href={order.shippingLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-[#5ab946] hover:bg-[#4ca03a] text-white text-xs font-black px-5 py-2.5 rounded-xl transition-all shadow-sm hover:shadow active:scale-95 inline-flex items-center gap-1.5 cursor-pointer uppercase tracking-wider w-full sm:w-auto justify-center"
                                  >
                                    Track Order <ArrowRight size={14} />
                                  </a>
                                </div>
                              )}

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-gray-200 pb-4 text-xs font-semibold text-gray-500">
                                {/* Shipping details */}
                                <div className="space-y-1.5">
                                  <h5 className="text-[9px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1">
                                    <MapPin size={12} className="text-[#5ab946]" /> Delivered to
                                  </h5>
                                  <div className="bg-gray-50 p-3 border border-gray-200 rounded-xl space-y-0.5">
                                    <p className="font-extrabold text-gray-900 text-xs">{order.address.name}</p>
                                    <p className="text-gray-450 leading-relaxed font-medium">
                                      {order.address.street.replace('\n', ', ')}, {order.address.city}, {order.address.state} - {order.address.pincode}
                                    </p>
                                  </div>
                                </div>

                                {/* Payment detail info */}
                                <div className="space-y-1.5">
                                  <h5 className="text-[9px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1">
                                    <ShieldCheck size={12} className="text-[#5ab946]" /> Transaction Security
                                  </h5>
                                  <div className="bg-gray-50 p-3 border border-gray-200 rounded-xl space-y-1.5">
                                    <div className="flex justify-between">
                                      <span>Payment Mode:</span>
                                      <span className="font-extrabold text-gray-900">
                                        {order.paymentMethod === "COD" ? "Cash on Delivery" : "Online card/UPI"}
                                      </span>
                                    </div>
                                    <div className="flex justify-between border-t border-gray-200 pt-1.5">
                                      <span>Payment Status:</span>
                                      <span className={`font-bold uppercase tracking-wider ${
                                        order.paymentStatus === "COMPLETED" ? "text-[#5ab946]" : "text-amber-500"
                                      }`}>
                                        {order.paymentStatus}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Items ordered list */}
                              <div className="space-y-3">
                                <h5 className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Ordered Tech Items</h5>
                                <div className="space-y-2.5">
                                  {order.items.map((item) => (
                                    <div key={item.id} className="flex gap-3 items-center pb-2.5 border-b border-gray-200 last:border-b-0 last:pb-0">
                                      <div className="w-[45px] h-[45px] bg-white border border-gray-200 rounded-lg flex items-center justify-center p-1 flex-shrink-0">
                                        <img
                                          src={item.product.imageUrl}
                                          alt={item.product.title}
                                          className="max-h-full max-w-full object-contain cursor-pointer"
                                          onClick={() => router.push(`/products/${item.product.id}`)}
                                        />
                                      </div>
                                      <div className="flex-grow min-w-0">
                                        <h6
                                          onClick={() => router.push(`/products/${item.product.id}`)}
                                          className="text-xs font-bold text-gray-900 line-clamp-1 hover:text-[#5ab946] transition-colors cursor-pointer"
                                        >
                                          {item.product.title}
                                        </h6>
                                        <div className="flex items-center gap-4 text-[9px] text-gray-450 font-semibold font-mono mt-0.5">
                                          <span>Qty: {item.quantity}</span>
                                          <span>Unit Cost: ₹{item.price.toLocaleString("en-IN")}</span>
                                        </div>
                                      </div>
                                      <span className="font-mono text-xs font-black text-gray-900 flex-shrink-0 pl-2">
                                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
      <BottomNav />

      {/* Custom Delete Confirmation Modal */}
      {addressToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[150] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-gray-150 shadow-2xl flex flex-col items-center text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center border border-red-100 flex-shrink-0">
              <Trash2 size={22} className="stroke-[2.5]" />
            </div>
            
            <div className="space-y-1.5 w-full">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                Delete Address?
              </h3>
              <p className="text-xs text-gray-400 font-semibold leading-relaxed">
                Are you sure you want to delete this address? This action cannot be undone.
              </p>
            </div>
            
            <div className="flex gap-3 w-full pt-1">
              <button
                type="button"
                onClick={() => setAddressToDelete(null)}
                disabled={isDeletingAddress}
                className="flex-1 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl text-xs transition-colors cursor-pointer bg-white disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteAddress}
                disabled={isDeletingAddress}
                className="flex-1 py-2.5 bg-[#e61923] hover:bg-[#c9121a] text-white font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isDeletingAddress ? (
                  <Loader2 size={14} className="animate-spin text-white" />
                ) : (
                  <>Delete</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
