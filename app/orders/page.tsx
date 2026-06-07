"use client";

import React, { useEffect, useState } from "react";
import { ShoppingBag, ArrowRight, ShieldCheck, ChevronDown, ChevronUp, MapPin, Calendar, CreditCard, Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";

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

interface Address {
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
}

interface Order {
  id: string;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  address: Address;
  items: OrderItem[];
  shippingLink?: string | null;
}

export default function OrdersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [user, setUser] = useState<any>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuthAndFetchOrders() {
      try {
        const authRes = await fetch("/api/auth/me");
        if (authRes.ok) {
          const authData = await authRes.json();
          if (authData.authenticated && authData.user) {
            setUser(authData.user);
            await fetchOrders();
          } else {
            router.push("/login?redirect=/orders");
          }
        } else {
          router.push("/login?redirect=/orders");
        }
      } catch (err) {
        console.error("Auth / Orders fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    checkAuthAndFetchOrders();
  }, [router]);

  async function fetchOrders() {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
    }
  }

  const toggleExpandOrder = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
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

  return (
    <div className="min-h-screen bg-[#e3e6e6] flex flex-col font-sans mb-16 md:mb-0">
      <Navbar />

      <main className="flex-grow w-full max-w-[1000px] mx-auto p-3 sm:p-5">
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200/50 space-y-4">
          <div className="border-b border-gray-250 pb-4 flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <ShoppingBag size={22} className="text-[#5ab946]" /> Order History
            </h1>
            <span className="text-gray-500 text-xs sm:text-sm font-bold bg-gray-100 px-3 py-1 rounded-full">
              {orders.length} {orders.length === 1 ? "order" : "orders"}
            </span>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-20 bg-gray-50/20 border border-dashed border-gray-200 rounded-2xl space-y-4">
              <div className="text-gray-400 font-extrabold text-lg">No orders found.</div>
              <p className="text-gray-500 text-xs font-semibold max-w-sm mx-auto">
                Looks like you haven't placed any orders yet. Explore our premium store to buy quality laptops, components, and accessories!
              </p>
              <button
                onClick={() => router.push("/")}
                className="bg-[#5ab946] hover:bg-[#4ca03a] text-white text-xs font-black px-6 py-2.5 rounded-xl transition-all active:scale-95 shadow-md hover:shadow-lg inline-flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
              >
                Shop Now <ArrowRight size={14} />
              </button>
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
                  <div key={order.id} className="border border-gray-200 rounded-xl overflow-hidden shadow-xs bg-white">
                    {/* Order Bar Header */}
                    <div
                      onClick={() => toggleExpandOrder(order.id)}
                      className="bg-gray-50/50 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors select-none border-b border-gray-200"
                    >
                      <div className="grid grid-cols-2 sm:flex sm:items-center gap-4 text-[10px] sm:text-xs text-gray-500 font-semibold">
                        <div>
                          <span className="text-gray-400 uppercase tracking-wider block text-[9px] font-black">Date Placed</span>
                          <span className="text-gray-800 font-extrabold flex items-center gap-1 mt-0.5">
                            <Calendar size={12} className="text-[#5ab946]" /> {orderDate}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400 uppercase tracking-wider block text-[9px] font-black">Total Amount</span>
                          <span className="text-gray-800 font-black font-mono mt-0.5 text-xs sm:text-sm">
                            ₹{order.totalAmount.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400 uppercase tracking-wider block text-[9px] font-black">Status</span>
                          <span className="text-[#5ab946] font-extrabold uppercase tracking-wider block mt-0.5 text-[10px]">
                            {order.status}
                          </span>
                        </div>
                        <div className="hidden sm:block">
                          <span className="text-gray-400 uppercase tracking-wider block text-[9px] font-black">Order ID</span>
                          <span className="text-gray-600 font-mono mt-0.5 block text-[10px] break-all">{order.id}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto text-xs font-black text-gray-700 uppercase tracking-wider">
                        {isExpanded ? (
                          <>Hide Details <ChevronUp size={16} className="text-[#5ab946]" /></>
                        ) : (
                          <>View Details <ChevronDown size={16} className="text-[#5ab946]" /></>
                        )}
                      </div>
                    </div>

                    {/* Order Details Body */}
                    {isExpanded && (
                      <div className="p-4 sm:p-6 bg-white space-y-5 animate-fade-in">
                        {/* Tracking Section */}
                        {order.status !== "PENDING" && order.status !== "DELIVERED" && order.status !== "CANCELLED" && order.shippingLink && (
                          <div className="bg-[#5ab946]/10 border border-[#5ab946]/20 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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

                        {/* Summary details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-gray-150 pb-4 text-xs font-semibold text-gray-600">
                          {/* Shipping Address */}
                          <div className="space-y-1.5">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                              <MapPin size={12} className="text-[#5ab946]" /> Shipping Destination
                            </h4>
                            <div className="bg-gray-50/50 p-3 rounded-lg border border-gray-150 space-y-0.5">
                              <p className="font-extrabold text-gray-950">{order.address.name}</p>
                              <p className="text-gray-500 font-medium">
                                {order.address.street.replace('\n', ', ')}, {order.address.city}, {order.address.state} - {order.address.pincode}
                              </p>
                              <p className="text-gray-500 font-mono text-[11px]">Phone: {order.address.phone}</p>
                            </div>
                          </div>

                          {/* Payment Summary */}
                          <div className="space-y-1.5">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                              <CreditCard size={12} className="text-[#5ab946]" /> Payment Details
                            </h4>
                            <div className="bg-gray-50/50 p-3 rounded-lg border border-gray-150 space-y-2">
                              <div className="flex justify-between">
                                <span>Method:</span>
                                <span className="font-extrabold text-gray-800">
                                  {order.paymentMethod === "COD" ? "Cash on Delivery (COD)" : "Online Card/UPI"}
                                </span>
                              </div>
                              <div className="flex justify-between border-t border-gray-200/60 pt-2">
                                <span>Status:</span>
                                <span className={`font-bold uppercase tracking-wider ${
                                  order.paymentStatus === "COMPLETED" ? "text-[#5ab946]" : "text-amber-500"
                                }`}>
                                  {order.paymentStatus}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Items purchased */}
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Items Ordered</h4>
                          <div className="space-y-3">
                            {order.items.map((item) => (
                              <div key={item.id} className="flex gap-3 items-center pb-3 border-b border-gray-100 last:border-b-0 last:pb-0">
                                <div className="w-[50px] h-[50px] bg-gray-50 rounded-lg flex items-center justify-center p-1 border border-gray-150 flex-shrink-0">
                                  <img
                                    src={item.product.imageUrl}
                                    alt={item.product.title}
                                    className="max-h-full max-w-full object-contain cursor-pointer"
                                    onClick={() => router.push(`/products/${item.product.id}`)}
                                  />
                                </div>
                                <div className="flex-grow min-w-0">
                                  <h5
                                    onClick={() => router.push(`/products/${item.product.id}`)}
                                    className="text-xs font-bold text-gray-800 line-clamp-1 hover:text-[#5ab946] transition-colors cursor-pointer"
                                  >
                                    {item.product.title}
                                  </h5>
                                  <div className="flex items-center gap-4 text-[10px] text-gray-450 font-semibold font-mono mt-0.5">
                                    <span>Quantity: {item.quantity}</span>
                                    <span>Price per unit: ₹{item.price.toLocaleString("en-IN")}</span>
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
      </main>

      <BottomNav />
    </div>
  );
}
