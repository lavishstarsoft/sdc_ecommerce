"use client";
import React, { useState, useEffect } from "react";
import { 
  getCarousels, 
  saveCarousel, 
  deleteCarousel, 
  getProducts, 
  Product, 
  Carousel 
} from "@/lib/storeService";
import { 
  Plus, 
  Edit, 
  Trash2, 
  X,
  AlertCircle,
  Check,
  Search,
  CheckSquare,
  Square
} from "lucide-react";

export default function AdminCarousels() {
  const [carousels, setCarousels] = useState<Carousel[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCarousel, setEditingCarousel] = useState<Carousel | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [displayOrder, setDisplayOrder] = useState("0");
  const [layout, setLayout] = useState("CAROUSEL"); // "CAROUSEL" or "GRID"
  const [sourceType, setSourceType] = useState("MANUAL"); // "MANUAL", "BEST_SELLERS", "OFFERS", "CATEGORY"
  const [sourceValue, setSourceValue] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState("");

  // Status states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [carouselsData, productsData] = await Promise.all([
        getCarousels(),
        getProducts()
      ]);
      setCarousels(carouselsData);
      setProducts(productsData);
    } catch (err) {
      console.error("Failed to load carousels data:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenAddModal = () => {
    setEditingCarousel(null);
    setTitle("");
    setDisplayOrder(carousels.length.toString());
    setLayout("CAROUSEL");
    setSourceType("MANUAL");
    setSourceValue("");
    setSelectedProductIds([]);
    setProductSearch("");
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (carousel: Carousel) => {
    setEditingCarousel(carousel);
    setTitle(carousel.title);
    setDisplayOrder((carousel.display_order ?? 0).toString());
    setLayout(carousel.layout || "CAROUSEL");
    setSourceType(carousel.source_type || "MANUAL");
    setSourceValue(carousel.source_value || "");
    setSelectedProductIds(carousel.product_ids || []);
    setProductSearch("");
    setError(null);
    setIsModalOpen(true);
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!title) {
      setError("Please specify a title for the section.");
      return;
    }

    const orderNum = parseInt(displayOrder);
    if (isNaN(orderNum)) {
      setError("Display order must be an integer.");
      return;
    }

    setSubmitting(true);
    
    try {
      const payload: Omit<Carousel, "id"> & { id?: string } = {
        title,
        product_ids: selectedProductIds,
        display_order: orderNum,
        layout,
        source_type: sourceType,
        source_value: sourceValue
      };

      if (editingCarousel) {
        payload.id = editingCarousel.id;
      }

      await saveCarousel(payload);
      setSuccess(editingCarousel ? "Homepage section updated successfully!" : "Homepage section added successfully!");
      setIsModalOpen(false);
      await loadData();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save homepage section.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this carousel?")) return;
    
    try {
      await deleteCarousel(id);
      setSuccess("Carousel deleted successfully!");
      await loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to delete carousel.");
    }
  };

  // Filter products by search query inside the modal
  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(productSearch.toLowerCase()) || 
    p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white">Homepage Carousels</h2>
          <p className="text-gray-400 text-sm mt-1">Configure the product showcase slider sections on your homepage.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 bg-[#5ab946] hover:bg-[#4ca03a] text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-[#5ab946]/10 transition-all active:scale-95 text-sm w-full sm:w-auto"
        >
          <Plus size={18} />
          Create Carousel
        </button>
      </div>

      {/* Messages */}
      {success && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-4 rounded-xl flex items-center gap-3 text-sm">
          <Check size={18} className="flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Carousels List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#5ab946]"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {carousels.map((carousel) => {
            // Count products that actually exist in the products catalog
            const productsInCarousel = products.filter(p => carousel.product_ids?.includes(p.id));
            
            return (
              <div key={carousel.id} className="bg-[#111827] border border-gray-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-gray-700 transition-colors">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] text-gray-500 font-bold uppercase bg-gray-950 px-2 py-0.5 rounded border border-gray-800">
                      Order: {carousel.display_order ?? 0}
                    </span>
                    <span className="text-[10px] text-[#5ab946] font-bold uppercase bg-[#5ab946]/10 px-2 py-0.5 rounded border border-[#5ab946]/20">
                      Layout: {carousel.layout || "CAROUSEL"}
                    </span>
                    <span className="text-[10px] text-blue-400 font-bold uppercase bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                      Source: {carousel.source_type || "MANUAL"} {carousel.source_type === "CATEGORY" ? `(${carousel.source_value})` : ""}
                    </span>
                    {carousel.source_type === "MANUAL" && (
                      <span className="text-[10px] text-purple-400 font-bold uppercase bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                        {productsInCarousel.length} Products
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-white">{carousel.title}</h3>
                  
                  {/* Small Horizontal Preview of Products inside this carousel */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {productsInCarousel.slice(0, 8).map(p => (
                      <div key={p.id} className="h-10 w-10 bg-gray-950 rounded border border-gray-800 flex items-center justify-center overflow-hidden relative" title={p.title}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.image_url} alt={p.title} className="h-full w-full object-cover" />
                      </div>
                    ))}
                    {productsInCarousel.length > 8 && (
                      <div className="h-10 w-10 bg-gray-950 rounded border border-gray-800 flex items-center justify-center text-xs font-bold text-gray-400">
                        +{productsInCarousel.length - 8}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 self-end md:self-center">
                  <button
                    onClick={() => handleOpenEditModal(carousel)}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-gray-350 hover:text-white bg-gray-850 hover:bg-gray-800 rounded-xl border border-gray-800 hover:border-gray-700 transition-all"
                  >
                    <Edit size={14} />
                    Edit Products
                  </button>
                  <button
                    onClick={() => handleDelete(carousel.id)}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-all"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}

          {carousels.length === 0 && (
            <div className="text-center py-20 bg-[#111827] border border-gray-800 rounded-2xl text-gray-500">
              No carousels configured. Set up sliders to show off handpicked recommendations!
            </div>
          )}
        </div>
      )}

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-gray-800 w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-800 flex items-center justify-between flex-shrink-0">
              <h3 className="text-lg font-bold text-white">
                {editingCarousel ? "Configure Carousel" : "Create Carousel"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body / Scrollable Form */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl flex items-center gap-2 text-xs">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Title & Order */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Section Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Clearance Deals | Up to 70% off"
                    className="w-full bg-gray-950/60 border border-gray-800 focus:border-[#5ab946] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Display Order *</label>
                  <input
                    type="number"
                    required
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(e.target.value)}
                    placeholder="0"
                    className="w-full bg-gray-950/60 border border-gray-800 focus:border-[#5ab946] rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Layout & Source Configuration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Layout Style</label>
                  <select
                    value={layout}
                    onChange={(e) => setLayout(e.target.value)}
                    className="w-full bg-gray-950/60 border border-gray-800 focus:border-[#5ab946] rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                  >
                    <option value="CAROUSEL">Horizontal Swipe Carousel</option>
                    <option value="GRID">Product Grid Layout</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Product Data Source</label>
                  <select
                    value={sourceType}
                    onChange={(e) => setSourceType(e.target.value)}
                    className="w-full bg-gray-950/60 border border-gray-800 focus:border-[#5ab946] rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                  >
                    <option value="MANUAL">Manual (Handpick from catalog)</option>
                    <option value="BEST_SELLERS">Best Sellers (Top 6 Items)</option>
                    <option value="OFFERS">Special Offers (Items under 40k)</option>
                    <option value="CATEGORY">Filter by Category</option>
                  </select>
                </div>
              </div>

              {/* Conditional Category Name input */}
              {sourceType === "CATEGORY" && (
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Category Name *</label>
                  <input
                    type="text"
                    required
                    value={sourceValue}
                    onChange={(e) => setSourceValue(e.target.value)}
                    placeholder="e.g. Laptops"
                    className="w-full bg-gray-950/60 border border-gray-800 focus:border-[#5ab946] rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                  />
                </div>
              )}

              {/* Product Selector - Only render if manual selection is enabled */}
              {sourceType === "MANUAL" && (
                <div className="pt-4 border-t border-gray-800/80 flex flex-col space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-gray-400 uppercase">Select Products ({selectedProductIds.length} Selected)</label>
                    <span className="text-[10px] text-gray-500 italic">Toggle products to include</span>
                  </div>

                  {/* Product Search Box */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                    <input
                      type="text"
                      placeholder="Search catalog products..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-gray-950/80 border border-gray-850 rounded-lg text-xs text-white placeholder:text-gray-655 outline-none focus:border-[#5ab946]"
                    />
                  </div>

                  {/* Checklist Container */}
                  <div className="border border-gray-800 bg-gray-950/50 rounded-xl divide-y divide-gray-900/60 max-h-[220px] overflow-y-auto">
                    {filteredProducts.map((p) => {
                      const isSelected = selectedProductIds.includes(p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => toggleProductSelection(p.id)}
                          className={`flex items-center justify-between p-3 cursor-pointer transition-colors hover:bg-gray-800/20 select-none
                            ${isSelected ? "bg-[#5ab946]/5" : ""}
                          `}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Thumbnail */}
                            <div className="h-8 w-8 rounded bg-gray-950 border border-gray-850 overflow-hidden relative flex-shrink-0 flex items-center justify-center">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={p.image_url} alt={p.title} className="h-full w-full object-cover" />
                            </div>
                            <div className="text-left min-w-0">
                              <p className="text-xs font-bold text-white truncate max-w-[280px]">{p.title}</p>
                              <p className="text-[10px] text-gray-500 mt-0.5">{p.category} • ₹{p.price.toLocaleString("en-IN")}</p>
                            </div>
                          </div>

                          {/* Checkbox */}
                          <div className={`flex-shrink-0 transition-colors ${isSelected ? "text-[#5ab946]" : "text-gray-600"}`}>
                            {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                          </div>
                        </div>
                      );
                    })}
                    {filteredProducts.length === 0 && (
                      <p className="text-center py-8 text-xs text-gray-550 italic">No products found in catalog.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800 mt-6 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700/80 text-gray-200 text-sm font-semibold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-[#5ab946] hover:bg-[#4ca03a] text-white text-sm font-semibold rounded-xl shadow-lg shadow-[#5ab946]/10 disabled:opacity-50 transition-all"
                >
                  {submitting ? "Saving..." : (editingCarousel ? "Save Changes" : "Create Carousel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
