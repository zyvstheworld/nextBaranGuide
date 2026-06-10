"use client";

import { Suspense, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import mammoth from "mammoth";

// Supabase client
const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5f3dc4]" />
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
      <strong>Error: </strong>{message}
    </div>
  );
}

export default function FAQsPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editFAQ, setEditFAQ] = useState<FAQ | null>(null);
  const [form, setForm] = useState({ question: "", answer: "" });
  const [error, setError] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);

  // ---------------- FETCH FAQs ----------------
  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("faqs")
        .select("id, question, answer")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFaqs(data || []);
    } catch {
      setError("Failed to fetch FAQs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  // ---------------- ADD / EDIT ----------------
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.question.trim() || !form.answer.trim()) {
      setError("Question and answer are required.");
      return;
    }

    // Prevent multiple entries in a single FAQ field: disallow newlines or Q:/A: blocks
    const multiEntryPattern = /\n|\r|Q:\s|A:\s/i;
    if (multiEntryPattern.test(form.question) || multiEntryPattern.test(form.answer)) {
      setError("Please submit a single question and a single answer. Remove extra Q/A pairs or newlines.");
      return;
    }

    try {
      if (editFAQ) {
        await supabase
          .from("faqs")
          .update(form)
          .eq("id", editFAQ.id);
      } else {
        await supabase.from("faqs").insert([form]);
      }

      setShowModal(false);
      setEditFAQ(null);
      setForm({ question: "", answer: "" });
      fetchFaqs();
    } catch {
      setError("Failed to save FAQ.");
    }
  };

  // ---------------- DELETE ----------------
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this FAQ?")) return;
    await supabase.from("faqs").delete().eq("id", id);
    fetchFaqs();
  };

  const openModal = (faq?: FAQ) => {
    if (faq) {
      setEditFAQ(faq);
      setForm({ question: faq.question, answer: faq.answer });
    } else {
      setEditFAQ(null);
      setForm({ question: "", answer: "" });
    }
    setShowModal(true);
  };

  // ---------------- FILE UPLOAD ----------------
  const handleUpload = async () => {
    if (!file) {
      setUploadMessage("Please select a DOCX file.");
      return;
    }

    if (file.type !== "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      setUploadMessage("Invalid DOCX file.");
      return;
    }

    setUploading(true);
    setUploadMessage("");

    try {
      // Extract DOCX text
      const buffer = await file.arrayBuffer();
      const { value } = await mammoth.extractRawText({ arrayBuffer: buffer });

      if (!value.trim()) throw new Error("DOCX contains no text.");

      const text = value.slice(0, 5000);

      // Call NEW FAQ upload route
      const res = await fetch("/api/gemini-faq-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) throw new Error("AI processing failed.");

      const { response } = await res.json();
      if (!response) throw new Error("No AI response.");

      // Parse FAQs
      const blocks = response.split(/\n\s*\n/);
      const parsedFaqs = blocks
        .map((block: string) => {
          const q = block.match(/Q:\s*(.+)/i);
          const a = block.match(/A:\s*(.+)/i);
          if (!q || !a) return null;
          return { question: q[1].trim(), answer: a[1].trim() };
        })
        .filter(Boolean) as { question: string; answer: string }[];

      if (!parsedFaqs.length) throw new Error("No FAQs generated.");

      // Deduplicate parsed FAQs (by normalized question)
      const normalize = (s: string) => s.trim().toLowerCase();
      const seen = new Set<string>();
      const uniqueNewFaqs: { question: string; answer: string }[] = [];
      for (const f of parsedFaqs) {
        const key = normalize(f.question);
        if (!seen.has(key)) {
          seen.add(key);
          uniqueNewFaqs.push(f);
        }
      }

      // Fetch existing questions to avoid inserting duplicates
      const { data: existing, error: existingError } = await supabaseClient
        .from("faqs")
        .select("question");

      const existingSet = new Set<string>();
      if (!existingError && existing) {
        for (const e of existing) {
          if (e && e.question) existingSet.add(normalize(e.question));
        }
      }

      const toInsert = uniqueNewFaqs.filter(f => !existingSet.has(normalize(f.question)));

      if (toInsert.length === 0) {
        const msg = "No new FAQs to add; all uploaded items already exist or were duplicates.";
        setUploadMessage(msg);
        setShowUploadModal(true);
      } else {
        await supabaseClient.from("faqs").insert(toInsert);
        const skipped = uniqueNewFaqs.length - toInsert.length;
        setUploadMessage(`Uploaded ${toInsert.length} FAQs successfully.${skipped > 0 ? ` Skipped ${skipped} duplicate(s).` : ""}`);
      }
      setFile(null);
      fetchFaqs();
    } catch (err: any) {
      setUploadMessage("Error: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  // ---------------- UI ----------------
  return (
    <Suspense fallback={<LoadingState />}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">FAQs</h1>
        {error && <ErrorState message={error} />}

        {/* TABLE */}
        <div className="bg-white rounded shadow p-6 mb-6">
          <table className="w-full">
            <thead className="bg-[#5f3dc4] text-white">
              <tr>
                <th className="p-3">Question</th>
                <th className="p-3">Answer</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3}><LoadingState /></td></tr>
              ) : faqs.length === 0 ? (
                <tr><td colSpan={3} className="p-6 text-center">No FAQs</td></tr>
              ) : (
                faqs.map(faq => (
                  <tr key={faq.id} className="border-b">
                    <td className="p-3">{faq.question}</td>
                    <td className="p-3">{faq.answer}</td>
                    <td className="p-3">
                      <button onClick={() => openModal(faq)} className="mr-4 text-blue-600">Edit</button>
                      <button onClick={() => handleDelete(faq.id)} className="text-red-600">Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <button onClick={() => openModal()} className="mt-4 bg-indigo-700 text-white px-4 py-2 rounded">
            Add FAQ
          </button>
        </div>

        {/* UPLOAD */}
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Upload DOCX</h3>
          <input type="file" accept=".docx" onChange={e => setFile(e.target.files?.[0] || null)} />
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="ml-3 bg-blue-600 text-white px-3 py-1 rounded"
          >
            {uploading ? "Processing..." : "Upload"}
          </button>
          {uploadMessage && <p className="mt-2">{uploadMessage}</p>}
        </div>

        {/* MODAL */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Upload Result</h3>
              <p className="mb-4">{uploadMessage}</p>
              <div className="flex justify-end">
                <button
                  className="px-4 py-2 bg-indigo-600 text-white rounded"
                  onClick={() => { setShowUploadModal(false); setUploadMessage(""); }}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
        {showModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
            <form onSubmit={handleSave} className="bg-white p-6 rounded w-full max-w-lg">
              <h2 className="text-xl font-bold mb-4">
                {editFAQ ? "Edit FAQ" : "Add FAQ"}
              </h2>
              <input
                className="w-full border p-2 mb-3"
                placeholder="Question"
                value={form.question}
                onChange={e => setForm({ ...form, question: e.target.value })}
              />
              <textarea
                className="w-full border p-2 mb-3"
                placeholder="Answer"
                value={form.answer}
                onChange={e => setForm({ ...form, answer: e.target.value })}
              />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded">
                  Save
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Suspense>
  );
}
