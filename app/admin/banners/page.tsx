"use client";
import React, { useState, useEffect } from "react";
import { 
  getBanners, 
  saveBanner, 
  deleteBanner, 
  Banner 
} from "@/lib/storeService";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  X,
  AlertCircle,
  Check,
  ExternalLink
} from "lucide-react";

export default function AdminBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  // Form states
  const [imageUrl, setImageUrl] = useState("");
  const [title, setTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [displayOrder, setDisplayOrder] = useState("0");

  // Status states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Cropper states
  const [isCropping, setIsCropping] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropImageFile, setCropImageFile] = useState<File | null>(null);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [cropAspect, setCropAspect] = useState<number>(2.5);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    loadBanners();
  }, []);

  async function loadBanners() {
    setLoading(true);
    try {
      const data = await getBanners();
      setBanners(data);
    } catch (err) {
      console.error("Failed to load banners:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenAddModal = () => {
    setEditingBanner(null);
    setImageUrl("");
    setTitle("");
    setLinkUrl("");
    setDisplayOrder(banners.length.toString());
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (banner: Banner) => {
    setEditingBanner(banner);
    setImageUrl(banner.image_url);
    setTitle(banner.title || "");
    setLinkUrl(banner.link_url || "");
    setDisplayOrder((banner.display_order ?? 0).toString());
    setError(null);
    setIsModalOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCropImageFile(file);
    const objectUrl = URL.createObjectURL(file);
    setCropImageSrc(objectUrl);
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
    setCropAspect(2.5);
    setIsCropping(true);
    e.target.value = "";
  };

  const handleCancelCrop = () => {
    setIsCropping(false);
    if (cropImageSrc) {
      URL.revokeObjectURL(cropImageSrc);
    }
    setCropImageSrc(null);
    setCropImageFile(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      const touch = e.touches[0];
      setDragStart({ x: touch.clientX - panOffset.x, y: touch.clientY - panOffset.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setPanOffset({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  };

  const handleConfirmCrop = () => {
    if (!cropImageSrc) return;

    const img = new Image();
    img.src = cropImageSrc;
    img.onload = async () => {
      const canvas = document.createElement("canvas");
      const canvasWidth = cropAspect === 2.5 ? 1500 : 1000;
      const canvasHeight = cropAspect === 2.5 ? 600 : 500;
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      const displayedWidth = 400;
      const displayedHeight = (img.height / img.width) * displayedWidth;

      const activeWidth = displayedWidth * zoom;
      const activeHeight = displayedHeight * zoom;

      const cropHeight = cropAspect === 2.5 ? 160 : 200;
      const containerCenterX = 400 / 2;
      const containerCenterY = cropHeight / 2;

      const drawX = containerCenterX - activeWidth / 2 + panOffset.x;
      const drawY = containerCenterY - activeHeight / 2 + panOffset.y;

      const scaleMultiplier = canvasWidth / 400;

      const canvasDrawX = drawX * scaleMultiplier;
      const canvasDrawY = drawY * scaleMultiplier;
      const canvasDrawWidth = activeWidth * scaleMultiplier;
      const canvasDrawHeight = activeHeight * scaleMultiplier;

      ctx.drawImage(img, canvasDrawX, canvasDrawY, canvasDrawWidth, canvasDrawHeight);

      setUploading(true);
      setError(null);
      setIsCropping(false);

      canvas.toBlob(async (blob) => {
        if (!blob) {
          setError("Failed to generate cropped image.");
          setUploading(false);
          return;
        }

        const croppedFile = new File([blob], cropImageFile?.name || "cropped_banner.jpg", {
          type: "image/jpeg",
        });

        const formData = new FormData();
        formData.append("file", croppedFile);

        try {
          const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Failed to upload cropped image");

          setImageUrl(data.url);
          if (data.isMock) {
            setSuccess("Mock mode: cropped image uploaded");
            setTimeout(() => setSuccess(null), 3000);
          }
        } catch (err: any) {
          console.error(err);
          setError(err.message || "Failed to upload cropped image");
        } finally {
          setUploading(false);
          URL.revokeObjectURL(cropImageSrc);
        }
      }, "image/jpeg", 0.92);
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!imageUrl) {
      setError("Please provide a banner image.");
      return;
    }

    const orderNum = parseInt(displayOrder);
    if (isNaN(orderNum)) {
      setError("Display order must be an integer.");
      return;
    }

    setSubmitting(true);
    
    try {
      const payload: Omit<Banner, "id"> & { id?: string } = {
        image_url: imageUrl,
        title,
        link_url: linkUrl,
        display_order: orderNum,
      };

      if (editingBanner) {
        payload.id = editingBanner.id;
      }

      await saveBanner(payload);
      setSuccess(editingBanner ? "Banner updated successfully!" : "Banner added successfully!");
      setIsModalOpen(false);
      await loadBanners();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save banner.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;
    
    try {
      await deleteBanner(id);
      setSuccess("Banner deleted successfully!");
      await loadBanners();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to delete banner.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white">Homepage Hero Banners</h2>
          <p className="text-gray-400 text-sm mt-1">Manage the sliding banner carousel on the store home page.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 bg-[#5ab946] hover:bg-[#4ca03a] text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-[#5ab946]/10 transition-all active:scale-95 text-sm w-full sm:w-auto"
        >
          <Plus size={18} />
          Add Banner
        </button>
      </div>

      {/* Messages */}
      {success && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-4 rounded-xl flex items-center gap-3 text-sm">
          <Check size={18} className="flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Grid of Banners */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#5ab946]"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {banners.map((banner) => (
            <div key={banner.id} className="bg-[#111827] border border-gray-800 rounded-2xl overflow-hidden flex flex-col group hover:border-gray-700 transition-colors">
              {/* Image Container */}
              <div className="aspect-[2.5/1] bg-gray-950 relative overflow-hidden flex items-center justify-center border-b border-gray-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={banner.image_url}
                  alt={banner.title || "Banner slide"}
                  className="h-full w-full object-cover group-hover:scale-102 transition-transform duration-300"
                />
                
                {/* Overlay Badge for display order */}
                <div className="absolute top-3 left-3 bg-[#5ab946] text-white font-bold text-xs px-2.5 py-1 rounded-md shadow-md">
                  Slide #{banner.display_order}
                </div>
              </div>

              {/* Banner Details */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4 bg-gray-900/40">
                <div>
                  <h3 className="text-base font-bold text-white line-clamp-1">
                    {banner.title || "Untitled Banner"}
                  </h3>
                  {banner.link_url ? (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1 hover:text-[#5ab946] cursor-pointer">
                      <ExternalLink size={12} />
                      <span className="truncate max-w-[280px]">{banner.link_url}</span>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-600 italic mt-1">No navigation link</p>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-800/60">
                  <button
                    onClick={() => handleOpenEditModal(banner)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-all"
                  >
                    <Edit size={14} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(banner.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-all"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}

          {banners.length === 0 && (
            <div className="col-span-2 text-center py-20 bg-[#111827] border border-gray-800 rounded-2xl text-gray-500">
              No banners created. Show off your store with custom hero slides!
            </div>
          )}
        </div>
      )}

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-gray-800 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {editingBanner ? "Edit Banner" : "Add Banner"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl flex items-center gap-2 text-xs">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Banner Title (Optional)</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. SDC Gaming Laptop Extravaganza"
                  className="w-full bg-gray-950/60 border border-gray-800 focus:border-[#5ab946] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none transition-colors"
                />
              </div>

              {/* Navigation Link & Display Order */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Link URL (Optional)</label>
                  <input
                    type="text"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="e.g. /laptops"
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
                    placeholder="e.g. 0"
                    className="w-full bg-gray-950/60 border border-gray-800 focus:border-[#5ab946] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Guidelines helper card */}
              <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 text-xs space-y-2 leading-relaxed mb-4">
                <span className="font-black text-[#5ab946] uppercase tracking-wider text-[10px] block">
                  📐 Responsive Banner Guidelines
                </span>
                <p className="text-gray-400">
                  The storefront banner dynamically adapts across all device screen layouts:
                </p>
                <ul className="list-disc pl-4 text-gray-400 space-y-1">
                  <li><strong>Desktop (2.5:1 aspect ratio)</strong>: Recommended size is <strong>1500px × 600px</strong>.</li>
                  <li><strong>Mobile (2:1 aspect ratio)</strong>: Recommended size is <strong>1000px × 500px</strong> (or <strong>750px × 375px</strong>).</li>
                </ul>
                <p className="text-gray-500">
                  Select a layout preset in our image cropper after selecting a file to shape it perfectly.
                </p>
              </div>

              {/* Image Upload / Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-400 uppercase">Banner Image *</label>
                
                <div className="flex gap-4 items-center">
                  <label className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700/80 text-gray-200 px-4 py-2.5 rounded-xl border border-gray-700 cursor-pointer text-sm font-semibold transition-all">
                    <Upload size={16} />
                    {uploading ? "Uploading..." : "Upload Image"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                  <span className="text-xs text-gray-500">or paste a custom URL:</span>
                </div>

                <input
                  type="text"
                  required
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/banner.jpg"
                  className="w-full bg-gray-950/60 border border-gray-800 focus:border-[#5ab946] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none transition-colors"
                />

                {/* Preview */}
                {imageUrl && (
                  <div className="mt-2 bg-gray-950/50 p-2.5 border border-gray-800/80 rounded-xl space-y-2">
                    <p className="text-[11px] font-bold text-gray-400 uppercase text-left">Banner Preview</p>
                    <div className="aspect-[3/1] bg-gray-950 border border-gray-800 rounded overflow-hidden relative flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imageUrl} alt="Upload preview" className="h-full w-full object-cover" />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700/80 text-gray-200 text-sm font-semibold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploading}
                  className="px-5 py-2.5 bg-[#5ab946] hover:bg-[#4ca03a] text-white text-sm font-semibold rounded-xl shadow-lg shadow-[#5ab946]/10 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {submitting ? "Saving..." : (editingBanner ? "Save Changes" : "Create Banner")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Crop Modal Dialog */}
      {isCropping && cropImageSrc && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#111827] border border-gray-800 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl relative flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Crop Banner Image</h3>
              <button
                onClick={handleCancelCrop}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 flex-1 flex flex-col items-center">
              {/* Presets Selector tabs */}
              <div className="w-full">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Aspect Ratio Preset</label>
                <div className="grid grid-cols-2 gap-2 bg-gray-950 p-1.5 rounded-xl border border-gray-800">
                  <button
                    type="button"
                    onClick={() => {
                      setCropAspect(2.5);
                      setPanOffset({ x: 0, y: 0 });
                    }}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                      cropAspect === 2.5
                        ? "bg-[#5ab946] text-white shadow-sm"
                        : "text-gray-400 hover:text-white bg-transparent"
                    }`}
                  >
                    Desktop Banner (2.5:1)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCropAspect(2);
                      setPanOffset({ x: 0, y: 0 });
                    }}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                      cropAspect === 2
                        ? "bg-[#5ab946] text-white shadow-sm"
                        : "text-gray-400 hover:text-white bg-transparent"
                    }`}
                  >
                    Mobile Banner (2:1)
                  </button>
                </div>
              </div>

              {/* Crop Frame Box */}
              <div className="w-full flex flex-col items-center space-y-1.5">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Drag to position image inside frame</span>
                <div
                  style={{ width: "400px", height: `${cropAspect === 2.5 ? 160 : 200}px` }}
                  className="bg-black relative overflow-hidden rounded-xl border-2 border-[#5ab946] flex items-center justify-center cursor-move select-none shadow-inner shadow-black/80 transition-all duration-300"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUpOrLeave}
                  onMouseLeave={handleMouseUpOrLeave}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleMouseUpOrLeave}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cropImageSrc}
                    alt="Crop workspace"
                    draggable={false}
                    style={{
                      transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                      transition: isDragging ? "none" : "transform 0.1s ease-out",
                      maxHeight: "none",
                      maxWidth: "none",
                      width: "100%",
                      height: "auto",
                    }}
                  />
                </div>
              </div>

              {/* Zoom Slider */}
              <div className="w-full space-y-2">
                <div className="flex justify-between text-xs text-gray-400 font-bold uppercase tracking-wider">
                  <span>Zoom Level</span>
                  <span>{Math.round(zoom * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.01"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full accent-[#5ab946] bg-gray-950 border border-gray-800 rounded-lg h-2"
                />
              </div>
            </div>

            {/* Footer actions */}
            <div className="p-5 border-t border-gray-800 flex justify-end gap-3 bg-gray-900/20">
              <button
                type="button"
                onClick={handleCancelCrop}
                className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700/80 text-gray-200 text-sm font-semibold rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCrop}
                className="px-5 py-2.5 bg-[#5ab946] hover:bg-[#4ca03a] text-white text-sm font-semibold rounded-xl shadow-lg shadow-[#5ab946]/10 transition-all"
              >
                Crop & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
