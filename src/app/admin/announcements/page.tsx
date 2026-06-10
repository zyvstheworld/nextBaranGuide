"use client";

import { useEffect, useState } from "react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editAnnouncement, setEditAnnouncement] = useState<Announcement | null>(null);
  const [form, setForm] = useState({ title: "", content: "", is_active: true });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");

  // Fetch announcements
  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/admin/announcements");
      if (!response.ok) throw new Error("Failed to fetch announcements");
      const data = await response.json();
      setAnnouncements(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch announcements");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // Handle Add/Edit
  const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const title = form.title.trim();
    const content = form.content.trim();
    let imageUrl = imagePreview;

    if (!title || !content) {
      setError("Title and content are required");
      return;
    }

    if (imageFile) {
      try {
        imageUrl = await readFileAsDataUrl(imageFile);
      } catch (err) {
        setError("Failed to read image file.");
        return;
      }
    }

    try {
      const url = editAnnouncement
        ? `/api/admin/announcements/${editAnnouncement.id}`
        : "/api/admin/announcements";

      const method = editAnnouncement ? "PUT" : "POST";

      const payload: any = {
        title,
        content,
        is_active: form.is_active,
      };
      if (imageUrl) payload.image_url = imageUrl;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`Failed to ${editAnnouncement ? "update" : "create"} announcement`);

      await fetchAnnouncements();
      setShowModal(false);
      setForm({ title: "", content: "", is_active: true });
      setEditAnnouncement(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed");
      console.error("Error:", err);
    }
  };

  // Handle Edit
  const handleEdit = (announcement: Announcement) => {
    setEditAnnouncement(announcement);
    setForm({
      title: announcement.title,
      content: announcement.content,
      is_active: announcement.is_active,
    });
    setImagePreview(announcement.image_url || "");
    setImageFile(null);
    setShowModal(true);
  };

  // Handle Delete
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;

    try {
      const response = await fetch(`/api/admin/announcements/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete announcement");

      await fetchAnnouncements();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete announcement");
      console.error("Error:", err);
    }
  };

  // Handle Close Modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditAnnouncement(null);
    setForm({ title: "", content: "", is_active: true });
    setImageFile(null);
    setImagePreview("");
    setError("");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Announcements Management
            </h1>
            <p className="text-gray-600">Create and manage announcements for your users</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-2 bg-[#5f3dc4] text-white rounded-lg hover:bg-[#4c2fa3] font-medium"
          >
            + New Announcement
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold">
                  {editAnnouncement ? "Edit Announcement" : "New Announcement"}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5f3dc4] focus:border-transparent outline-none"
                    placeholder="Announcement title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content *
                  </label>
                  <textarea
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5f3dc4] focus:border-transparent outline-none resize-none"
                    placeholder="Announcement content"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image file
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setImageFile(file);
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => setImagePreview(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full text-sm text-gray-600"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Optional. Choose an image from your computer to upload.
                  </p>
                </div>

                {imagePreview && (
                  <div className="rounded-lg overflow-hidden border border-gray-200 mb-4">
                    <img src={imagePreview} alt="Announcement preview" className="w-full h-48 object-cover" />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <label htmlFor="is_active" className="text-sm text-gray-700">
                    Active (visible to users)
                  </label>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-[#5f3dc4] text-white rounded-lg hover:bg-[#4c2fa3] font-medium"
                  >
                    {editAnnouncement ? "Update" : "Create"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Announcements List */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5f3dc4]" />
            </div>
          ) : announcements.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      {announcement.image_url && (
                        <div className="mb-4 overflow-hidden rounded-2xl h-44">
                          <img
                            src={announcement.image_url}
                            alt={announcement.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-gray-900">
                          {announcement.title}
                        </h3>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            announcement.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {announcement.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="text-gray-600 mt-2 line-clamp-2">
                        {announcement.content}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(announcement)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 font-medium text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(announcement.id)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 font-medium text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Created: {new Date(announcement.created_at).toLocaleString()}
                    {announcement.updated_at !== announcement.created_at && (
                      <> • Updated: {new Date(announcement.updated_at).toLocaleString()}</>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No announcements yet</p>
              <button
                onClick={() => setShowModal(true)}
                className="mt-4 px-4 py-2 text-[#5f3dc4] hover:text-[#4c2fa3] font-medium"
              >
                Create your first announcement
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
