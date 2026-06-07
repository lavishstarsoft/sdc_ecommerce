"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  getProducts, 
  deleteProduct, 
  Product 
} from "@/lib/storeService";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Check
} from "lucide-react";

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  
  // Status states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    let result = products;
    
    if (searchQuery.trim() !== "") {
      result = result.filter(p => 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    if (categoryFilter !== "All") {
      result = result.filter(p => p.category === categoryFilter);
    }
    
    setFilteredProducts(result);
  }, [searchQuery, categoryFilter, products]);

  async function loadProducts() {
    setLoading(true);
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    
    try {
      await deleteProduct(id);
      setSuccess("Product deleted successfully!");
      await loadProducts();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to delete product.");
    }
  };

  // Get distinct categories in products
  const categoriesList = ["All", ...Array.from(new Set(products.map(p => p.category)))];

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white">Product Catalog</h2>
          <p className="text-gray-400 text-sm mt-1">Add, edit and manage products shown in the store.</p>
        </div>
        <Link
          href="/admin/products/add"
          className="flex items-center justify-center gap-2 bg-[#5ab946] hover:bg-[#4ca03a] text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-[#5ab946]/10 transition-all active:scale-95 text-sm w-full sm:w-auto"
        >
          <Plus size={18} />
          Add Product
        </Link>
      </div>

      {/* Messages */}
      {success && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-4 rounded-xl flex items-center gap-3 text-sm">
          <Check size={18} className="flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-center gap-3 text-sm">
          <Trash2 size={18} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text"
            placeholder="Search products by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-950/50 border border-gray-800 focus:border-[#5ab946] rounded-xl text-sm text-white placeholder:text-gray-500 outline-none transition-colors"
          />
        </div>
        
        {/* Category Filter */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 font-semibold uppercase">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-gray-950/50 border border-gray-800 focus:border-[#5ab946] rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-colors animate-none"
          >
            {categoriesList.map(cat => (
              <option key={cat} value={cat} className="bg-[#111827] text-white">{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#5ab946]"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="text-xs uppercase text-gray-500 bg-gray-900/40 border-b border-gray-800">
                <tr>
                  <th className="px-6 py-4 font-semibold">Image</th>
                  <th className="px-6 py-4 font-semibold">Title</th>
                  <th className="px-6 py-4 font-semibold">Category</th>
                  <th className="px-6 py-4 font-semibold text-right">Price</th>
                  <th className="px-6 py-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-800/10 group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-12 w-12 bg-gray-950 rounded-lg overflow-hidden border border-gray-800 flex items-center justify-center relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={product.image_url}
                          alt={product.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-white group-hover:text-[#5ab946] transition-colors line-clamp-1">{product.title}</div>
                      <div className="text-xs text-gray-500 line-clamp-1 mt-0.5">{product.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs">
                      <span className="bg-gray-800 border border-gray-700/60 text-gray-300 px-2.5 py-1 rounded-full">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-mono font-bold text-white">
                      ₹{product.price.toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/admin/products/edit/${product.id}`}
                          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
                          title="Edit Product"
                        >
                          <Edit size={16} />
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Delete Product"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-16 text-gray-500">
                      No matching products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
