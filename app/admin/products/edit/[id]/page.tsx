"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { saveProduct } from "@/lib/storeService";
import { 
  ArrowLeft,
  Upload, 
  AlertCircle,
  Check,
  Package,
  Layers,
  DollarSign,
  FileText,
  Bookmark,
  ShieldAlert,
  Maximize,
  Scale,
  Image as ImageIcon,
  Loader2,
  X,
  Plus
} from "lucide-react";
import Link from "next/link";

type DeliverySlabForm = {
  minQty: string;
  maxQty: string;
  charge: string;
};

const createDeliverySlab = (minQty = "", maxQty = "", charge = ""): DeliverySlabForm => ({
  minQty,
  maxQty,
  charge,
});

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [mrp, setMrp] = useState("");
  const [category, setCategory] = useState("Laptops");
  const [customCategory, setCustomCategory] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [specsLayout, setSpecsLayout] = useState("TABLE");
  const [specsText, setSpecsText] = useState("");
  const [freeDelivery, setFreeDelivery] = useState(true);
  const [deliverySlabs, setDeliverySlabs] = useState<DeliverySlabForm[]>([]);
  const [allowCOD, setAllowCOD] = useState(true);
  const [allowOnline, setAllowOnline] = useState(true);
  const [returnPolicy, setReturnPolicy] = useState("7 Days Return");
  const [warranty, setWarranty] = useState("1 Year SDC Store warranty card");
  const [offers, setOffers] = useState<{ title: string; description: string }[]>([]);

  const handleAddOffer = () => {
    setOffers(prev => [...prev, { title: "", description: "" }]);
  };

  const handleRemoveOffer = (idx: number) => {
    setOffers(prev => prev.filter((_, i) => i !== idx));
  };

  const handleOfferChange = (idx: number, field: "title" | "description", val: string) => {
    setOffers(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };
  const [tableRows, setTableRows] = useState<{ label: string; value: string }[]>([
    { label: "Brand", value: "Saidurga Premium" },
    { label: "Warranty Details", value: "1 Year SDC Store warranty card" },
    { label: "Item Dimensions", value: "45 x 30 x 12 cm" },
    { label: "Package Weight", value: "1.8 Kilograms" },
  ]);

  const handleTableRowChange = (idx: number, field: "label" | "value", val: string) => {
    setTableRows(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleAddTableRow = () => {
    setTableRows(prev => [...prev, { label: "", value: "" }]);
  };

  const handleRemoveTableRow = (idx: number) => {
    setTableRows(prev => prev.filter((_, i) => i !== idx));
  };

  const handleFreeDeliveryChange = (checked: boolean) => {
    setFreeDelivery(checked);
    if (!checked && deliverySlabs.length === 0) {
      setDeliverySlabs([createDeliverySlab()]);
    }
  };

  const handleAddDeliverySlab = () => {
    setDeliverySlabs(prev => [...prev, createDeliverySlab()]);
  };

  const handleRemoveDeliverySlab = (idx: number) => {
    setDeliverySlabs(prev => prev.filter((_, i) => i !== idx));
  };

  const handleDeliverySlabChange = (idx: number, field: keyof DeliverySlabForm, value: string) => {
    setDeliverySlabs(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const [availableCategories, setAvailableCategories] = useState<{ id: string; name: string }[]>([]);
  
  // Status states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch categories
      const catRes = await fetch("/api/categories");
      let cats: { id: string; name: string }[] = [];
      if (catRes.ok) {
        const data = await catRes.json();
        setAvailableCategories(data);
        cats = data;
      }

      // 2. Fetch product by ID
      const prodRes = await fetch(`/api/products/${id}`);
      if (!prodRes.ok) throw new Error("Failed to load product details.");
      const product = await prodRes.json();
      
      setTitle(product.title);
      setDescription(product.description || "");
      setPrice(product.price.toString());
      setMrp(product.mrp ? product.mrp.toString() : "");
      
      const standardCats = cats.length > 0 
        ? cats.map(c => c.name) 
        : ["Laptops", "Component Parts", "Hot Accessories", "Printers & CCTV", "Quick Service Desk"];
        
      if (standardCats.includes(product.category)) {
        setCategory(product.category);
        setCustomCategory("");
      } else {
        setCategory("Other");
        setCustomCategory(product.category);
      }
      
      setImageUrl(product.image_url);
      const initialGallery = product.gallery_images && product.gallery_images.length > 0
        ? product.gallery_images
        : [product.image_url_2, product.image_url_3].filter(Boolean);
      setGalleryImages(initialGallery);
      
      const hasFreeDelivery = product.free_delivery ?? true;
      setFreeDelivery(hasFreeDelivery);
      const initialSlabs = Array.isArray(product.delivery_slabs) && product.delivery_slabs.length > 0
        ? product.delivery_slabs.map((slab: { min_qty: number; max_qty?: number | null; charge: number }) => ({
            minQty: String(slab.min_qty ?? ""),
            maxQty: slab.max_qty === null || slab.max_qty === undefined ? "" : String(slab.max_qty),
            charge: String(slab.charge ?? ""),
          }))
        : hasFreeDelivery
          ? []
          : [createDeliverySlab("1", "", String(product.delivery_charge ?? 0))];
      setDeliverySlabs(initialSlabs);
      setAllowCOD(product.allow_cod ?? true);
      setAllowOnline(product.allow_online ?? true);
      setReturnPolicy(product.return_policy ?? "7 Days Return");
      setWarranty(product.warranty ?? "1 Year SDC Store warranty card");
      
      let parsedOffers = [];
      if (product.offers) {
        try {
          parsedOffers = typeof product.offers === 'string' ? JSON.parse(product.offers) : product.offers;
        } catch (e) {
          console.error("Failed to parse offers in edit initialization:", e);
        }
      }
      setOffers(parsedOffers);
      
      const layout = product.specs_layout || "TABLE";
      setSpecsLayout(layout);
      
      if (layout === "PARAGRAPH") {
        setSpecsText(product.specs_content || "");
        setTableRows([
          { label: "Brand", value: product.brand || "Saidurga Premium" },
          { label: "Warranty Details", value: product.warranty || "1 Year SDC Store warranty card" },
          { label: "Item Dimensions", value: product.dimensions || "45 x 30 x 12 cm" },
          { label: "Package Weight", value: product.weight || "1.8 Kilograms" },
        ]);
      } else {
        setSpecsText("");
        let parsedRows = [];
        if (product.specs_content) {
          try {
            const parsed = JSON.parse(product.specs_content);
            if (Array.isArray(parsed)) {
              parsedRows = parsed;
            }
          } catch (e) {
            console.error("Failed to parse specs_content:", e);
          }
        }
        
        if (parsedRows.length === 0) {
          parsedRows = [
            { label: "Brand", value: product.brand || "Saidurga Premium" },
            { label: "Warranty Details", value: product.warranty || "1 Year SDC Store warranty card" },
            { label: "Item Dimensions", value: product.dimensions || "45 x 30 x 12 cm" },
            { label: "Package Weight", value: product.weight || "1.8 Kilograms" },
          ];
        }
        setTableRows(parsedRows);
      }
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load product details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      const timer = window.setTimeout(() => {
        void loadInitialData();
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [id, loadInitialData]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(fieldName);
    setError(null);
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload image");
      
      if (fieldName === "imageUrl") setImageUrl(data.url);
      
      if (data.isMock) {
        setSuccess("Mock mode: uploaded image fallbacked to Picsum URL");
        setTimeout(() => setSuccess(null), 3500);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to upload image");
    } finally {
      setUploadingField(null);
    }
  };

  const handleGalleryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(`gallery-${index}`);
    setError(null);
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload image");
      
      setGalleryImages(prev => {
        const copy = [...prev];
        copy[index] = data.url;
        return copy;
      });
      
      if (data.isMock) {
        setSuccess("Mock mode: uploaded image fallbacked to Picsum URL");
        setTimeout(() => setSuccess(null), 3500);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to upload image");
    } finally {
      setUploadingField(null);
    }
  };

  const handleAddGalleryImage = () => {
    setGalleryImages(prev => [...prev, ""]);
  };

  const handleRemoveGalleryImage = (index: number) => {
    setGalleryImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleGalleryImageUrlChange = (index: number, url: string) => {
    setGalleryImages(prev => {
      const copy = [...prev];
      copy[index] = url;
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!title || !price || !imageUrl) {
      setError("Please fill out all required fields (Title, Price, Primary Image).");
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError("Price must be a valid positive number.");
      return;
    }

    const mrpNum = mrp ? parseFloat(mrp) : undefined;
    if (mrpNum !== undefined && (isNaN(mrpNum) || mrpNum <= 0)) {
      setError("MRP must be a valid positive number.");
      return;
    }

    const finalCategory = category === "Other" ? customCategory : category;
    if (!finalCategory) {
      setError("Please specify a category.");
      return;
    }

    const normalizedDeliverySlabs = freeDelivery
      ? []
      : deliverySlabs
          .map((slab) => ({
            min_qty: parseInt(slab.minQty, 10),
            max_qty: slab.maxQty.trim() === "" ? null : parseInt(slab.maxQty, 10),
            charge: parseFloat(slab.charge),
          }))
          .filter((slab) => slab.min_qty || slab.max_qty || slab.charge);

    if (!freeDelivery && normalizedDeliverySlabs.length === 0) {
      setError("Please add at least one delivery charge slab.");
      return;
    }

    const invalidDeliverySlab = normalizedDeliverySlabs.find((slab) => (
      !Number.isInteger(slab.min_qty) ||
      slab.min_qty <= 0 ||
      (slab.max_qty !== null && (!Number.isInteger(slab.max_qty) || slab.max_qty < slab.min_qty)) ||
      !Number.isFinite(slab.charge) ||
      slab.charge < 0
    ));

    if (invalidDeliverySlab) {
      setError("Please enter valid delivery slab values.");
      return;
    }

    setSubmitting(true);
    
    try {
      const finalTableRows = tableRows.filter(r => r.label.trim() || r.value.trim());
      const specsContent = specsLayout === "TABLE" ? JSON.stringify(finalTableRows) : specsText;
      
      const findVal = (lbl: string, fallback: string) => {
        if (specsLayout !== "TABLE") return fallback;
        const found = finalTableRows.find(r => r.label.toLowerCase().includes(lbl.toLowerCase()));
        return found ? found.value : fallback;
      };

      const filteredGalleryImages = galleryImages.filter(url => url.trim() !== "");
      const filteredOffers = offers.filter(o => o.title.trim() && o.description.trim());
      const payload = {
        id,
        title,
        description,
        price: priceNum,
        mrp: mrpNum,
        image_url: imageUrl,
        category: finalCategory,
        brand: findVal("brand", "Saidurga Premium"),
        warranty: warranty || "",
        dimensions: findVal("dimension", "45 x 30 x 12 cm"),
        weight: findVal("weight", "1.8 Kilograms"),
        specs_layout: specsLayout,
        specs_content: specsContent,
        image_url_2: filteredGalleryImages[0] || "",
        image_url_3: filteredGalleryImages[1] || "",
        gallery_images: filteredGalleryImages,
        free_delivery: freeDelivery,
        delivery_charge: normalizedDeliverySlabs[0]?.charge ?? 0,
        delivery_slabs: normalizedDeliverySlabs,
        return_policy: returnPolicy,
        allow_cod: allowCOD,
        allow_online: allowOnline,
        offers: filteredOffers,
      };

      await saveProduct(payload);
      setSuccess("Product updated successfully!");
      setTimeout(() => {
        setSuccess(null);
        router.push("/admin/products");
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to update product.");
    } finally {
      setSubmitting(false);
    }
  };

  const standardCategories = availableCategories.length > 0 
    ? availableCategories.map(c => c.name) 
    : ["Laptops", "Component Parts", "Hot Accessories", "Printers & CCTV", "Quick Service Desk"];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-3">
        <Loader2 className="animate-spin text-[#5ab946]" size={36} />
        <p className="text-gray-400 font-medium text-sm">Loading product data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Back Header */}
      <div className="flex items-center gap-4">
        <Link 
          href="/admin/products"
          className="p-2.5 bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white rounded-xl border border-gray-800 transition-all active:scale-95"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 className="text-2xl font-black text-white">Edit Product</h2>
          <p className="text-gray-400 text-sm mt-0.5">Modify properties of an existing inventory item.</p>
        </div>
      </div>

      {/* Messages */}
      {success && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-4 rounded-xl flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
          <Check size={18} className="flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
          <AlertCircle size={18} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-[#111827] border border-gray-800 rounded-3xl p-6 md:p-8 space-y-8 shadow-2xl relative">
        
        {/* SECTION 1: Basic Information */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-gray-800 pb-3">
            <Package className="text-[#5ab946]" size={20} />
            <h3 className="text-base font-bold text-white">Basic Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Title */}
            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Product Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Lenovo Legion Pro 5 Gen 9"
                className="w-full bg-gray-950/60 border border-gray-800 focus:border-[#5ab946] rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-650 outline-none transition-all focus:ring-2 focus:ring-[#5ab946]/10"
              />
            </div>

            {/* Category */}
            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-gray-950/60 border border-gray-800 focus:border-[#5ab946] rounded-xl px-4 py-3 text-sm text-white outline-none transition-all focus:ring-2 focus:ring-[#5ab946]/10"
              >
                {standardCategories.map(catName => (
                  <option key={catName} value={catName} className="bg-[#111827]">{catName}</option>
                ))}
                <option value="Other" className="bg-[#111827]">Other Category...</option>
              </select>
            </div>

            {/* Price */}
            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Selling Price (INR) *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">₹</span>
                <input
                  type="number"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 34999"
                  className="w-full pl-8 pr-4 py-3 bg-gray-950/60 border border-gray-800 focus:border-[#5ab946] rounded-xl text-sm text-white placeholder:text-gray-650 outline-none transition-all focus:ring-2 focus:ring-[#5ab946]/10"
                />
              </div>
            </div>

            {/* MRP */}
            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">MRP (INR) <span className="text-gray-500 font-normal">(Optional)</span></label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">₹</span>
                <input
                  type="number"
                  value={mrp}
                  onChange={(e) => setMrp(e.target.value)}
                  placeholder="e.g. 43749"
                  className="w-full pl-8 pr-4 py-3 bg-gray-950/60 border border-gray-800 focus:border-[#5ab946] rounded-xl text-sm text-white placeholder:text-gray-650 outline-none transition-all focus:ring-2 focus:ring-[#5ab946]/10"
                />
              </div>
            </div>

            {/* Custom Category */}
            {category === "Other" && (
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Specify Custom Category *</label>
                <input
                  type="text"
                  required
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="e.g. Networking Switches"
                  className="w-full bg-gray-950/60 border border-gray-800 focus:border-[#5ab946] rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-655 outline-none transition-all focus:ring-2 focus:ring-[#5ab946]/10"
                />
              </div>
            )}

            {/* Description */}
            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Key Description / Bullet Specs</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe product highlights e.g. AMD Ryzen 7 7840HS | 16GB DDR5 | 1TB NVMe SSD | RTX 4060 8GB..."
                rows={4}
                className="w-full bg-gray-950/60 border border-gray-800 focus:border-[#5ab946] rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-650 outline-none transition-all focus:ring-2 focus:ring-[#5ab946]/10 resize-none"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Key Features */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-gray-800 pb-3">
            <Layers className="text-[#5ab946]" size={20} />
            <h3 className="text-base font-bold text-white">Key Features</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Key Features Format</label>
              <select
                value={specsLayout}
                onChange={(e) => setSpecsLayout(e.target.value)}
                className="bg-gray-950/60 border border-gray-800 focus:border-[#5ab946] rounded-xl px-4 py-3 text-sm text-white outline-none transition-all focus:ring-2 focus:ring-[#5ab946]/10"
              >
                <option value="TABLE">Table (Key-Value Pairs)</option>
                <option value="PARAGRAPH">Paragraph Text</option>
              </select>
            </div>

            {specsLayout === "TABLE" ? (
              <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-400 uppercase">Table Rows (Feature & Detail)</label>
                
                {tableRows.map((row, idx) => (
                  <div key={idx} className="flex gap-4 items-center">
                    <input
                      type="text"
                      placeholder="e.g. Brand"
                      value={row.label}
                      onChange={(e) => handleTableRowChange(idx, "label", e.target.value)}
                      className="flex-1 bg-gray-950/60 border border-gray-800 focus:border-[#5ab946] rounded-xl px-4 py-2.5 text-xs text-white outline-none"
                    />
                    <input
                      type="text"
                      placeholder="e.g. Saidurga Premium"
                      value={row.value}
                      onChange={(e) => handleTableRowChange(idx, "value", e.target.value)}
                      className="flex-1 bg-gray-950/60 border border-gray-800 focus:border-[#5ab946] rounded-xl px-4 py-2.5 text-xs text-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveTableRow(idx)}
                      className="p-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-xl transition-all"
                      title="Remove Row"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={handleAddTableRow}
                  className="flex items-center gap-2 text-xs font-bold text-[#5ab946] hover:text-[#4ca03a] pt-1.5 transition-colors"
                >
                  <Plus size={14} /> Add Feature Row
                </button>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Paragraph Text</label>
                <textarea
                  value={specsText}
                  onChange={(e) => setSpecsText(e.target.value)}
                  placeholder="Enter key features as paragraph text..."
                  rows={6}
                  className="w-full bg-gray-950/60 border border-gray-800 focus:border-[#5ab946] rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-650 outline-none transition-all focus:ring-2 focus:ring-[#5ab946]/10 resize-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2.5: Badges & Offers */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-gray-800 pb-3">
            <Bookmark className="text-[#5ab946]" size={20} />
            <h3 className="text-base font-bold text-white">Badges & Special Offers</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Free Delivery toggle */}
            <div className="md:col-span-1 flex items-center justify-between bg-gray-950/40 p-4 border border-gray-850 rounded-2xl">
              <div>
                <label className="block text-xs font-bold text-white uppercase mb-1">Free Delivery</label>
                <span className="text-[10px] text-gray-550">Turn off to add quantity-based delivery slabs</span>
              </div>
              <input
                type="checkbox"
                checked={freeDelivery}
                onChange={(e) => handleFreeDeliveryChange(e.target.checked)}
                className="w-5 h-5 rounded accent-[#5ab946] bg-gray-950 border border-gray-800 outline-none cursor-pointer"
              />
            </div>

            {!freeDelivery && (
              <div className="md:col-span-3 space-y-3 rounded-2xl border border-gray-850 bg-gray-950/30 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <label className="block text-xs font-bold text-white uppercase mb-1">Delivery Charge Slabs</label>
                    <span className="text-[10px] text-gray-550">Example: 2 qty = 100, 3 qty = 150</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddDeliverySlab}
                    className="flex items-center gap-1.5 text-xs font-bold text-[#5ab946] hover:text-[#4ca03a] transition-colors"
                  >
                    <Plus size={14} /> Add Slab
                  </button>
                </div>

                <div className="space-y-3">
                  {deliverySlabs.map((slab, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-center">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Min Qty</label>
                        <input
                          type="number"
                          min="1"
                          value={slab.minQty}
                          onChange={(e) => handleDeliverySlabChange(idx, "minQty", e.target.value)}
                          placeholder="2"
                          className="w-full bg-gray-950/60 border border-gray-800 focus:border-[#5ab946] rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Max Qty</label>
                        <input
                          type="number"
                          min="1"
                          value={slab.maxQty}
                          onChange={(e) => handleDeliverySlabChange(idx, "maxQty", e.target.value)}
                          placeholder="Optional"
                          className="w-full bg-gray-950/60 border border-gray-800 focus:border-[#5ab946] rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Charge (INR)</label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={slab.charge}
                          onChange={(e) => handleDeliverySlabChange(idx, "charge", e.target.value)}
                          placeholder="100"
                          className="w-full bg-gray-950/60 border border-gray-800 focus:border-[#5ab946] rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDeliverySlab(idx)}
                        className="mt-5 p-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-xl transition-all w-fit"
                        title="Remove slab"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                {deliverySlabs.length === 0 && (
                  <p className="text-[10px] text-gray-500">Add at least one slab to charge delivery by quantity.</p>
                )}
              </div>
            )}

            {/* Allow COD toggle */}
            <div className="md:col-span-1 flex items-center justify-between bg-gray-950/40 p-4 border border-gray-850 rounded-2xl">
              <div>
                <label className="block text-xs font-bold text-white uppercase mb-1">Allow COD</label>
                <span className="text-[10px] text-gray-550">Enable Cash on Delivery</span>
              </div>
              <input
                type="checkbox"
                checked={allowCOD}
                onChange={(e) => setAllowCOD(e.target.checked)}
                className="w-5 h-5 rounded accent-[#5ab946] bg-gray-950 border border-gray-800 outline-none cursor-pointer"
              />
            </div>

            {/* Allow Online Payments toggle */}
            <div className="md:col-span-1 flex items-center justify-between bg-gray-950/40 p-4 border border-gray-850 rounded-2xl">
              <div>
                <label className="block text-xs font-bold text-white uppercase mb-1">Allow Online Payments</label>
                <span className="text-[10px] text-gray-550">Enable UPI/Card/NetBanking</span>
              </div>
              <input
                type="checkbox"
                checked={allowOnline}
                onChange={(e) => setAllowOnline(e.target.checked)}
                className="w-5 h-5 rounded accent-[#5ab946] bg-gray-950 border border-gray-800 outline-none cursor-pointer"
              />
            </div>

            {/* Return Policy input */}
            <div className="md:col-span-1 bg-gray-950/40 p-4 border border-gray-855 rounded-2xl">
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Return Policy Badge Text</label>
              <input
                type="text"
                value={returnPolicy}
                onChange={(e) => setReturnPolicy(e.target.value)}
                placeholder="e.g. 7 Days Return"
                className="w-full bg-gray-950/80 border border-gray-855 focus:border-[#5ab946] rounded-xl px-4 py-2 text-xs text-white placeholder:text-gray-700 outline-none transition-all"
              />
            </div>

            {/* Warranty Details input */}
            <div className="md:col-span-1 bg-gray-950/40 p-4 border border-gray-855 rounded-2xl">
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Warranty Badge Text</label>
              <input
                type="text"
                value={warranty}
                onChange={(e) => setWarranty(e.target.value)}
                placeholder="e.g. 1 Year SDC Warranty"
                className="w-full bg-gray-950/80 border border-gray-855 focus:border-[#5ab946] rounded-xl px-4 py-2 text-xs text-white placeholder:text-gray-700 outline-none transition-all"
              />
            </div>
          </div>

          {/* Dynamic Offers Editor */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-gray-400 uppercase">Available Offers</label>
            </div>
            
            {offers.map((offer, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row gap-4 items-start bg-gray-950/20 p-4 border border-gray-855 rounded-2xl relative">
                <div className="flex-1 w-full space-y-2">
                  <input
                    type="text"
                    placeholder="Offer Title e.g. Bank Discount"
                    value={offer.title}
                    onChange={(e) => handleOfferChange(idx, "title", e.target.value)}
                    className="w-full bg-gray-950/60 border border-gray-800 focus:border-[#5ab946] rounded-xl px-4 py-2.5 text-xs text-white outline-none"
                  />
                  <textarea
                    placeholder="Offer Description e.g. Instant 10% discount on HDFC & SBI Bank Cards"
                    value={offer.description}
                    onChange={(e) => handleOfferChange(idx, "description", e.target.value)}
                    rows={2}
                    className="w-full bg-gray-950/60 border border-gray-800 focus:border-[#5ab946] rounded-xl px-4 py-2.5 text-xs text-white outline-none resize-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveOffer(idx)}
                  className="p-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-xl transition-all self-end sm:self-center"
                  title="Remove Offer"
                >
                  <X size={16} />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddOffer}
              className="flex items-center gap-2 text-xs font-bold text-[#5ab946] hover:text-[#4ca03a] pt-1.5 transition-colors"
            >
              <Plus size={14} /> Add Special Offer Row
            </button>
          </div>
        </div>

        {/* SECTION 3: Image Gallery */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-gray-800 pb-3">
            <ImageIcon className="text-[#5ab946]" size={20} />
            <h3 className="text-base font-bold text-white">Product Gallery</h3>
          </div>

          <div className="space-y-6">
            {/* Image 1 (Primary) */}
            <div className="bg-gray-950/40 p-4 border border-gray-850 rounded-2xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <label className="text-xs font-bold text-gray-400 uppercase">Primary Image URL *</label>
                <label className="flex items-center gap-2 bg-gray-800 hover:bg-gray-750 text-gray-200 px-3.5 py-1.5 rounded-lg border border-gray-700 cursor-pointer text-xs font-bold transition-all active:scale-95 self-start sm:self-auto">
                  <Upload size={14} />
                  {uploadingField === "imageUrl" ? "Uploading..." : "Upload Image"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "imageUrl")}
                    disabled={uploadingField !== null}
                    className="hidden"
                  />
                </label>
              </div>
              <input
                type="text"
                required
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/primary-image.jpg"
                className="w-full bg-gray-950/80 border border-gray-855 focus:border-[#5ab946] rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-gray-700 outline-none transition-all"
              />
              {imageUrl && (
                <div className="flex items-center gap-3 bg-gray-950/60 p-2 rounded-xl max-w-md border border-gray-855">
                  <img src={imageUrl} alt="Primary preview" className="h-12 w-12 object-cover rounded bg-gray-950 border border-gray-800 flex-shrink-0" />
                  <span className="text-[10px] text-gray-550 truncate">{imageUrl}</span>
                </div>
              )}
            </div>

            {/* Dynamic Gallery Images */}
            {galleryImages.map((imgUrl, idx) => (
              <div key={idx} className="bg-gray-950/40 p-4 border border-gray-855 rounded-2xl space-y-3 relative group">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <label className="text-xs font-bold text-gray-400 uppercase">Gallery Image {idx + 2} URL</label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 bg-gray-800 hover:bg-gray-755 text-gray-200 px-3.5 py-1.5 rounded-lg border border-gray-700 cursor-pointer text-xs font-bold transition-all active:scale-95">
                      <Upload size={14} />
                      {uploadingField === `gallery-${idx}` ? "Uploading..." : "Upload Image"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleGalleryImageUpload(e, idx)}
                        disabled={uploadingField !== null}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => handleRemoveGalleryImage(idx)}
                      className="p-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-xl transition-all"
                      title="Remove Image"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={imgUrl}
                  onChange={(e) => handleGalleryImageUrlChange(idx, e.target.value)}
                  placeholder={`https://example.com/gallery-image-${idx + 2}.jpg`}
                  className="w-full bg-gray-950/80 border border-gray-855 focus:border-[#5ab946] rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-gray-755 outline-none transition-all"
                />
                {imgUrl && (
                  <div className="flex items-center gap-3 bg-gray-950/60 p-2 rounded-xl max-w-md border border-gray-855">
                    <img src={imgUrl} alt={`Gallery ${idx + 2} preview`} className="h-12 w-12 object-cover rounded bg-gray-950 border border-gray-800 flex-shrink-0" />
                    <span className="text-[10px] text-gray-550 truncate">{imgUrl}</span>
                  </div>
                )}
              </div>
            ))}

            {/* Add Gallery Image Button */}
            <button
              type="button"
              onClick={handleAddGalleryImage}
              className="w-full py-4 border border-dashed border-gray-800 hover:border-[#5ab946] bg-gray-950/20 hover:bg-gray-950/40 text-gray-400 hover:text-white rounded-2xl flex items-center justify-center gap-2 text-xs font-bold transition-all"
            >
              <Plus size={16} /> Add Image to Gallery
            </button>
          </div>
        </div>

        {/* Form Action Panel */}
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-800">
          <Link
            href="/admin/products"
            className="px-6 py-3 bg-gray-800 hover:bg-gray-755 text-gray-200 font-bold rounded-xl text-sm transition-all active:scale-95 cursor-pointer border border-gray-700"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting || uploadingField !== null}
            className="px-6 py-3 bg-[#5ab946] hover:bg-[#4ca03a] text-white font-bold rounded-xl text-sm shadow-lg shadow-[#5ab946]/10 disabled:opacity-50 transition-all active:scale-95 cursor-pointer"
          >
            {submitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
