"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Official {
  id: string;
  name: string;
  position: string;
  order: number;
}

export default function OfficialsPage() {
  const [officials, setOfficials] = useState<Official[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editOfficial, setEditOfficial] = useState<Official | null>(null);
  const [form, setForm] = useState({
    name: "",
    position: "",
    order: 0,
  });
  const [error, setError] = useState("");

  const fetchOfficials = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("officials")
        .select("*")
        .order("order", { ascending: true });

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      if (data) {
        setOfficials(data as Official[]);
      }
    } catch (err) {
      console.error("Error fetching officials:", err);
      setError("Failed to fetch barangay officials.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOfficials();
  }, []);

  const openModal = (official?: Official) => {
    if (official) {
      setEditOfficial(official);
      setForm({
        name: official.name,
        position: official.position,
        order: official.order,
      });
    } else {
      setEditOfficial(null);
      setForm({ name: "", position: "", order: 0 });
    }
    setError("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditOfficial(null);
    setForm({ name: "", position: "", order: 0 });
    setError("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const name = form.name.trim();
    const position = form.position.trim();
    const order = Number(form.order);

    if (!name || !position) {
      setError("Name and position are required.");
      return;
    }

    try {
      if (editOfficial) {
        const { error } = await supabase
          .from("officials")
          .update({ name, position, order })
          .eq("id", editOfficial.id);

        if (error) {
          console.error("Supabase update error:", error);
          throw error;
        }
      } else {
        const { error } = await supabase
          .from("officials")
          .insert([{ name, position, order }]);

        if (error) {
          console.error("Supabase insert error:", error);
          throw error;
        }
      }

      await fetchOfficials();
      closeModal();
    } catch (err) {
      console.error("Error saving official:", err);
      setError(editOfficial ? "Failed to update official." : "Failed to add official.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this official?")) return;

    try {
      const { error } = await supabase
        .from("officials")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Supabase delete error:", error);
        throw error;
      }

      await fetchOfficials();
    } catch (err) {
      console.error("Error deleting official:", err);
      setError("Failed to delete official.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Barangay Officials
            </h1>
            <p className="text-gray-600">Manage barangay officials displayed on the landing page.</p>
          </div>
          <button
            onClick={() => openModal()}
            className="px-6 py-2 bg-[#5f3dc4] text-white rounded-lg hover:bg-[#4c2fa3] font-medium"
          >
            + Add Official
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="bg-white rounded-3xl shadow p-4 md:p-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#5f3dc4] text-white">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Position</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Order</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-gray-500">
                    Loading officials...
                  </td>
                </tr>
              ) : officials.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-gray-500">
                    No officials found. Add one to display them on the landing page.
                  </td>
                </tr>
              ) : (
                officials.map((official) => (
                  <tr key={official.id}>
                    <td className="px-4 py-4 text-sm text-gray-900">{official.name}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{official.position}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{official.order}</td>
                    <td className="px-4 py-4 text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => openModal(official)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(official.id)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editOfficial ? 'Edit Official' : 'Add Official'}
              </h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-900 text-2xl">
                ×
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4 px-6 py-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-gray-300 px-4 py-3 focus:border-[#5f3dc4] focus:outline-none"
                  placeholder="Hon. Juan Dela Cruz"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Position</label>
                <input
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-gray-300 px-4 py-3 focus:border-[#5f3dc4] focus:outline-none"
                  placeholder="Punong Barangay"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Display Order</label>
                <input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                  className="mt-2 w-full rounded-2xl border border-gray-300 px-4 py-3 focus:border-[#5f3dc4] focus:outline-none"
                  placeholder="1"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-2xl border border-gray-300 px-5 py-2 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-2xl bg-[#5f3dc4] px-5 py-2 text-white hover:bg-[#4c2fa3]"
                >
                  Save Official
                </button>
              </div>
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
