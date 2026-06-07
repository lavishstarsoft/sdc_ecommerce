"use client";

import React, { useEffect, useState, useCallback } from "react";
import { MapPin, Plus, ShieldCheck, ArrowLeft, CreditCard, Banknote, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { getDeliveryChargeForQuantity } from "@/lib/storeService";

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

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    title: string;
    price: number;
    imageUrl: string;
    allowCOD: boolean;
    allowOnline: boolean;
    freeDelivery: boolean;
    deliveryCharge: number;
    deliverySlabs: { min_qty: number; max_qty?: number | null; charge: number }[];
  };
}

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && (window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

export default function CheckoutPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("COD");
  const [user, setUser] = useState<any>(null);

  // Address Modal/Form State
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
  const [formError, setFormError] = useState("");

  const [orderPlacing, setOrderPlacing] = useState(false);

  const fetchAddresses = useCallback(async () => {
    const res = await fetch("/api/addresses");
    if (res.ok) {
      const data = await res.json();
      setAddresses(data);
      const defAddr = data.find((a: Address) => a.isDefault);
      if (defAddr) {
        setSelectedAddressId(defAddr.id);
      } else if (data.length > 0) {
        setSelectedAddressId(data[0].id);
      }
    }
  }, []);

  useEffect(() => {
    async function initCheckout() {
      try {
        const authRes = await fetch("/api/auth/me");
        if (authRes.ok) {
          const authData = await authRes.json();
          if (authData.authenticated && authData.user) {
            setUser(authData.user);
            
            // Get Cart
            const cartRes = await fetch("/api/cart");
            if (cartRes.ok) {
              const cartData = await cartRes.json();
              if (cartData.length === 0) {
                router.push("/cart");
                return;
              }
              setCartItems(cartData);
            }

            // Get Addresses
            window.setTimeout(() => {
              fetchAddresses().catch((err) => {
                console.error("Failed to load addresses:", err);
              });
            }, 0);
          } else {
            router.push("/login?redirect=/checkout");
          }
        } else {
          router.push("/login?redirect=/checkout");
        }
      } catch (err) {
        console.error("Checkout initialization failed:", err);
      } finally {
        setLoading(false);
      }
    }

    initCheckout();
  }, [router, fetchAddresses]);

  useEffect(() => {
    if (cartItems.length > 0) {
      const isCOD = cartItems.every((item) => item.product.allowCOD !== false);
      const isOnline = cartItems.every((item) => item.product.allowOnline !== false);
      const nextPaymentMethod = !isCOD && paymentMethod === "COD"
        ? (isOnline ? "ONLINE" : "")
        : !isOnline && paymentMethod === "ONLINE"
        ? (isCOD ? "COD" : "")
        : paymentMethod;
      
      if (nextPaymentMethod !== paymentMethod) {
        window.setTimeout(() => {
          setPaymentMethod(nextPaymentMethod);
        }, 0);
      }
    }
  }, [cartItems, paymentMethod]);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formName.trim() || !formPhone.trim() || !formFlat.trim() || !formArea.trim() || !formCity.trim() || !formState.trim() || !formPincode.trim()) {
      setFormError("Please fill out all required fields.");
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
        setSelectedAddressId(newAddr.id);
        
        // Reset form states
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
        setFormError(errData.error || "Failed to create address.");
      }
    } catch (err) {
      console.error("Failed to add address:", err);
      setFormError("Something went wrong. Please try again.");
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      alert("Please select a shipping address.");
      return;
    }

    if (paymentMethod === "COD" && !isCODAllowed) {
      alert("Cash on Delivery (COD) is not allowed for one or more items in your cart.");
      return;
    }
    if (paymentMethod === "ONLINE" && !isOnlineAllowed) {
      alert("Online payment is not allowed for one or more items in your cart.");
      return;
    }

    setOrderPlacing(true);
    try {
      // 1. If online payment, load the Razorpay SDK script first
      if (paymentMethod === "ONLINE") {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          alert("Failed to load Razorpay SDK. Please verify your internet connection and try again.");
          setOrderPlacing(false);
          return;
        }
      }

      // 2. Submit order creation request
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressId: selectedAddressId,
          paymentMethod
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || "Failed to place order.");
        setOrderPlacing(false);
        return;
      }

      const orderData = await res.json();

      // 3. Open Razorpay payment popup modal if ONLINE
      if (paymentMethod === "ONLINE") {
        const options = {
          key: orderData.razorpayKeyId,
          amount: orderData.razorpayOrderId ? undefined : Math.round(orderTotalWithShipping * 100),
          currency: "INR",
          name: "SDC Store",
          description: "Purchase order payment",
          order_id: orderData.razorpayOrderId,
          handler: async function (response: any) {
            setOrderPlacing(true);
            try {
              const verifyRes = await fetch("/api/checkout/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  orderId: orderData.id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpaySignature: response.razorpay_signature
                })
              });

              if (verifyRes.ok) {
                window.dispatchEvent(new Event("cart-updated"));
                router.push(`/checkout/success?orderId=${orderData.id}`);
              } else {
                const verifyErr = await verifyRes.json();
                alert(verifyErr.error || "Payment signature verification failed. Please contact support.");
              }
            } catch (vErr) {
              console.error("Payment verification request failed:", vErr);
              alert("An error occurred verifying your online payment.");
            } finally {
              setOrderPlacing(false);
            }
          },
          prefill: {
            name: user?.name || "",
            email: user?.email || "",
            contact: user?.phone || ""
          },
          theme: {
            color: "#5ab946"
          },
          modal: {
            ondismiss: function () {
              setOrderPlacing(false);
              alert("Payment modal dismissed. Your order remains pending.");
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        // COD flow
        window.dispatchEvent(new Event("cart-updated"));
        router.push(`/checkout/success?orderId=${orderData.id}`);
      }
    } catch (err) {
      console.error("Order placing error:", err);
      alert("An error occurred placing your order. Please try again.");
      setOrderPlacing(false);
    }
  };

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

  const orderTotal = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const totalDeliveryCharges = cartItems.reduce((acc, item) => acc + getDeliveryChargeForQuantity(item.product, item.quantity), 0);
  const orderTotalWithShipping = orderTotal + totalDeliveryCharges;

  const isCODAllowed = cartItems.every((item) => item.product.allowCOD !== false);
  const isOnlineAllowed = cartItems.every((item) => item.product.allowOnline !== false);
  const itemsRestrictingCOD = cartItems.filter((item) => item.product.allowCOD === false);
  const itemsRestrictingOnline = cartItems.filter((item) => item.product.allowOnline === false);

  return (
    <div className="min-h-screen bg-[#e3e6e6] flex flex-col font-sans mb-16 md:mb-0">
      <Navbar />

      <main className="flex-grow w-full max-w-[1200px] mx-auto p-3 sm:p-5">
        <button
          onClick={() => router.push("/cart")}
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-xs font-black uppercase tracking-wider mb-4 transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to Cart
        </button>

        <div className="flex flex-col lg:flex-row gap-5">
          {/* Checkout Steps Column */}
          <div className="flex-grow space-y-4">
            {/* Step 1: Address Selection */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200/50 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-150 pb-3">
                <h2 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2">
                  <span className="bg-[#5ab946] text-white w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold">1</span>
                  Delivery Address
                </h2>
                <button
                  onClick={() => setShowAddressForm(!showAddressForm)}
                  className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-xl px-3 py-1.5 text-xs font-black transition-all cursor-pointer flex items-center gap-1"
                >
                  <Plus size={14} className="text-[#5ab946] stroke-[3]" /> Add New
                </button>
              </div>

              {showAddressForm && (
                <form onSubmit={handleAddAddress} className="bg-gray-50 p-4 sm:p-5 rounded-xl border border-gray-200 space-y-3">
                  <h3 className="text-xs font-black text-gray-700 uppercase tracking-wider">Add shipping address</h3>
                  
                  {formError && <div className="text-[#e61923] text-xs font-bold">{formError}</div>}

                  {/* Country/Region Dropdown */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Country/Region</label>
                    <select
                      value={formCountry}
                      onChange={(e) => setFormCountry(e.target.value)}
                      className="border border-gray-250 p-2.5 rounded-lg bg-white text-xs font-semibold outline-none w-full focus:border-[#5ab946] cursor-pointer"
                    >
                      <option value="India">India</option>
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Canada">Canada</option>
                    </select>
                  </div>

                  {/* Full name (First and Last name) */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Full name (First and Last name)</label>
                    <input
                      type="text"
                      placeholder="Full name (First and Last name)"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="border border-gray-250 p-2.5 rounded-lg bg-white text-xs font-semibold outline-none w-full focus:border-[#5ab946]"
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
                      className="border border-gray-250 p-2.5 rounded-lg bg-white text-xs font-semibold outline-none w-full focus:border-[#5ab946]"
                    />
                    <span className="text-[9px] text-gray-400 font-bold block mt-0.5">May be used to assist delivery</span>
                  </div>

                  {/* Pincode */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Pincode</label>
                    <input
                      type="text"
                      placeholder="6 digits [0-9] PIN code"
                      value={formPincode}
                      onChange={(e) => setFormPincode(e.target.value)}
                      className="border border-gray-250 p-2.5 rounded-lg bg-white text-xs font-semibold outline-none w-full focus:border-[#5ab946]"
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
                      className="border border-gray-250 p-2.5 rounded-lg bg-white text-xs font-semibold outline-none w-full focus:border-[#5ab946]"
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
                      className="border border-gray-250 p-2.5 rounded-lg bg-white text-xs font-semibold outline-none w-full focus:border-[#5ab946]"
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
                      className="border border-gray-250 p-2.5 rounded-lg bg-white text-xs font-semibold outline-none w-full focus:border-[#5ab946]"
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
                        className="border border-gray-250 p-2.5 rounded-lg bg-white text-xs font-semibold outline-none w-full focus:border-[#5ab946]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">State</label>
                      <select
                        value={formState}
                        onChange={(e) => setFormState(e.target.value)}
                        className="border border-gray-250 p-2.5 rounded-lg bg-white text-xs font-semibold outline-none w-full focus:border-[#5ab946] cursor-pointer"
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
                      <label className="flex items-center gap-1.5 text-xs text-gray-700 font-bold cursor-pointer">
                        <input
                          type="radio"
                          name="addr-type"
                          checked={formType === "Home"}
                          onChange={() => setFormType("Home")}
                          className="w-4 h-4 accent-[#5ab946]"
                        />
                        Home
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-gray-700 font-bold cursor-pointer">
                        <input
                          type="radio"
                          name="addr-type"
                          checked={formType === "Work"}
                          onChange={() => setFormType("Work")}
                          className="w-4 h-4 accent-[#5ab946]"
                        />
                        Work/Office
                      </label>
                    </div>

                    <label className="flex items-center gap-1.5 text-xs text-gray-750 font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formIsDefault}
                        onChange={(e) => setFormIsDefault(e.target.checked)}
                        className="w-4 h-4 rounded accent-[#5ab946]"
                      />
                      Make this my default address
                    </label>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddressForm(false)}
                      className="flex-1 py-2.5 border border-gray-300 hover:bg-gray-150 text-gray-700 font-bold rounded-lg text-xs transition-colors cursor-pointer bg-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-[#5ab946] hover:bg-[#4ca03a] text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      Save & Use
                    </button>
                  </div>
                </form>
              )}

              {addresses.length === 0 ? (
                <div className="text-gray-400 font-bold text-center py-6 text-xs bg-gray-50 border border-dashed border-gray-200 rounded-xl">
                  No addresses found. Click &quot;Add New&quot; to specify where we should deliver your tech gear.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {addresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.id;
                    return (
                      <div
                        key={addr.id}
                        onClick={() => setSelectedAddressId(addr.id)}
                        className={`p-4 border rounded-xl cursor-pointer transition-all flex items-start gap-3 relative ${
                          isSelected ? "border-[#5ab946] bg-green-50/10 shadow-xs" : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="checkout-addr"
                          checked={isSelected}
                          onChange={() => setSelectedAddressId(addr.id)}
                          className="mt-1 accent-[#5ab946] w-4 h-4"
                        />
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-xs text-gray-950">{addr.name}</span>
                            <span className="bg-gray-100 text-gray-500 font-extrabold text-[8px] px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                              {addr.type}
                            </span>
                            {addr.isDefault && (
                              <span className="bg-[#5ab946]/10 text-[#5ab946] font-bold text-[8px] px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                                Default
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                            {addr.street.replace('\n', ', ')}, {addr.city}, {addr.state} - <span className="font-mono">{addr.pincode}</span>
                          </p>
                          <p className="text-[11px] text-gray-500 font-semibold font-mono">Phone: {addr.phone}</p>
                          {addr.landmark && (
                            <p className="text-[10px] text-gray-400 font-medium italic">Landmark: {addr.landmark}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Step 2: Payment Method */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200/50 space-y-4">
              <h2 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2 border-b border-gray-150 pb-3">
                <span className="bg-[#5ab946] text-white w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold">2</span>
                Payment Options
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Cash on Delivery */}
                <div
                  onClick={() => isCODAllowed && setPaymentMethod("COD")}
                  className={`p-4 border rounded-xl transition-all flex items-start gap-3.5 ${
                    !isCODAllowed
                      ? "opacity-60 bg-gray-50 border-gray-200 cursor-not-allowed"
                      : paymentMethod === "COD"
                      ? "border-[#5ab946] bg-green-50/10 shadow-xs cursor-pointer"
                      : "border-gray-200 hover:border-gray-300 cursor-pointer"
                  }`}
                >
                  <input
                    type="radio"
                    name="checkout-pay"
                    checked={paymentMethod === "COD"}
                    disabled={!isCODAllowed}
                    onChange={() => setPaymentMethod("COD")}
                    className="accent-[#5ab946] w-4 h-4 mt-0.5"
                  />
                  <div className="flex items-start gap-2 min-w-0">
                    <Banknote className="text-gray-500 mt-0.5 flex-shrink-0" size={20} />
                    <div className="space-y-1 min-w-0">
                      <span className="font-extrabold text-xs text-gray-800 block">Cash on Delivery (COD)</span>
                      <span className="text-[9px] text-gray-400 font-bold block">Pay with cash at your doorstep</span>
                      {!isCODAllowed && (
                        <span className="text-[8px] text-[#e61923] font-bold uppercase tracking-wider block bg-red-50/50 border border-red-100 p-1.5 rounded-md leading-relaxed whitespace-pre-wrap break-words">
                          Not available: {itemsRestrictingCOD.map(i => i.product.title).join(", ")} restricts COD.
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Online Payment (Mock) */}
                <div
                  onClick={() => isOnlineAllowed && setPaymentMethod("ONLINE")}
                  className={`p-4 border rounded-xl transition-all flex items-start gap-3.5 ${
                    !isOnlineAllowed
                      ? "opacity-60 bg-gray-50 border-gray-200 cursor-not-allowed"
                      : paymentMethod === "ONLINE"
                      ? "border-[#5ab946] bg-green-50/10 shadow-xs cursor-pointer"
                      : "border-gray-200 hover:border-gray-300 cursor-pointer"
                  }`}
                >
                  <input
                    type="radio"
                    name="checkout-pay"
                    checked={paymentMethod === "ONLINE"}
                    disabled={!isOnlineAllowed}
                    onChange={() => setPaymentMethod("ONLINE")}
                    className="accent-[#5ab946] w-4 h-4 mt-0.5"
                  />
                  <div className="flex items-start gap-2 min-w-0">
                    <CreditCard className="text-gray-500 mt-0.5 flex-shrink-0" size={20} />
                    <div className="space-y-1 min-w-0">
                      <span className="font-extrabold text-xs text-gray-800 block">UPI / Net Banking / Cards</span>
                      <span className="text-[9px] text-gray-400 font-bold block">Instant verification & checkout</span>
                      {!isOnlineAllowed && (
                        <span className="text-[8px] text-[#e61923] font-bold uppercase tracking-wider block bg-red-50/50 border border-red-100 p-1.5 rounded-md leading-relaxed whitespace-pre-wrap break-words">
                          Not available: {itemsRestrictingOnline.map(i => i.product.title).join(", ")} restricts Online payments.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {!isCODAllowed && !isOnlineAllowed && (
                <div className="text-[#e61923] text-[10px] font-black uppercase tracking-wider bg-red-50 p-3.5 rounded-xl border border-red-150 text-center leading-relaxed">
                  ⚠️ None of the payment options are available for this product combination. Please update your cart.
                </div>
              )}
            </div>

            {/* Step 3: Order Review */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200/50 space-y-4">
              <h2 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2 border-b border-gray-150 pb-3">
                <span className="bg-[#5ab946] text-white w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold">3</span>
                Review Order Items
              </h2>

              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3 justify-between items-center py-2.5 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-[40px] h-[40px] bg-gray-50 rounded-lg flex items-center justify-center p-1 border border-gray-150 flex-shrink-0">
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.title}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-gray-800 line-clamp-1">{item.product.title}</span>
                        <span className="text-[10px] text-gray-450 font-semibold font-mono block mt-0.5">Qty: {item.quantity}</span>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-black text-gray-900 flex-shrink-0 font-bold">
                      ₹{(item.product.price * item.quantity).toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Checkout Actions Panel */}
          <div className="w-full lg:w-[350px] flex-shrink-0">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200/50 space-y-4 sticky top-20">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider border-b border-gray-150 pb-2">
                Order Summary
              </h3>

              <div className="space-y-3 text-xs font-semibold text-gray-700">
                <div className="flex justify-between">
                  <span>Subtotal ({cartItems.length} {cartItems.length === 1 ? "item" : "items"})</span>
                  <span className="font-mono text-gray-950">₹{orderTotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping Charges</span>
                  <span className={totalDeliveryCharges > 0 ? "font-mono text-gray-950 font-bold" : "text-[#5ab946] font-bold uppercase tracking-wider"}>
                    {totalDeliveryCharges > 0 ? `₹${totalDeliveryCharges.toLocaleString("en-IN")}` : "Free"}
                  </span>
                </div>
                <div className="border-t border-gray-150 my-2 pt-3 flex justify-between items-baseline">
                  <span className="text-sm font-black text-gray-900">Order Total</span>
                  <span className="text-base sm:text-lg font-black text-gray-900 font-mono">
                    ₹{orderTotalWithShipping.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={orderPlacing || addresses.length === 0}
                className={`w-full bg-gradient-to-r from-[#5ab946] to-[#49a836] hover:from-[#4ba03a] hover:to-[#3e892e] text-white py-3.5 rounded-xl font-black transition-all shadow-[0_4px_14px_rgba(90,185,70,0.25)] hover:shadow-[0_6px_20px_rgba(90,185,70,0.35)] active:scale-[0.98] cursor-pointer text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 ${
                  (orderPlacing || addresses.length === 0) ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {orderPlacing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                ) : (
                  <>Place Order & Pay</>
                )}
              </button>

              <div className="flex items-start gap-2.5 bg-[#5ab946]/5 rounded-xl p-3 border border-[#5ab946]/10 text-[10px] text-gray-650 leading-relaxed font-medium">
                <ShieldCheck size={16} className="text-[#5ab946] flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-gray-800">Secure Order Verification</p>
                  <p className="text-gray-500">Payments and delivery are verified with SDC Invoice. Returns are backed by Saidurga replacement policy.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
