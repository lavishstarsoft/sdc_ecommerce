"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Filter,
  Loader2,
  MapPin,
  Printer,
  Search,
  ShoppingBag,
  Truck
} from "lucide-react";

type AdminOrderStatus = "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

interface AdminOrderItem {
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

interface AdminOrderUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

interface AdminOrderAddress {
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  landmark: string | null;
  type: string;
}

interface AdminOrder {
  id: string;
  totalAmount: number;
  status: AdminOrderStatus;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  user: AdminOrderUser;
  address: AdminOrderAddress;
  items: AdminOrderItem[];
  shippingLink: string | null;
}

const STATUS_OPTIONS: { value: AdminOrderStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All Orders" },
  { value: "PENDING", label: "Pending" },
  { value: "PROCESSING", label: "Processing" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" }
];

const STATUS_STYLES: Record<AdminOrderStatus, string> = {
  PENDING: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  PROCESSING: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  SHIPPED: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
  DELIVERED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  CANCELLED: "bg-red-500/10 text-red-400 border-red-500/30"
};



export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AdminOrderStatus | "ALL">("ALL");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [savingTrackingOrderId, setSavingTrackingOrderId] = useState<string | null>(null);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    async function loadOrders() {
      try {
        const res = await fetch("/api/admin/orders", { cache: "no-store" });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to load orders.");
        }

        const data = await res.json();
        setOrders(data);

        try {
          const settingsRes = await fetch("/api/settings");
          if (settingsRes.ok) {
            const settingsData = await settingsRes.json();
            setSettings(settingsData);
          }
        } catch (e) {
          console.error("Failed to load settings in AdminOrdersPage:", e);
        }
      } catch (err: any) {
        console.error("Failed to load admin orders:", err);
        setError(err.message || "Failed to load orders.");
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus = statusFilter === "ALL" || order.status === statusFilter;
      if (!matchesStatus) return false;

      if (!query) return true;

      const haystack = [
        order.id,
        order.user.name,
        order.user.email,
        order.user.phone || "",
        order.paymentMethod,
        order.paymentStatus,
        order.status,
        order.address.name,
        order.address.city,
        order.address.state,
        ...order.items.map((item) => item.product.title)
      ].join(" ").toLowerCase();

      return haystack.includes(query);
    });
  }, [orders, searchQuery, statusFilter]);

  const summaryCounts = useMemo(() => {
    return orders.reduce(
      (acc, order) => {
        acc.total += 1;
        acc[order.status] += 1;
        return acc;
      },
      {
        total: 0,
        PENDING: 0,
        PROCESSING: 0,
        SHIPPED: 0,
        DELIVERED: 0,
        CANCELLED: 0
      }
    );
  }, [orders]);

  const toggleExpandOrder = (orderId: string) => {
    setExpandedOrderId((current) => (current === orderId ? null : orderId));
  };

  const updateOrderStatus = async (orderId: string, nextStatus: AdminOrderStatus) => {
    setError(null);
    setSuccess(null);
    setUpdatingOrderId(orderId);

    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: nextStatus })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to update order status.");
      }

      const updated = await res.json();
      setOrders((prev) => prev.map((order) => (order.id === updated.id ? updated : order)));
      setSuccess(`Order ${updated.id.slice(0, 8)}... updated to ${nextStatus}.`);
      setTimeout(() => setSuccess(null), 3500);
    } catch (err: any) {
      console.error("Failed to update order status:", err);
      setError(err.message || "Failed to update order status.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleSaveTrackingLink = async (orderId: string, shippingLink: string) => {
    setError(null);
    setSuccess(null);
    setSavingTrackingOrderId(orderId);

    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, shippingLink: shippingLink || null })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to update tracking link.");
      }

      const updated = await res.json();
      setOrders((prev) => prev.map((order) => (order.id === updated.id ? updated : order)));
      setSuccess(`Tracking link for order ${updated.id.slice(0, 8)}... updated successfully.`);
      setTimeout(() => setSuccess(null), 3500);
    } catch (err: any) {
      console.error("Failed to update tracking link:", err);
      setError(err.message || "Failed to update tracking link.");
    } finally {
      setSavingTrackingOrderId(null);
    }
  };

  const handlePrintLabel = (order: AdminOrder) => {
    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) return;

    const validationUrl = `${window.location.origin}/orders/validate?id=${order.id}`;

    const addressHtml = `
      <html>
        <head>
          <title>Shipping Label - Order #${order.id.slice(0, 8)}</title>
          <style>
            @media print {
              body { margin: 0; padding: 0; background: #fff; }
              .label-card { box-shadow: none !important; border: 2px solid #000 !important; }
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
              color: #000;
              margin: 0;
              padding: 24px;
              background: #f4f4f5;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 90vh;
            }
            .label-card {
              border: 2px solid #000;
              max-width: 580px;
              width: 100%;
              background: #fff;
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
            }
            .header {
              border-bottom: 2px solid #000;
              padding: 16px 20px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              background: #fafafa;
            }
            .logo-img {
              max-height: 40px;
              max-width: 200px;
              object-fit: contain;
            }
            .logo-text {
              font-size: 24px;
              font-weight: 900;
              letter-spacing: 0.5px;
              text-transform: uppercase;
            }
            .label-type-badge {
              border: 2px solid #000;
              background: #000;
              color: #fff;
              padding: 6px 14px;
              font-size: 15px;
              font-weight: 900;
              letter-spacing: 1px;
              text-transform: uppercase;
            }
            .barcode-section {
              padding: 20px;
              border-bottom: 2px solid #000;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            .barcode-img {
              max-height: 70px;
              max-width: 100%;
              object-fit: contain;
            }
            .address-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              border-bottom: 2px solid #000;
            }
            .grid-col {
              padding: 20px;
              display: flex;
              flex-direction: column;
              text-align: left;
            }
            .from-col {
              border-right: 2px solid #000;
              background: #fafafa;
            }
            .col-title {
              font-size: 9px;
              font-weight: 900;
              text-transform: uppercase;
              color: #555;
              letter-spacing: 1.5px;
              margin-bottom: 8px;
              border-bottom: 1px solid #ddd;
              padding-bottom: 4px;
            }
            .brand-name {
              font-size: 15px;
              font-weight: 900;
              margin-bottom: 6px;
              text-transform: uppercase;
              color: #111;
            }
            .recipient-name {
              font-size: 19px;
              font-weight: 950;
              margin-bottom: 6px;
              text-transform: uppercase;
              color: #000;
              letter-spacing: 0.5px;
            }
            .address-details {
              font-size: 12.5px;
              line-height: 1.45;
              font-weight: 500;
              color: #222;
            }
            .phone-line {
              font-size: 13.5px;
              font-weight: 850;
              margin-top: 8px;
              color: #000;
            }
            .landmark-line {
              font-size: 11px;
              margin-top: 4px;
              font-style: italic;
              color: #444;
            }
            .footer-row {
              padding: 20px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              background: #fafafa;
              gap: 20px;
            }
            .qr-container {
              display: flex;
              flex-direction: column;
              align-items: center;
              width: 100px;
              flex-shrink: 0;
            }
            .qr-code-img {
              width: 85px;
              height: 85px;
              border: 1px solid #000;
              padding: 2px;
              background: #fff;
            }
            .qr-text {
              font-size: 8px;
              font-weight: 900;
              text-transform: uppercase;
              margin-top: 4px;
              color: #000;
              letter-spacing: 0.5px;
            }
            .routing-details {
              flex-grow: 1;
              display: flex;
              flex-direction: column;
              gap: 6px;
            }
            .routing-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 11px;
              font-weight: 700;
              border-bottom: 1px dashed #ddd;
              padding-bottom: 4px;
            }
            .routing-item:last-child {
              border-bottom: none;
              padding-bottom: 0;
            }
            .routing-label {
              color: #555;
              text-transform: uppercase;
              font-size: 9px;
              letter-spacing: 0.5px;
            }
            .routing-val {
              color: #000;
              font-weight: 800;
            }
            .status-green {
              color: #0f766e;
              background: #f0fdfa;
              border: 1px solid #ccfbf1;
              padding: 2px 6px;
              font-size: 9px;
              font-weight: 900;
              border-radius: 2px;
            }
          </style>
        </head>
        <body>
          <div class="label-card">
            <div class="header">
              <div class="logo-container">
                ${settings?.logoUrl 
                  ? `<img src="${settings.logoUrl}" alt="${settings.siteName}" class="logo-img" />`
                  : `<span class="logo-text">${settings?.siteName || "SDC STORE"}</span>`
                }
              </div>
              <div class="label-type-badge">
                ${order.paymentMethod === "COD" ? "COD" : "PREPAID"}
              </div>
            </div>
            
            <div class="barcode-section">
              <img src="https://bwipjs-api.metafloor.com/?bcid=code128&text=${order.id}&scale=2&rotate=N&includeText=true" alt="Order Barcode" class="barcode-img" />
            </div>
            
            <div class="address-grid">
              <div class="grid-col from-col">
                <div class="col-title">Sender (From)</div>
                <div class="brand-name">${settings?.siteName || "SAIDURGA COMPUTERS"}</div>
                <div class="address-details">
                  Main Road, Opp. SDC Plaza,<br/>
                  Computer Sales, Service & Accessories
                </div>
                <div class="phone-line">Ph: +91 9999999999</div>
              </div>

              <div class="grid-col to-col">
                <div class="col-title">Ship To (To)</div>
                <div class="recipient-name">${order.address.name}</div>
                <div class="address-text">
                  ${order.address.street.replace(/\n/g, ", ")},<br/>
                  ${order.address.city}, ${order.address.state} - <strong>${order.address.pincode}</strong>
                </div>
                <div class="phone-line">Ph: ${order.address.phone}</div>
                ${order.address.landmark ? `<div class="landmark-line">Landmark: ${order.address.landmark}</div>` : ""}
              </div>
            </div>

            <div class="footer-row">
              <div class="qr-container">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(validationUrl)}" class="qr-code-img" />
                <span class="qr-text">Scan to Verify</span>
              </div>
              <div class="routing-details">
                <div class="routing-item">
                  <span class="routing-label">Order Ref:</span>
                  <span class="routing-val font-mono">${order.id}</span>
                </div>
                <div class="routing-item">
                  <span class="routing-label">Payment Mode:</span>
                  <span class="routing-val">${order.paymentMethod === "COD" ? "Cash on Delivery" : "Prepaid Online"}</span>
                </div>
                <div class="routing-item">
                  <span class="routing-label">Verification:</span>
                  <span class="routing-val status-green">GENUINE SDC SLIP</span>
                </div>
              </div>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(addressHtml);
    printWindow.document.close();
  };

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5ab946]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-gray-400 text-xs font-semibold uppercase tracking-[0.2em] mb-2">
            <ClipboardList size={14} />
            Purchase Orders
          </div>
          <h2 className="text-2xl font-black text-white">Order Management</h2>
          <p className="text-gray-400 text-sm mt-1">Review customer purchases and move orders through the fulfillment flow.</p>
        </div>
        <Link
          href="/admin"
          className="flex items-center justify-center gap-2 border border-gray-700 hover:border-gray-500 text-gray-200 px-5 py-2.5 rounded-xl font-semibold transition-all text-sm w-full sm:w-auto"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-300 p-4 rounded-xl text-sm">
          {success}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total", value: summaryCounts.total, tone: "text-white" },
          { label: "Pending", value: summaryCounts.PENDING, tone: "text-amber-400" },
          { label: "Processing", value: summaryCounts.PROCESSING, tone: "text-blue-400" },
          { label: "Shipped", value: summaryCounts.SHIPPED, tone: "text-indigo-400" },
          { label: "Delivered", value: summaryCounts.DELIVERED, tone: "text-emerald-400" }
        ].map((card) => (
          <div key={card.label} className="bg-[#111827] border border-gray-800 rounded-2xl p-4 shadow-xl">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{card.label}</p>
            <p className={`text-2xl font-black mt-2 ${card.tone}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#111827] border border-gray-800 rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text"
            placeholder="Search by order id, customer, product, address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-950/50 border border-gray-800 focus:border-[#5ab946] rounded-xl text-sm text-white placeholder:text-gray-500 outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-3">
          <Filter className="text-gray-500 flex-shrink-0" size={18} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as AdminOrderStatus | "ALL")}
            className="bg-gray-950/50 border border-gray-800 focus:border-[#5ab946] rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-colors"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value} className="bg-[#111827] text-white">
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-[#111827] border border-dashed border-gray-700 rounded-2xl p-12 text-center text-gray-400">
            <ShoppingBag size={32} className="mx-auto mb-3 text-gray-500" />
            <p className="font-semibold text-gray-200">No matching orders found.</p>
            <p className="text-sm mt-1">Try a different filter or search term.</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            const itemCount = order.items.reduce((total, item) => total + item.quantity, 0);

            return (
              <div key={order.id} className="bg-[#111827] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
                <button
                  type="button"
                  onClick={() => toggleExpandOrder(order.id)}
                  className="w-full p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-left hover:bg-gray-900/40 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${STATUS_STYLES[order.status]}`}>
                        {order.status}
                      </span>
                      <span className="text-[11px] text-gray-500 font-mono">{order.id}</span>
                    </div>
                    <div className="text-sm font-bold text-white">{order.user.name}</div>
                    <div className="text-xs text-gray-400 flex flex-wrap gap-x-4 gap-y-1">
                      <span>{order.user.email}</span>
                      {order.user.phone && <span>{order.user.phone}</span>}
                      <span>{formatDate(order.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                    <div className="text-right">
                      <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Amount</div>
                      <div className="text-lg font-black text-white">₹{order.totalAmount.toLocaleString("en-IN")}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Items</div>
                      <div className="text-lg font-black text-white">{itemCount}</div>
                    </div>
                    <div className="text-[#5ab946]">
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-800 p-4 sm:p-5 space-y-5">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
                      <div className="bg-gray-950/40 border border-gray-800 rounded-xl p-4 space-y-2">
                        <div className="flex items-center gap-2 text-gray-400 uppercase tracking-wider text-[10px] font-bold">
                          <MapPin size={12} className="text-[#5ab946]" />
                          Shipping Address
                        </div>
                        <div className="text-white font-semibold">{order.address.name}</div>
                        <div className="text-gray-400">
                          {order.address.street.replace('\n', ', ')}, {order.address.city}, {order.address.state} - {order.address.pincode}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {order.address.phone}
                          {order.address.landmark ? ` • ${order.address.landmark}` : ""}
                        </div>
                      </div>

                      <div className="bg-gray-950/40 border border-gray-800 rounded-xl p-4 space-y-2">
                        <div className="flex items-center gap-2 text-gray-400 uppercase tracking-wider text-[10px] font-bold">
                          <Calendar size={12} className="text-[#5ab946]" />
                          Payment & Status
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-gray-400">Payment Method</span>
                          <span className="text-white font-semibold">{order.paymentMethod}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-gray-400">Payment Status</span>
                          <span className={order.paymentStatus === "COMPLETED" ? "text-emerald-400 font-semibold" : "text-amber-400 font-semibold"}>
                            {order.paymentStatus}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-gray-400">Current Order Status</span>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${STATUS_STYLES[order.status]}`}>
                            {order.status}
                          </span>
                        </div>
                      </div>

                      {/* Courier Tracking Link Section (visible after order is accepted: status !== 'PENDING' & status !== 'CANCELLED') */}
                      {order.status !== "PENDING" && order.status !== "CANCELLED" && (
                        <div className="bg-gray-950/40 border border-gray-800 rounded-xl p-4 space-y-3 lg:col-span-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-gray-400 uppercase tracking-wider text-[10px] font-bold">
                              <Truck size={12} className="text-[#5ab946]" />
                              Courier Tracking Link
                            </div>
                            {order.shippingLink && (
                              <a
                                href={order.shippingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-[#5ab946] hover:underline flex items-center gap-1 font-semibold"
                              >
                                Test tracking link &rarr;
                              </a>
                            )}
                          </div>
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              const formData = new FormData(e.currentTarget);
                              const link = formData.get("shippingLink") as string;
                              handleSaveTrackingLink(order.id, link.trim());
                            }}
                            className="flex gap-2"
                          >
                            <input
                              type="url"
                              name="shippingLink"
                              placeholder="Enter Delhivery/DTDC/FedEx tracking link (e.g. https://...)"
                              defaultValue={order.shippingLink || ""}
                              className="flex-1 bg-gray-950 border border-gray-800 focus:border-[#5ab946] rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-gray-600 outline-none transition-colors"
                            />
                            <button
                              type="submit"
                              disabled={savingTrackingOrderId === order.id}
                              className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-semibold bg-[#5ab946] hover:bg-[#4ca03a] text-white transition-colors disabled:opacity-50 min-w-[90px]"
                            >
                              {savingTrackingOrderId === order.id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                "Save Link"
                              )}
                            </button>
                          </form>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Ordered Items</div>
                      <div className="space-y-3">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex gap-3 items-center bg-gray-950/30 border border-gray-800 rounded-xl p-3">
                            <div className="w-14 h-14 bg-white rounded-lg overflow-hidden flex items-center justify-center border border-gray-200 flex-shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={item.product.imageUrl} alt={item.product.title} className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-white line-clamp-1">{item.product.title}</div>
                              <div className="text-xs text-gray-400 mt-1">
                                Qty: {item.quantity} • ₹{item.price.toLocaleString("en-IN")} each
                              </div>
                            </div>
                            <div className="font-mono font-bold text-white">
                              ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2.5 bg-gray-950/60 border border-gray-800 rounded-xl px-3.5 py-2 w-fit">
                        <span className="text-[10px] uppercase font-bold text-gray-400">Update Status:</span>
                        <select
                          value={order.status}
                          disabled={updatingOrderId === order.id}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value as AdminOrderStatus)}
                          className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer focus:text-[#5ab946] transition-colors"
                        >
                          <option value="PENDING" className="bg-[#111827] text-white">Pending</option>
                          <option value="PROCESSING" className="bg-[#111827] text-white">Accepted / Processing</option>
                          <option value="SHIPPED" className="bg-[#111827] text-white">Shipped</option>
                          <option value="DELIVERED" className="bg-[#111827] text-white">Delivered</option>
                          <option value="CANCELLED" className="bg-[#111827] text-red-400 font-semibold">Cancelled</option>
                        </select>
                        {updatingOrderId === order.id && (
                          <Loader2 size={12} className="animate-spin text-[#5ab946] flex-shrink-0" />
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handlePrintLabel(order)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-950/60 border border-gray-800 hover:border-[#5ab946] text-gray-200 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                        title="Print Shipping Label"
                      >
                        <Printer size={14} className="text-[#5ab946]" />
                        <span>Print Label</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
