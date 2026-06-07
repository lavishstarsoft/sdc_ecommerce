"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  getProducts, 
  getBanners, 
  getCategoryGrids, 
  getCarousels,
  saveProduct,
  Product,
  Banner,
  CategoryGrid,
  Carousel
} from "@/lib/storeService";
import { 
  ShoppingBag, 
  Image as ImageIcon, 
  Grid, 
  Sliders, 
  ClipboardList,
  Plus, 
  ArrowRight,
  Database,
  Cloud,
  CheckCircle,
  AlertTriangle,
  Settings,
  ExternalLink,
  Activity,
  Heart,
  FileText,
  Zap,
  Sparkles,
  DollarSign,
  TrendingUp,
  Users,
  Package,
  AlertCircle,
  LineChart
} from "lucide-react";

interface AdminOrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    title: string;
    imageUrl: string;
  };
}

interface AdminOrder {
  id: string;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  items: AdminOrderItem[];
}

export default function AdminOverview() {
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [grids, setGrids] = useState<CategoryGrid[]>([]);
  const [carousels, setCarousels] = useState<Carousel[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [availableCategories, setAvailableCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Computed dashboard metrics
  const activeOrders = React.useMemo(() => orders.filter(o => o.status !== "CANCELLED"), [orders]);
  const totalRevenue = React.useMemo(() => activeOrders.reduce((sum, o) => sum + o.totalAmount, 0), [activeOrders]);

  const codRevenue = React.useMemo(() => activeOrders.filter(o => o.paymentMethod === "COD").reduce((sum, o) => sum + o.totalAmount, 0), [activeOrders]);
  const onlineRevenue = React.useMemo(() => activeOrders.filter(o => o.paymentMethod === "ONLINE").reduce((sum, o) => sum + o.totalAmount, 0), [activeOrders]);

  const aov = React.useMemo(() => activeOrders.length > 0 ? totalRevenue / activeOrders.length : 0, [activeOrders, totalRevenue]);
  const activeCustomersCount = React.useMemo(() => new Set(orders.map(o => o.user.id)).size, [orders]);

  const pendingOrders = React.useMemo(() => orders.filter(o => o.status === "PENDING").length, [orders]);
  const processingOrders = React.useMemo(() => orders.filter(o => o.status === "PROCESSING").length, [orders]);
  const shippedOrders = React.useMemo(() => orders.filter(o => o.status === "SHIPPED").length, [orders]);
  const deliveredOrders = React.useMemo(() => orders.filter(o => o.status === "DELIVERED").length, [orders]);
  const cancelledOrders = React.useMemo(() => orders.filter(o => o.status === "CANCELLED").length, [orders]);

  // Stock / Inventory calculation based on 15 base stock minus sold items
  const productsWithStock = React.useMemo(() => {
    const orderedQuantities: Record<string, number> = {};
    orders.forEach(order => {
      if (order.status !== "CANCELLED") {
        order.items.forEach(item => {
          orderedQuantities[item.product.id] = (orderedQuantities[item.product.id] || 0) + item.quantity;
        });
      }
    });

    return products.map(p => {
      const sold = orderedQuantities[p.id] || 0;
      const remainingStock = Math.max(0, 15 - sold);
      return {
        ...p,
        sold,
        remainingStock
      };
    });
  }, [products, orders]);

  const lowStockItems = React.useMemo(() => productsWithStock.filter(p => p.remainingStock <= 5), [productsWithStock]);
  const bestSellers = React.useMemo(() => {
    return [...productsWithStock]
      .filter(p => p.sold > 0)
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);
  }, [productsWithStock]);

  // Quick Add Product Form States
  const [quickTitle, setQuickTitle] = useState("");
  const [quickPrice, setQuickPrice] = useState("");
  const [quickCategory, setQuickCategory] = useState("Laptops");
  const [quickImageUrl, setQuickImageUrl] = useState("");
  const [quickSubmitting, setQuickSubmitting] = useState(false);
  const [quickError, setQuickError] = useState<string | null>(null);
  const [quickSuccess, setQuickSuccess] = useState<string | null>(null);

  const isSupabaseActive = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isR2Active = !!process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL;

  useEffect(() => {
    async function loadData() {
      try {
        const [p, b, g, c, ordersRes, catRes] = await Promise.all([
          getProducts(),
          getBanners(),
          getCategoryGrids(),
          getCarousels(),
          fetch("/api/admin/orders"),
          fetch("/api/categories")
        ]);
        setProducts(p);
        setBanners(b);
        setGrids(g);
        setCarousels(c);
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          setOrders(ordersData);
        }
        if (catRes.ok) {
          const cats = await catRes.json();
          setAvailableCategories(cats);
          if (cats.length > 0) {
            setQuickCategory(cats[0].name);
          }
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuickError(null);
    setQuickSuccess(null);

    if (!quickTitle || !quickPrice || !quickImageUrl) {
      setQuickError("Please fill out all fields.");
      return;
    }

    const priceNum = parseFloat(quickPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setQuickError("Please enter a valid price.");
      return;
    }

    setQuickSubmitting(true);
    try {
      const newProd = await saveProduct({
        title: quickTitle,
        price: priceNum,
        category: quickCategory,
        image_url: quickImageUrl,
        description: "Quickly added via dashboard overview."
      });

      setQuickSuccess(`Product "${newProd.title}" added successfully!`);
      setQuickTitle("");
      setQuickPrice("");
      setQuickImageUrl("");
      
      // Refresh list immediately
      const p = await getProducts();
      setProducts(p);
      
      setTimeout(() => setQuickSuccess(null), 4000);
    } catch (err: any) {
      setQuickError(err.message || "Failed to add product.");
    } finally {
      setQuickSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5ab946]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-7xl">
      {/* Welcome Panel - WordPress Style */}
      <div className="bg-[#111827] border-l-4 border-[#5ab946] border-y border-r border-gray-800 rounded-r-2xl p-6 shadow-xl space-y-4">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight sm:text-2xl flex items-center gap-2">
            Welcome to your SDC Store Dashboard!
          </h2>
          <p className="text-gray-400 text-sm mt-1">We&apos;ve assembled some links to get you started with managing your storefront configurations and inventory:</p>
        </div>

        {/* 3-Column WP Layout Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 border-t border-gray-800/80">
          {/* Column 1 */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Get Started</h3>
            <Link 
              href="/admin/settings"
              className="inline-flex items-center gap-2 bg-[#5ab946] hover:bg-[#4ca03a] text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-[#5ab946]/10"
            >
              <Settings size={14} />
              Customize Site Title & Logo
            </Link>
            <p className="text-[11px] text-gray-500">Edit website brand titles, upload site logos, and customize copyright footers.</p>
          </div>

          {/* Column 2 */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Next Steps</h3>
            <ul className="text-xs space-y-2">
              <li>
                <Link href="/admin/products" className="text-gray-400 hover:text-[#5ab946] flex items-center gap-1.5 transition-colors">
                  <ShoppingBag size={14} />
                  <span>Manage Products Catalog</span>
                </Link>
              </li>
              <li>
                <Link href="/admin/orders" className="text-gray-400 hover:text-[#5ab946] flex items-center gap-1.5 transition-colors">
                  <ClipboardList size={14} />
                  <span>Manage Customer Orders</span>
                </Link>
              </li>
              <li>
                <Link href="/admin/banners" className="text-gray-400 hover:text-[#5ab946] flex items-center gap-1.5 transition-colors">
                  <ImageIcon size={14} />
                  <span>Manage Slider Hero Banners</span>
                </Link>
              </li>
              <li>
                <Link href="/admin/carousels" className="text-gray-400 hover:text-[#5ab946] flex items-center gap-1.5 transition-colors">
                  <Sliders size={14} />
                  <span>Configure Homepage Carousels</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3 */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">More Actions</h3>
            <ul className="text-xs space-y-2">
              <li>
                <Link href="/admin/categories" className="text-gray-400 hover:text-[#5ab946] flex items-center gap-1.5 transition-colors">
                  <Grid size={14} />
                  <span>Manage Homepage Category Grids</span>
                </Link>
              </li>
              <li>
                <Link href="/" target="_blank" className="text-[#5ab946] hover:text-white flex items-center gap-1.5 transition-colors font-semibold">
                  <ExternalLink size={14} />
                  <span>View live storefront</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Main Dashboard Widget Grid (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Analytics Summary Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Revenue */}
            <div className="bg-[#111827] border border-gray-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 text-emerald-500/5 group-hover:scale-110 transition-transform duration-300">
                <DollarSign size={80} />
              </div>
              <div className="flex items-center justify-between mb-3.5">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total Earnings</span>
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg"><TrendingUp size={16} /></div>
              </div>
              <h4 className="text-xl font-mono font-black text-white">₹{totalRevenue.toLocaleString("en-IN")}</h4>
              <div className="flex items-center gap-2 mt-2.5 text-[9px] text-gray-500 font-semibold">
                <span className="text-emerald-500">COD: ₹{codRevenue.toLocaleString("en-IN")}</span>
                <span className="text-blue-500">Online: ₹{onlineRevenue.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Total Orders */}
            <div className="bg-[#111827] border border-gray-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 text-amber-500/5 group-hover:scale-110 transition-transform duration-300">
                <ClipboardList size={80} />
              </div>
              <div className="flex items-center justify-between mb-3.5">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total Orders</span>
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg"><ClipboardList size={16} /></div>
              </div>
              <h4 className="text-xl font-mono font-black text-white">{orders.length}</h4>
              <div className="flex items-center gap-2 mt-2.5 text-[9px] text-gray-500 font-semibold">
                <span className="text-amber-500">Pending: {pendingOrders}</span>
                <span className="text-emerald-500">Delivered: {deliveredOrders}</span>
              </div>
            </div>

            {/* Average Order Value */}
            <div className="bg-[#111827] border border-gray-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 text-blue-500/5 group-hover:scale-110 transition-transform duration-300">
                <LineChart size={80} />
              </div>
              <div className="flex items-center justify-between mb-3.5">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Average Order Value</span>
                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg"><LineChart size={16} /></div>
              </div>
              <h4 className="text-xl font-mono font-black text-white">₹{Math.round(aov).toLocaleString("en-IN")}</h4>
              <div className="text-[9px] text-gray-550 font-semibold mt-2.5">
                Average amount spent per order
              </div>
            </div>

            {/* Active Customers */}
            <div className="bg-[#111827] border border-gray-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 text-indigo-500/5 group-hover:scale-110 transition-transform duration-300">
                <Users size={80} />
              </div>
              <div className="flex items-center justify-between mb-3.5">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Active Customers</span>
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg"><Users size={16} /></div>
              </div>
              <h4 className="text-xl font-mono font-black text-white">{activeCustomersCount}</h4>
              <div className="text-[9px] text-gray-550 font-semibold mt-2.5">
                Unique purchasing accounts
              </div>
            </div>
          </div>

          {/* Order Status Breakdown */}
          <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-gray-800 pb-3">
              Order Status Breakdown
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
              <div className="bg-[#0b0f19] border border-amber-500/20 p-3.5 rounded-xl text-center space-y-1">
                <span className="text-2xl font-mono font-black text-amber-500">{pendingOrders}</span>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Pending</p>
              </div>
              <div className="bg-[#0b0f19] border border-blue-500/20 p-3.5 rounded-xl text-center space-y-1">
                <span className="text-2xl font-mono font-black text-blue-400">{processingOrders}</span>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Processing</p>
              </div>
              <div className="bg-[#0b0f19] border border-indigo-500/20 p-3.5 rounded-xl text-center space-y-1">
                <span className="text-2xl font-mono font-black text-indigo-400">{shippedOrders}</span>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Shipped</p>
              </div>
              <div className="bg-[#0b0f19] border border-emerald-500/20 p-3.5 rounded-xl text-center space-y-1">
                <span className="text-2xl font-mono font-black text-emerald-400">{deliveredOrders}</span>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Delivered</p>
              </div>
              <div className="bg-[#0b0f19] border border-red-500/20 p-3.5 rounded-xl text-center space-y-1">
                <span className="text-2xl font-mono font-black text-red-400">{cancelledOrders}</span>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Cancelled</p>
              </div>
            </div>
          </div>

          {/* Stock / Quantity Management Panel */}
          <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 shadow-xl space-y-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-3">
              <Package className="text-[#5ab946]" size={18} />
              Stock & Inventory Management
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Low Stock Alerts */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="text-red-400" size={16} />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Low Stock Warnings</h4>
                </div>
                
                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {lowStockItems.map((prod) => (
                    <div key={prod.id} className="bg-gray-950/20 border border-red-500/10 p-3 rounded-xl flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-white truncate">{prod.title}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex-1 bg-gray-800 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-red-500 h-full rounded-full" 
                              style={{ width: `${(prod.remainingStock / 15) * 100}%` }}
                            />
                          </div>
                          <span className="text-[9px] font-bold text-red-400 shrink-0">{prod.remainingStock} left</span>
                        </div>
                      </div>
                      <span className="text-[8px] font-black text-red-500 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-sm uppercase tracking-wider">Restock</span>
                    </div>
                  ))}
                  {lowStockItems.length === 0 && (
                    <div className="py-6 text-center text-xs text-gray-500 bg-gray-950/20 border border-gray-850 rounded-xl">
                      All products have healthy stock levels.
                    </div>
                  )}
                </div>
              </div>

              {/* Best Sellers */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-yellow-400" size={16} />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Best Sellers / Popular</h4>
                </div>
                
                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {bestSellers.map((prod) => (
                    <div key={prod.id} className="bg-gray-950/20 border border-gray-850 p-2.5 rounded-xl flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded bg-gray-850 overflow-hidden flex-shrink-0 flex items-center justify-center border border-gray-805">
                          <img src={prod.image_url} alt="" className="object-cover h-full w-full" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-white truncate leading-tight">{prod.title}</p>
                          <span className="text-[9px] text-gray-500 font-semibold">{prod.sold} units sold</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-[#5ab946] shrink-0">₹{(prod.sold * prod.price).toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                  {bestSellers.length === 0 && (
                    <div className="py-6 text-center text-xs text-gray-500 bg-gray-950/20 border border-gray-850 rounded-xl">
                      No orders recorded yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Activity Widget */}
          <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="text-blue-400" size={18} />
                Recent Activity
              </h3>
              <span className="text-xs text-gray-500">Latest additions</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-400">
                <thead className="text-xs uppercase text-gray-500 border-b border-gray-800/60">
                  <tr>
                    <th className="pb-2.5 font-semibold">Product Title</th>
                    <th className="pb-2.5 font-semibold">Category</th>
                    <th className="pb-2.5 font-semibold text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/40">
                  {products.slice(0, 5).map((product) => (
                    <tr key={product.id} className="group hover:bg-gray-950/20 transition-colors">
                      <td className="py-2.5 flex items-center gap-3">
                        <div className="h-9 w-9 bg-gray-800 rounded overflow-hidden flex items-center justify-center relative flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={product.image_url} 
                            alt={product.title} 
                            className="h-full w-full object-cover" 
                          />
                        </div>
                        <span className="font-semibold text-white group-hover:text-[#5ab946] transition-colors truncate max-w-[220px]">
                          {product.title}
                        </span>
                      </td>
                      <td className="py-2.5 text-xs text-gray-500">{product.category}</td>
                      <td className="py-2.5 text-right font-mono font-bold text-white">
                        ₹{product.price.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-gray-500 italic">
                        No products inside database. Add products to populate catalog.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Orders Widget */}
          <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ClipboardList className="text-[#5ab946]" size={18} />
                Recent Orders
              </h3>
              <Link href="/admin/orders" className="text-xs text-gray-500 hover:text-[#5ab946] transition-colors">
                View all
              </Link>
            </div>

            <div className="space-y-3">
              {orders.slice(0, 5).map((order) => (
                <Link
                  key={order.id}
                  href="/admin/orders"
                  className="flex items-center justify-between gap-3 bg-gray-950/30 border border-gray-800/80 hover:border-gray-700 rounded-xl p-3 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{order.user.name}</div>
                    <div className="text-[11px] text-gray-500 font-mono">{order.id.slice(0, 8)}...</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-white">₹{order.totalAmount.toLocaleString("en-IN")}</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">{order.status}</div>
                  </div>
                </Link>
              ))}

              {orders.length === 0 && (
                <div className="py-4 text-center text-sm text-gray-500 italic">
                  No orders yet.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column (1/3 width) */}
        <div className="space-y-6">
          
          {/* Quick Draft / Add Product Widget */}
          <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-3">
              <FileText className="text-emerald-400" size={18} />
              Quick Add Product
            </h3>
            
            {quickSuccess && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-3 rounded-xl flex items-start gap-2.5 text-xs">
                <CheckCircle size={14} className="mt-0.5 flex-shrink-0" />
                <span>{quickSuccess}</span>
              </div>
            )}

            {quickError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl flex items-start gap-2.5 text-xs">
                <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                <span>{quickError}</span>
              </div>
            )}

            <form onSubmit={handleQuickAdd} className="space-y-3.5">
              <div>
                <input 
                  type="text" 
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  placeholder="Product Title" 
                  className="w-full bg-gray-950/60 border border-gray-800 focus:border-[#5ab946] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-gray-600 outline-none transition-colors"
                />
              </div>

              <div>
                <input 
                  type="number" 
                  value={quickPrice}
                  onChange={(e) => setQuickPrice(e.target.value)}
                  placeholder="Price (INR)" 
                  className="w-full bg-gray-950/60 border border-gray-800 focus:border-[#5ab946] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-gray-600 outline-none transition-colors"
                />
              </div>

              <div>
                <select
                  value={quickCategory}
                  onChange={(e) => setQuickCategory(e.target.value)}
                  className="w-full bg-gray-950/60 border border-gray-800 focus:border-[#5ab946] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-colors"
                >
                  {(availableCategories.length > 0 ? availableCategories.map(c => c.name) : ["Laptops", "Component Parts", "Hot Accessories", "Printers & CCTV", "Quick Service Desk"]).map(catName => (
                    <option key={catName} value={catName} className="bg-[#111827]">{catName}</option>
                  ))}
                </select>
              </div>

              <div>
                <input 
                  type="text" 
                  value={quickImageUrl}
                  onChange={(e) => setQuickImageUrl(e.target.value)}
                  placeholder="Image URL (e.g. Picsum seed)" 
                  className="w-full bg-gray-950/60 border border-gray-800 focus:border-[#5ab946] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-gray-600 outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={quickSubmitting}
                className="w-full bg-gray-800 hover:bg-[#5ab946] hover:text-white text-gray-200 text-xs font-semibold py-2.5 rounded-xl transition-all shadow-md hover:shadow-[#5ab946]/10 flex items-center justify-center gap-1.5 active:scale-98 disabled:opacity-50"
              >
                {quickSubmitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Plus size={14} />
                    <span>Quick Add</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Site Health / System Status Widget */}
          <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-3">
              <Heart className="text-red-500" size={18} />
              Site Health / Status
            </h3>

            <div className="space-y-3.5">
              {/* Supabase */}
              <div className="flex items-start gap-2.5 bg-gray-950/30 p-3 rounded-xl border border-gray-800/80">
                {isSupabaseActive ? (
                  <CheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={15} />
                ) : (
                  <AlertTriangle className="text-yellow-500 mt-0.5 flex-shrink-0 animate-pulse" size={15} />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Database size={12} className="text-blue-400" />
                    <span className="text-xs font-bold text-white">Database</span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-medium">
                    {isSupabaseActive ? "Connected to Supabase DB" : "LocalStorage Fallback Mode"}
                  </span>
                </div>
              </div>

              {/* Cloudflare R2 */}
              <div className="flex items-start gap-2.5 bg-gray-950/30 p-3 rounded-xl border border-gray-800/80">
                {isR2Active ? (
                  <CheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={15} />
                ) : (
                  <AlertTriangle className="text-yellow-500 mt-0.5 flex-shrink-0 animate-pulse" size={15} />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Cloud size={12} className="text-[#f38020]" />
                    <span className="text-xs font-bold text-white">R2 Storage</span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-medium">
                    {isR2Active ? "Connected to Cloudflare R2" : "Picsum Image Fallback Mode"}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

