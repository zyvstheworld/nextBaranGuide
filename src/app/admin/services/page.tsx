"use client"

import { Suspense } from "react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Service {
  id: string;
  title: string;
  requirements: string;
  price: number;
  duration: string;
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5f3dc4]"></div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
      <strong className="font-bold">Error: </strong>
      <span className="block sm:inline">{message}</span>
    </div>
  );
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editService, setEditService] = useState<Service | null>(null);
  const [form, setForm] = useState({
    title: "",
    requirements: "",
    price: 0,
    duration: ""
  });
  const [error, setError] = useState("");

  // Fetch Services from Supabase
  const fetchServices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      if (data) {
        setServices(data);
      }
    } catch (err) {
      console.error("Error fetching services:", err);
      setError("Failed to fetch services");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // Handle Add/Edit
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    const title = String(form.title).trim();
    const requirements = String(form.requirements).trim();
    const duration = String(form.duration).trim();
    
    if (!title || !requirements || !duration) {
      setError("Title, Requirements, and duration are required.");
      return;
    }

    try {
      const serviceData = {
        title,
        requirements,
        price: form.price,
        duration
      };

      if (editService) {
        // Edit
        const { data, error } = await supabase
          .from("services")
          .update(serviceData)
          .eq("id", editService.id)
          .select();
        
        if (error) {
          console.error("Supabase update error:", error);
          throw error;
        }
        setShowModal(false);
        setEditService(null);
        setForm({
          title: "",
          requirements: "",
          price: 0,
          duration: ""
        });
        await fetchServices();
      } else {
        // Add
        const { data, error } = await supabase
          .from("services")
          .insert([serviceData])
          .select();
        
        if (error) {
          console.error("Supabase insert error:", error);
          throw error;
        }
        setShowModal(false);
        setForm({
          title: "",
          requirements: "",
          price: 0,
          duration: ""
        });
        await fetchServices();
      }
    } catch (err) {
      console.error("Error saving service:", err);
      setError(editService ? "Failed to update service." : "Failed to add service.");
    }
  };

  // Handle Delete
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;
    
    try {
      const { error } = await supabase
        .from("services")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      await fetchServices();
    } catch (err) {
      console.error("Error deleting service:", err);
      setError("Failed to delete service.");
    }
  };

  // Open modal for add/edit
  const openModal = (service?: Service) => {
    if (service) {
      setEditService(service);
      setForm({
        title: service.title,
        requirements: service.requirements,
        price: service.price,
        duration: service.duration
      });
    } else {
      setEditService(null);
      setForm({
        title: "",
        requirements: "",
        price: 0,
        duration: ""
      });
    }
    setShowModal(true);
  };

  return (
    <Suspense fallback={<LoadingState />}>
      <div className="relative min-h-screen p-6">
        {/* Blurred Olongapo Seal Background */}
        <div className="absolute inset-0 z-0 flex items-center justify-center">
          <img
            src="/olongapo-seal.png"
            alt="Olongapo City Seal"
            className="blur-xl opacity-60 w-full h-full object-cover"
            style={{ position: 'absolute', inset: 0 }}
            draggable={false}
          />
        </div>
        <div className="relative z-10">
          <h1 className="text-2xl font-bold mb-6">Services</h1>
          {error && <ErrorState message={error} />}
          <div className="bg-white rounded-lg shadow p-6">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#5f3dc4] text-white">
                  <th className="py-3 px-4 rounded-tl-lg">Title</th>
                  <th className="py-3 px-4">Requirements</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4 rounded-tr-lg">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8">
                      <LoadingState />
                    </td>
                  </tr>
                ) : services.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8">No services found.</td>
                  </tr>
                ) : (
                  services.map((service) => (
                    <tr key={service.id} className="border-b last:border-b-0">
                      <td className="py-3 px-4">{service.title}</td>
                      <td className="py-3 px-4">{service.requirements}</td>
                      <td className="py-3 px-4">{service.price === 0 ? 'Free' : `₱${service.price.toFixed(2)}`}</td>
                      <td className="py-3 px-4">{service.duration}</td>
                      <td className="py-3 px-4">
                        <button
                          className="text-[#5f3dc4] font-semibold mr-4 hover:underline"
                          onClick={() => openModal(service)}
                        >
                          Edit
                        </button>
                        <button
                          className="text-red-600 font-semibold hover:underline"
                          onClick={() => handleDelete(service.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <button
              className="mt-6 px-6 py-2 bg-[#283593] text-white rounded hover:bg-[#1a237e] font-semibold"
              onClick={() => openModal()}
            >
              Add Service
            </button>
          </div>

          {/* Modal */}
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl relative">
                <button
                  className="absolute top-3 right-3 text-2xl text-gray-500 hover:text-gray-700"
                  onClick={() => setShowModal(false)}
                >
                  &times;
                </button>
                <h2 className="text-xl font-bold mb-4">{editService ? "Edit Service" : "Add New Service"}</h2>
                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label className="block font-semibold mb-1">Title</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#5f3dc4]"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Requirements</label>
                    <textarea
                      className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#5f3dc4]"
                      value={form.requirements}
                      onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                      required
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Price (₱)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#5f3dc4]"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Duration</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#5f3dc4]"
                      value={form.duration}
                      onChange={(e) => setForm({ ...form, duration: e.target.value })}
                      placeholder="e.g., 3-5 business days"
                      required
                    />
                  </div>
                  {error && <div className="text-red-500 text-sm">{error}</div>}
                  <div className="flex justify-end gap-4 mt-4">
                    <button
                      type="button"
                      className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#5f3dc4] text-white rounded font-semibold hover:bg-[#4b2fa6]"
                    >
                      {editService ? "Save Changes" : "Save Service"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </Suspense>
  );
} 