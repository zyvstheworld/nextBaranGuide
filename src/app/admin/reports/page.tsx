"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { dateUtils } from "@/lib/dateUtils";

interface UnansweredQuestion {
  message_id: string;
  question: string;
  timestamp: string;
  answer_found: boolean;
  matched_faq?: string;
}

interface ReportData {
  total_unanswered: number;
  total_questions: number;
  percentage_unanswered: number;
  data: UnansweredQuestion[];
  generated_at: string;
}

export default function ReportsPage() {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "question">("date");

  const fetchReport = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/reports?format=json");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.details || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }
      const data: ReportData = await response.json();
      setReport(data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to fetch report";
      setError(errorMsg);
      console.error("Report fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleExportCSV = async () => {
    try {
      const response = await fetch("/api/admin/reports?format=csv");
      if (!response.ok) throw new Error("Failed to export CSV");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `unanswered-questions-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export");
    }
  };

  const handleExportJSON = () => {
    if (!report) return;

    const dataStr = JSON.stringify(report, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `unanswered-questions-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // Filter and sort data
  const filteredData = report?.data
    .filter((q) =>
      q.question.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      } else {
        return a.question.localeCompare(b.question);
      }
    }) || [];

  const getDateRange = (data: UnansweredQuestion[]) => {
    if (data.length === 0) return "No data";
    const dates = data.map((q) => new Date(q.timestamp).getTime());
    const oldest = new Date(Math.min(...dates));
    const newest = new Date(Math.max(...dates));
    return dateUtils.formatDateRange(oldest, newest);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Unanswered Questions Report
          </h1>
          <p className="text-gray-600">
            Track and analyze questions that haven't been answered or matched to existing FAQs
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Metrics Cards */}
        {report && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-600 mb-2">Total Questions</div>
              <div className="text-3xl font-bold text-[#5f3dc4] mb-2">
                {report.total_questions}
              </div>
              <div className="text-xs text-gray-500">All user queries analyzed</div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-600 mb-2">Unanswered</div>
              <div className="text-3xl font-bold text-red-600 mb-2">
                {report.total_unanswered}
              </div>
              <div className="text-xs text-gray-500">
                {report.percentage_unanswered}% of total
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-600 mb-2">Answered</div>
              <div className="text-3xl font-bold text-green-600 mb-2">
                {report.total_questions - report.total_unanswered}
              </div>
              <div className="text-xs text-gray-500">
                {100 - report.percentage_unanswered}% of total
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-600 mb-2">Date Range</div>
              <div className="text-sm font-mono text-[#5f3dc4] mb-2 truncate">
                {getDateRange(report.data)}
              </div>
              <div className="text-xs text-gray-500">Data period</div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5f3dc4] focus:border-transparent outline-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "date" | "question")}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5f3dc4] focus:border-transparent outline-none"
              >
                <option value="date">Sort by Date (Newest)</option>
                <option value="question">Sort by Question</option>
              </select>

              <button
                onClick={fetchReport}
                disabled={loading}
                className="px-4 py-2 bg-[#5f3dc4] text-white rounded-lg hover:bg-[#4c2fa3] disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? "Loading..." : "Refresh"}
              </button>

              <button
                onClick={handleExportCSV}
                disabled={!report}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Export CSV
              </button>

              <button
                onClick={handleExportJSON}
                disabled={!report}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Export JSON
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5f3dc4]" />
            </div>
          ) : filteredData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Question
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredData.map((question) => (
                    <tr key={question.message_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate hover:overflow-visible hover:whitespace-normal" title={question.question}>
                        {question.question}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {dateUtils.formatDateTime(question.timestamp)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                          Unanswered
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {report && report.data.length === 0
                  ? "No unanswered questions found! 🎉"
                  : "No questions match your search"}
              </p>
            </div>
          )}
        </div>

        {/* Footer Stats */}
        {report && (
          <div className="mt-8 text-center text-sm text-gray-600">
            <p>
              Showing {filteredData.length} of {report.total_unanswered} unanswered
              questions
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Report generated on {dateUtils.formatDateTime(report.generated_at)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
