"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ReportData = {
  totalSales: number;
  billCount: number;
  cashSales: number;
  upiSales: number;
  averageBill: number;
};

export default function DashboardPage() {
  const [reports, setReports] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/reports");
      const data = await response.json();
      setReports(data);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Navigation */}
      <nav className="mb-8 flex gap-4 flex-wrap">
        <Link
          href="/dashboard"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Dashboard
        </Link>
        
        <Link
          href="/pos"
          className="px-4 py-2 border rounded hover:bg-gray-100"
        >
          POS
        </Link>
        <Link
          href="/bills"
          className="px-4 py-2 border rounded hover:bg-gray-100"
        >
          Bills
        </Link>
        <Link
          href="/reports"
          className="px-4 py-2 border rounded hover:bg-gray-100"
        >
          Reports
        </Link>
        <button
  onClick={() => {
    localStorage.removeItem("pos-session");
    window.location.href = "/login";
  }}
  className="px-3 py-2 rounded border hover:bg-red-100"
>
  Logout
</button>
      </nav>

      <h1 className="text-3xl md:text-4xl font-bold mb-8">Dashboard</h1>

      {loading ? (
        <p className="text-center text-gray-600">Loading reports...</p>
      ) : reports ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Total Sales Card */}
          <div className="border rounded-lg p-4 md:p-6 bg-white shadow">
            <div className="text-sm md:text-base text-gray-600 mb-2">
              Total Sales Today
            </div>
            <div className="text-2xl md:text-3xl font-bold text-green-600">
              ₹{(reports?.totalSales ?? 0).toFixed(2)}
            </div>
          </div>

          {/* Bill Count Card */}
          <div className="border rounded-lg p-4 md:p-6 bg-white shadow">
            <div className="text-sm md:text-base text-gray-600 mb-2">
              Number of Bills
            </div>
            <div className="text-2xl md:text-3xl font-bold text-blue-600">
              {reports.billCount}
            </div>
          </div>

          {/* Cash Sales Card */}
          <div className="border rounded-lg p-4 md:p-6 bg-white shadow">
            <div className="text-sm md:text-base text-gray-600 mb-2">
              Cash Sales
            </div>
            <div className="text-2xl md:text-3xl font-bold text-purple-600">
              ₹{(reports?.cashSales ?? 0).toFixed(2)}
            </div>
          </div>

          {/* UPI Sales Card */}
          <div className="border rounded-lg p-4 md:p-6 bg-white shadow">
            <div className="text-sm md:text-base text-gray-600 mb-2">
              UPI Sales
            </div>
            <div className="text-2xl md:text-3xl font-bold text-orange-600">
              ₹{(reports?.upiSales ?? 0).toFixed(2)}
            </div>
          </div>

          {/* Average Bill Value Card */}
          <div className="border rounded-lg p-4 md:p-6 bg-white shadow">
            <div className="text-sm md:text-base text-gray-600 mb-2">
              Average Bill Value
            </div>
            <div className="text-2xl md:text-3xl font-bold text-indigo-600">
              ₹{(reports?.averageBill ?? 0).toFixed(2)}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-center text-gray-600">
          Failed to load reports
        </p>
        
      )}
    </main>
  );
}
