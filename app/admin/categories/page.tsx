"use client";
import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
   getCategoryGrids,
   saveCategoryGrid,
   deleteCategoryGrid,
   getSidebarFilters,
   saveSidebarFilter,
   deleteSidebarFilter,
   CategoryGrid,
   SidebarFilter
} from "@/lib/storeService";
import {
   Plus,
   Edit,
   Trash2,
   Upload,
   X,
   AlertCircle,
   Check,
   Layers,
   Navigation,
   ToggleLeft,
   ToggleRight,
   Sliders
} from "lucide-react";

export default function AdminCategories() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab");
  const activeTab = (tabParam === "grids" || tabParam === "menu" || tabParam === "filters") ? tabParam : "grids";

  const setActiveTab = (tab: "grids" | "menu" | "filters") => {
    router.push(`/admin/categories?tab=${tab}`);
  };

  const [grids, setGrids] = useState<CategoryGrid[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGrid, setEditingGrid] = useState<CategoryGrid | null>(null);

  // Grid Form states
  const [title, setTitle] = useState("");
  const [linkText, setLinkText] = useState("Explore all");
  const [displayOrder, setDisplayOrder] = useState("0");
  const [items, setItems] = useState([
    { name: "", image: "", link: "" },
    { name: "", image: "", link: "" },
    { name: "", image: "", link: "" },
    { name: "", image: "", link: "" }
  ]);

  // Product Category Menu states
  const [menuCategories, setMenuCategories] = useState<{ id: string; name: string; showInMenu: boolean; displayOrder: number }[]>([]);
  const [allProductCategories, setAllProductCategories] = useState<string[]>([]);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{ id?: string; name: string; showInMenu: boolean; displayOrder: string } | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryShowInMenu, setCategoryShowInMenu] = useState(true);
  const [categoryDisplayOrder, setCategoryDisplayOrder] = useState("0");

  // Sidebar Filter states
  const [sidebarFilters, setSidebarFilters] = useState<SidebarFilter[]>([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [editingFilter, setEditingFilter] = useState<SidebarFilter | null>(null);
  const [filterType, setFilterType] = useState("");
  const [filterLabel, setFilterLabel] = useState("");
  const [filterIsEnabled, setFilterIsEnabled] = useState(true);
  const [filterDisplayOrder, setFilterDisplayOrder] = useState("0");
  const [filterConfig, setFilterConfig] = useState("");

  // Status states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadMenuCategories(true);
  }, []);

  useEffect(() => {
    if (activeTab === "grids") {
      loadGrids();
    } else if (activeTab === "menu") {
      loadMenuCategories();
    } else {
      loadSidebarFilters();
    }
  }, [activeTab]);

  async function loadGrids() {
    setLoading(true);
    try {
      const data = await getCategoryGrids();
      setGrids(data);
    } catch (err) {
      console.error("Failed to load category grids:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadMenuCategories(skipLoading = false) {
    if (!skipLoading) setLoading(true);
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setMenuCategories(data);
      }
    } catch (err) {
      console.error("Failed to load menu categories:", err);
    } finally {
      if (!skipLoading) setLoading(false);
    }
  }

  async function loadSidebarFilters(skipLoading = false) {
    if (!skipLoading) setLoading(true);
    try {
      const data = await getSidebarFilters();
      setSidebarFilters(data);
    } catch (err) {
      console.error("Failed to load sidebar filters:", err);
    } finally {
      if (!skipLoading) setLoading(false);
    }
  }

  // --- GRID HANDLERS ---
  const handleOpenAddModal = () => {
    setEditingGrid(null);
    setTitle("");
    setLinkText("Explore all");
    setDisplayOrder(grids.length.toString());
    setItems([
      { name: "", image: "", link: "" }
    ]);
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (grid: CategoryGrid) => {
    setEditingGrid(grid);
    setTitle(grid.title);
    setLinkText(grid.link_text || "Explore all");
    setDisplayOrder((grid.display_order ?? 0).toString());
    
    const gridItems = grid.items.map((item: any) => ({ name: item.name, image: item.image, link: item.link || "" }));
    setItems(gridItems.length > 0 ? gridItems : [{ name: "", image: "", link: "" }]);
    setError(null);
    setIsModalOpen(true);
  };

  const handleAddSubItem = () => {
    if (items.length >= 4) {
      setError("Maximum 4 sub-items are allowed in a Category Grid.");
      return;
    }
    setItems([...items, { name: "", image: "", link: "" }]);
  };

  const handleRemoveSubItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated.length > 0 ? updated : [{ name: "", image: "", link: "" }]);
  };

  const handleItemChange = (index: number, field: "name" | "image" | "link", value: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingIndex(index);
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
      
      handleItemChange(index, "image", data.url);
      if (data.isMock) {
        setSuccess(`Mock mode: item #${index + 1} image fallbacked to Picsum URL`);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || `Failed to upload image for item #${index + 1}`);
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!title) {
      setError("Please specify a grid title.");
      return;
    }

    const filledItems = items.filter(item => item.name && item.name.trim() !== "" && item.image && item.image.trim() !== "");
    if (filledItems.length === 0) {
      setError("Please fill in both Name and Image for at least one sub-item.");
      return;
    }

    const orderNum = parseInt(displayOrder);
    if (isNaN(orderNum)) {
      setError("Display order must be an integer.");
      return;
    }

    setSubmitting(true);
    
    try {
      const sanitizedItems = filledItems.map(item => ({
        name: item.name,
        image: item.image,
        link: item.link === "custom_temp" ? "" : item.link
      }));

      const payload: any = {
        title,
        link_text: linkText,
        items: sanitizedItems,
        display_order: orderNum,
      };

      if (editingGrid) {
        payload.id = editingGrid.id;
      }

      await saveCategoryGrid(payload);
      setSuccess(editingGrid ? "Category grid updated successfully!" : "Category grid added successfully!");
      setIsModalOpen(false);
      await loadGrids();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save category grid.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category grid?")) return;
    
    try {
      await deleteCategoryGrid(id);
      setSuccess("Category grid deleted successfully!");
      await loadGrids();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to delete category grid.");
    }
  };

  // --- MENU CATEGORIES HANDLERS ---
  const loadAllProductCategories = async () => {
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const products = await res.json();
        const uniqueCategories: string[] = Array.from(new Set(products.map((p: any) => p.category)));
        setAllProductCategories(uniqueCategories);

        const selectables = uniqueCategories.filter(
          (pcName) => !menuCategories.some((mc) => mc.name.toLowerCase() === pcName.toLowerCase())
        );

        if (selectables.length > 0) {
          setCategoryName(selectables[0]);
          setIsCustomCategory(false);
        } else {
          setCategoryName("");
          setIsCustomCategory(true);
        }
      }
    } catch (err) {
      console.error("Failed to load product categories:", err);
    }
  };

  const handleOpenAddCategoryModal = async () => {
    setEditingCategory(null);
    setCategoryShowInMenu(true);
    setCategoryDisplayOrder(menuCategories.length.toString());
    setError(null);
    setIsCategoryModalOpen(true);
    await loadAllProductCategories();
  };

  const handleOpenEditCategoryModal = (cat: any) => {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setIsCustomCategory(false);
    setCategoryShowInMenu(cat.showInMenu);
    setCategoryDisplayOrder(cat.displayOrder.toString());
    setError(null);
    setIsCategoryModalOpen(true);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!categoryName) {
      setError("Please specify a category name.");
      return;
    }

    const orderNum = parseInt(categoryDisplayOrder);
    if (isNaN(orderNum)) {
      setError("Display order must be an integer.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingCategory?.id,
          name: categoryName,
          showInMenu: categoryShowInMenu,
          displayOrder: orderNum
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save category");

      setSuccess(editingCategory ? "Category updated successfully!" : "Category added successfully!");
      setIsCategoryModalOpen(false);
      await loadMenuCategories();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save category.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleShowInMenu = async (cat: any) => {
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: cat.id,
          name: cat.name,
          showInMenu: !cat.showInMenu,
          displayOrder: cat.displayOrder
        }),
      });

      if (res.ok) {
        await loadMenuCategories();
      }
    } catch (err) {
      console.error("Failed to toggle show in menu:", err);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category? Products in this category will not be deleted, but this category option will be removed.")) return;

    try {
      const res = await fetch(`/api/categories?id=${id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete category");
      }

      setSuccess("Category deleted successfully!");
      await loadMenuCategories();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to delete category.");
    }
  };

  // --- SIDEBAR FILTERS HANDLERS ---
  const handleOpenAddFilterModal = async () => {
    setEditingFilter(null);
    setFilterType("");
    setFilterLabel("");
    setFilterIsEnabled(true);
    setFilterDisplayOrder(sidebarFilters.length.toString());
    setFilterConfig("{}");
    setError(null);
    setIsFilterModalOpen(true);
  };

  const handleOpenEditFilterModal = (filter: SidebarFilter) => {
    setEditingFilter(filter);
    setFilterType(filter.filterType);
    setFilterLabel(filter.label);
    setFilterIsEnabled(filter.isEnabled);
    setFilterDisplayOrder((filter.display_order ?? 0).toString());
    setFilterConfig(filter.config ? JSON.stringify(filter.config, null, 2) : "{}");
    setError(null);
    setIsFilterModalOpen(true);
  };

  const handleSaveFilter = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!filterType || !filterLabel) {
      setError("Filter type and label are required.");
      return;
    }

    const configParsed = (() => {
      try {
        const parsed = JSON.parse(filterConfig);
        return Object.keys(parsed).length > 0 ? parsed : null;
      } catch {
        return null;
      }
    })();

    const orderValue = parseInt(filterDisplayOrder);
    if (isNaN(orderValue)) {
      setError("Display order must be an integer.");
      return;
    }

    setSubmitting(true);

    try {
      const payload: any = {
        filterType,
        label: filterLabel,
        config: configParsed,
        isEnabled: filterIsEnabled,
        display_order: orderValue,
      };

      if (editingFilter) {
        payload.id = editingFilter.id;
      }

      await saveSidebarFilter(payload);
      setSuccess(editingFilter ? "Filter updated successfully!" : "Filter added successfully!");
      setIsFilterModalOpen(false);
      await loadSidebarFilters();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save filter.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFilter = async (id: string) => {
    if (!confirm("Are you sure you want to delete this sidebar filter?")) return;

    try {
      await deleteSidebarFilter(id);
      setSuccess("Filter deleted successfully!");
      await loadSidebarFilters();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to delete filter.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex border-b border-gray-800 gap-6">
        <button 
          onClick={() => setActiveTab("grids")}
          className={`pb-3 text-sm font-bold uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer ${activeTab === "grids" ? "border-b-2 border-[#5ab946] text-[#5ab946]" : "text-gray-400 hover:text-white"}`}
        >
          <Layers size={16} />
          Homepage Category Grids
        </button>
        <button 
          onClick={() => setActiveTab("menu")}
          className={`pb-3 text-sm font-bold uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer ${activeTab === "menu" ? "border-b-2 border-[#5ab946] text-[#5ab946]" : "text-gray-400 hover:text-white"}`}
        >
          <Navigation size={16} />
          Navbar Menu Categories
        </button>
        <button 
          onClick={() => setActiveTab("filters")}
          className={`pb-3 text-sm font-bold uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer ${activeTab === "filters" ? "border-b-2 border-[#5ab946] text-[#5ab946]" : "text-gray-400 hover:text-white"}`}
        >
          <Sliders size={16} />
          Sidebar Filters
        </button>
      </div>

      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {activeTab === "grids" ? (
          <div>
            <h2 className="text-2xl font-black text-white">Homepage Category Grids</h2>
            <p className="text-gray-400 text-sm mt-1">Manage the 2x2 category showcase blocks on the store front.</p>
          </div>
        ) : activeTab === "menu" ? (
          <div>
            <h2 className="text-2xl font-black text-white">Header Menu Categories</h2>
            <p className="text-gray-400 text-sm mt-1">Add categories and toggle their visibility in the navigation menu.</p>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-black text-white">Sidebar Filters</h2>
            <p className="text-gray-400 text-sm mt-1">Manage dynamic filters shown in the category sidebar.</p>
          </div>
        )}
        
        <button
          onClick={activeTab === "grids" ? handleOpenAddModal : activeTab === "menu" ? handleOpenAddCategoryModal : handleOpenAddFilterModal}
          className="flex items-center justify-center gap-2 bg-[#5ab946] hover:bg-[#4ca03a] text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-[#5ab946]/10 transition-all active:scale-95 text-sm w-full sm:w-auto cursor-pointer"
        >
          <Plus size={18} />
          {activeTab === "grids" ? "Add Grid Box" : activeTab === "menu" ? "Add Category" : "Add Filter"}
        </button>
      </div>

      {/* Messages */}
      {success && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-4 rounded-xl flex items-center gap-3 text-sm">
          <Check size={18} className="flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#5ab946]"></div>
        </div>
      ) : activeTab === "grids" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {grids.map((grid: any) => (
            <div key={grid.id} className="bg-[#111827] border border-gray-800 rounded-2xl p-6 flex flex-col justify-between hover:border-gray-700 transition-colors">
              <div>
                <div className="flex justify-between items-start gap-4 mb-4">
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase bg-gray-950 px-2 py-0.5 rounded border border-gray-800">
                      Order: {grid.display_order ?? 0}
                    </span>
                    <h3 className="text-base font-bold text-white mt-1.5 line-clamp-1">{grid.title}</h3>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-gray-950/40 p-3 rounded-xl border border-gray-800/60 mb-6">
                  {grid.items.slice(0, 4).map((item: any, i: number) => (
                    <div key={i} className="flex flex-col items-center bg-gray-900/30 p-2 rounded border border-gray-800/40">
                      <div className="h-14 w-14 rounded overflow-hidden bg-gray-950 flex items-center justify-center border border-gray-800 relative mb-1.5">
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                      </div>
                      <span className="text-[10px] text-gray-400 font-medium truncate w-full text-center">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-800/60">
                <span className="text-xs text-[#5ab946] hover:underline cursor-pointer font-medium">
                  {grid.link_text || "Explore all"}
                </span>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenEditModal(grid)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-all cursor-pointer"
                  >
                    <Edit size={12} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(grid.id)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-all cursor-pointer"
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}

          {grids.length === 0 && (
            <div className="col-span-2 text-center py-20 bg-[#111827] border border-gray-800 rounded-2xl text-gray-500">
              No categories grids configured. Set up grids to show off items by categories!
            </div>
          )}
        </div>
      ) : activeTab === "filters" ? (
        <div className="bg-[#111827] border border-gray-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="text-xs uppercase text-gray-500 bg-gray-900/40 border-b border-gray-800">
                <tr>
                  <th className="px-6 py-4 font-semibold">Filter</th>
                  <th className="px-6 py-4 font-semibold">Type</th>
                  <th className="px-6 py-4 font-semibold text-center">Display Order</th>
                  <th className="px-6 py-4 font-semibold text-center">Enabled</th>
                  <th className="px-6 py-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {sidebarFilters.map((filter: any) => (
                  <tr key={filter.id} className="hover:bg-gray-850/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-white">
                      {filter.label}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-full border border-gray-700 bg-gray-900/60 text-[10px] font-black uppercase tracking-wider text-gray-300">
                        {filter.filterType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-mono font-semibold">
                      {filter.display_order ?? 0}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-extrabold uppercase ${filter.isEnabled ? 'text-[#5ab946]' : 'text-gray-500'}`}>
                        {filter.isEnabled ? <Check size={14} /> : <X size={14} />}
                        {filter.isEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => handleOpenEditFilterModal(filter)}
                          className="p-1.5 text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-750 rounded transition-all cursor-pointer"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteFilter(filter.id)}
                          className="p-1.5 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded transition-all cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {sidebarFilters.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-16 text-gray-500">
                      No sidebar filters configured yet. Add filters to manage dynamic sidebar options.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-[#111827] border border-gray-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="text-xs uppercase text-gray-500 bg-gray-900/40 border-b border-gray-800">
                <tr>
                  <th className="px-6 py-4 font-semibold">Category Name</th>
                  <th className="px-6 py-4 font-semibold text-center">Display Order</th>
                  <th className="px-6 py-4 font-semibold text-center">Show In Menu</th>
                  <th className="px-6 py-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {menuCategories.map((cat: any) => (
                  <tr key={cat.id} className="hover:bg-gray-850/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-white">
                      {cat.name}
                    </td>
                    <td className="px-6 py-4 text-center font-mono font-semibold">
                      {cat.displayOrder}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => handleToggleShowInMenu(cat)}
                        className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                      >
                        {cat.showInMenu ? (
                          <ToggleRight size={28} className="text-[#5ab946]" />
                        ) : (
                          <ToggleLeft size={28} className="text-gray-600" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => handleOpenEditCategoryModal(cat)}
                          className="p-1.5 text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-750 rounded transition-all cursor-pointer"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-1.5 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded transition-all cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {menuCategories.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-16 text-gray-500">
                      No product categories configured yet. Add categories to configure the header navigation menu dynamically.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grid Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#111827] border border-gray-800 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {editingGrid ? "Edit Category Grid" : "Add Category Grid"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl flex items-center gap-2 text-xs">
                  <AlertCircle size={16} /><span className="text-xs">{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Grid Box Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Top laptop deals | Starts ₹29,999"
                    className="w-full bg-gray-950/60 border border-gray-800 focus:border-[#5ab946] rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Link Text</label>
                  <input
                    type="text"
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                    className="w-full bg-gray-950/60 border border-gray-800 focus:border-[#5ab946] rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Display Order</label>
                <input
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(e.target.value)}
                  className="w-full sm:w-1/3 bg-gray-950/60 border border-gray-800 focus:border-[#5ab946] rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                />
              </div>
              <div className="pt-4 border-t border-gray-800/80">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Grid Items (Max 4 items)</h4>
                  {items.length < 4 && (
                    <button
                      type="button"
                      onClick={handleAddSubItem}
                      className="flex items-center gap-1 text-[11px] font-bold text-[#5ab946] hover:text-[#4ca03a] transition-colors cursor-pointer"
                    >
                      + Add Sub-item
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {items.map((item, idx) => (
                    <div key={idx} className="bg-gray-950/40 p-4 rounded-xl border border-gray-800/85 space-y-3 relative">
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-extrabold text-[#5ab946]">Sub-item #{idx + 1}</p>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSubItem(idx)}
                            className="text-gray-500 hover:text-red-400 transition-colors p-1 cursor-pointer"
                            title="Remove sub-item"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase">Sub-item Name *</label>
                        <input
                          type="text"
                          required
                          value={item.name}
                          onChange={(e) => handleItemChange(idx, "name", e.target.value)}
                          placeholder="Sub-item name"
                          className="w-full bg-gray-950/80 border border-gray-855 rounded-lg px-3 py-2 text-xs text-white outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase">Redirect Page / Category</label>
                        <select
                          value={
                            item.link === "" 
                              ? "" 
                              : menuCategories.some((c: any) => c.name === item.link) 
                                ? item.link 
                                : "custom"
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "custom") {
                              handleItemChange(idx, "link", "custom_temp");
                            } else {
                              handleItemChange(idx, "link", val);
                            }
                          }}
                          className="w-full bg-gray-950/80 border border-gray-855 rounded-lg px-3 py-2 text-xs text-white outline-none"
                        >
                          <option value="">Default (Filter by sub-item name)</option>
                          {menuCategories.map((cat: any) => (
                            <option key={cat.id} value={cat.name}>
                              Category: {cat.name}
                            </option>
                          ))}
                          <option value="custom">Custom URL / Search keyword</option>
                        </select>
                      </div>

                      {(item.link !== "" && !menuCategories.some((c: any) => c.name === item.link)) && (
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase">Custom Target</label>
                          <input
                            type="text"
                            required
                            value={item.link === "custom_temp" ? "" : item.link}
                            onChange={(e) => handleItemChange(idx, "link", e.target.value)}
                            placeholder="e.g. Laptops or /profile"
                            className="w-full bg-gray-950/80 border border-gray-850 rounded-lg px-3 py-2 text-xs text-white outline-none"
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 justify-between">
                          <label className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700/80 text-gray-300 px-2.5 py-1.5 rounded cursor-pointer text-[10px] font-semibold">
                            <Upload size={12} />
                            {uploadingIndex === idx ? "..." : "Upload"}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(idx, e)}
                              disabled={uploadingIndex !== null}
                              className="hidden"
                            />
                          </label>
                          <span className="text-[10px] text-gray-500 font-medium">or paste URL:</span>
                        </div>
                        <input
                          type="text"
                          required
                          value={item.image}
                          onChange={(e) => handleItemChange(idx, "image", e.target.value)}
                          placeholder="Image URL"
                          className="w-full bg-gray-950/80 border border-gray-855 rounded-lg px-3 py-2 text-xs text-white outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-gray-800 text-gray-200 text-sm font-semibold rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-[#5ab946] text-white text-sm font-semibold rounded-xl">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-gray-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {editingCategory ? "Edit Menu Category" : "Add Menu Category"}
              </h3>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>

            <form onSubmit={handleCategorySubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl flex items-center gap-2 text-xs">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Category Name *</label>
                <input
                  type="text"
                  required
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="e.g. CCTV"
                  className="w-full bg-gray-950/60 border border-gray-800 focus:border-[#5ab946] rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Display Order</label>
                <input
                  type="number"
                  value={categoryDisplayOrder}
                  onChange={(e) => setCategoryDisplayOrder(e.target.value)}
                  className="w-full bg-gray-950/60 border border-gray-800 focus:border-[#5ab946] rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-950/40 rounded-xl border border-gray-800">
                <span className="text-xs font-bold text-gray-400 uppercase">Show In Menu</span>
                <button
                  type="button"
                  onClick={() => setCategoryShowInMenu(!categoryShowInMenu)}
                  className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  {categoryShowInMenu ? (
                    <ToggleRight size={32} className="text-[#5ab946]" />
                  ) : (
                    <ToggleLeft size={32} className="text-gray-600" />
                  )}
                </button>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsCategoryModalOpen(false)} 
                  className="px-5 py-2.5 bg-gray-800 text-gray-200 text-sm font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting} 
                  className="px-5 py-2.5 bg-[#5ab946] text-white text-sm font-semibold rounded-xl"
                >
                  {submitting ? "Saving..." : "Save Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-gray-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {editingFilter ? "Edit Sidebar Filter" : "Add Sidebar Filter"}
              </h3>
              <button onClick={() => setIsFilterModalOpen(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>

            <form onSubmit={handleSaveFilter} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl flex items-center gap-2 text-xs">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Filter Type *</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full bg-gray-950/60 border border-gray-800 focus:border-[#5ab946] rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                >
                  <option value="">Select type</option>
                  <option value="BRAND">Brand</option>
                  <option value="WARRANTY">Warranty</option>
                  <option value="PRICE_RANGE">Price Range</option>
                  <option value="DELIVERY">Delivery Option</option>
                  <option value="SORT">Sort Options</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Label / Heading *</label>
                <input
                  type="text"
                  required
                  value={filterLabel}
                  onChange={(e) => setFilterLabel(e.target.value)}
                  placeholder="e.g. Brand, Price, Warranty"
                  className="w-full bg-gray-950/60 border border-gray-800 focus:border-[#5ab946] rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Display Order</label>
                <input
                  type="number"
                  value={filterDisplayOrder}
                  onChange={(e) => setFilterDisplayOrder(e.target.value)}
                  className="w-full sm:w-1/3 bg-gray-950/60 border border-gray-800 focus:border-[#5ab946] rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-950/40 rounded-xl border border-gray-800">
                <span className="text-xs font-bold text-gray-400 uppercase">Enabled</span>
                <button
                  type="button"
                  onClick={() => setFilterIsEnabled(!filterIsEnabled)}
                  className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  {filterIsEnabled ? (
                    <ToggleRight size={32} className="text-[#5ab946]" />
                  ) : (
                    <ToggleLeft size={32} className="text-gray-600" />
                  )}
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">
                  Config (JSON, optional)
                </label>
                <textarea
                  value={filterConfig}
                  onChange={(e) => setFilterConfig(e.target.value)}
                  placeholder='e.g. {"options": ["Free Delivery", "Express"]}'
                  className="w-full bg-gray-950/60 border border-gray-800 focus:border-[#5ab946] rounded-xl px-4 py-2.5 text-xs text-white outline-none font-mono"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsFilterModalOpen(false)} 
                  className="px-5 py-2.5 bg-gray-800 text-gray-200 text-sm font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting} 
                  className="px-5 py-2.5 bg-[#5ab946] text-white text-sm font-semibold rounded-xl"
                >
                  {submitting ? "Saving..." : "Save Filter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
