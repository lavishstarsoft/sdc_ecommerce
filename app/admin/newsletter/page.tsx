"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Download,
  Loader2,
  Mail,
  Search,
  Trash2,
  AlertTriangle
} from "lucide-react";

interface Subscriber {
  id: string;
  email: string;
  createdAt: string;
}

export default function AdminNewsletterPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    async function loadSubscribers() {
      try {
        const res = await fetch("/api/admin/newsletter", { cache: "no-store" });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to load subscribers.");
        }
        const data = await res.json();
        setSubscribers(data);
      } catch (err: any) {
        console.error("Failed to load subscribers:", err);
        setError(err.message || "Failed to load subscribers.");
      } finally {
        setLoading(false);
      }
    }
    loadSubscribers();
  }, []);

  const filteredSubscribers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return subscribers;
    return subscribers.filter((sub) => sub.email.toLowerCase().includes(query));
  }, [subscribers, searchQuery]);

  const handleDelete = async (id: string) => {
    setError(null);
    setSuccess(null);
    setDeletingId(id);

    try {
      const res = await fetch(`/api/admin/newsletter?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to delete subscriber.");
      }

      setSubscribers((prev) => prev.filter((sub) => sub.id !== id));
      setSuccess("Subscriber removed successfully.");
      setConfirmDeleteId(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Failed to delete subscriber:", err);
      setError(err.message || "Failed to delete subscriber.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportCSV = () => {
    if (subscribers.length === 0) return;
    
    const headers = ["ID", "Email Address", "Subscribe Date"];
    const rows = subscribers.map((sub) => [
      sub.id,
      sub.email,
      new Date(sub.createdAt).toISOString()
    ]);

    const csvContent = 
      "data:text/csv;charset=utf-8," + 
      [headers.join(","), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sdc_newsletter_subscribers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
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
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-gray-400 text-xs font-semibold uppercase tracking-[0.2em] mb-2">
            <Mail size={14} className="text-[#5ab946]" />
            Newsletter System
          </div>
          <h2 className="text-2xl font-black text-white">Subscribers</h2>
          <p className="text-gray-400 text-sm mt-1">
            Manage store newsletter subscriptions, view active emails, and export user lists.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleExportCSV}
            disabled={subscribers.length === 0}
            className="flex items-center justify-center gap-2 bg-[#5ab946] hover:bg-[#4ca03a] text-white px-5 py-2.5 rounded-xl font-bold transition-all text-sm w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Download size={18} />
            Export CSV
          </button>
          <Link
            href="/admin"
            className="flex items-center justify-center gap-2 border border-gray-700 hover:border-gray-500 text-gray-200 px-5 py-2.5 rounded-xl font-semibold transition-all text-sm w-full sm:w-auto"
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </Link>
        </div>
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

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-5 shadow-xl">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Total Subscribers</p>
          <p className="text-3xl font-black mt-2 text-white font-mono">{subscribers.length}</p>
        </div>
      </div>

      {/* Filters & Search bar */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="w-full relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text"
            placeholder="Search subscriber by email address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-950/50 border border-gray-800 focus:border-[#5ab946] rounded-xl text-sm text-white placeholder:text-gray-500 outline-none transition-colors"
          />
        </div>
      </div>

      {/* Table view */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        {filteredSubscribers.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Mail size={32} className="mx-auto mb-3 text-gray-500" />
            <p className="font-semibold text-gray-200">No subscribers found.</p>
            <p className="text-sm mt-1">Try a different search term or check back later.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-950/20 text-gray-400 font-bold">
                  <th className="p-4 sm:px-6">Email Address</th>
                  <th className="p-4 sm:px-6">Subscribe Date</th>
                  <th className="p-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {filteredSubscribers.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-900/20 transition-colors">
                    <td className="p-4 sm:px-6 font-semibold text-white flex items-center gap-2">
                      <Mail size={16} className="text-gray-500" />
                      {sub.email}
                    </td>
                    <td className="p-4 sm:px-6 text-gray-400">
                      <span className="flex items-center gap-1.5 text-xs">
                        <Calendar size={13} className="text-gray-550" />
                        {formatDate(sub.createdAt)}
                      </span>
                    </td>
                    <td className="p-4 sm:px-6 text-right">
                      {confirmDeleteId === sub.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-[10px] text-red-400 font-bold uppercase flex items-center gap-1">
                            <AlertTriangle size={11} /> Confirm?
                          </span>
                          <button
                            onClick={() => handleDelete(sub.id)}
                            disabled={deletingId === sub.id}
                            className="bg-red-600 hover:bg-red-700 text-white text-xs px-2.5 py-1 rounded-lg font-bold transition-all disabled:opacity-50 cursor-pointer"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(sub.id)}
                          className="text-gray-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-all inline-flex cursor-pointer"
                          title="Remove subscriber"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
