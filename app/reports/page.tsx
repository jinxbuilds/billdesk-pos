"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { navButtonClass } from "@/lib/ui";

type ReportData = {
  summary: {
    totalSales: number;
    billCount: number;
    averageBill: number;
    cashSales: number;
    upiSales: number;
    cardSales: number;
    cashCount: number;
    upiCount: number;
    cardCount: number;
  };
  topItems: Array<{
    itemName: string;
    qty: number;
    revenue: number;
    avgPrice: number;
  }>;
  dateRange: {
    startDate: string;
    endDate: string;
  };
};

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split("T")[0];
  });

  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async (start?: string, end?: string) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (start) params.append("startDate", start);
      if (end) params.append("endDate", end);

      const response = await fetch(`/api/reports/detailed?${params}`);

      if (!response.ok) {
        setError("Failed to load reports");
        return;
      }

      const data = await response.json();
      setReports(data);
    } catch (err) {
      console.error("Failed to fetch reports:", err);
      setError("Error loading reports");
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilter = () => {
    fetchReports(startDate, endDate);
  };

  const handleExport = () => {
    if (!reports) return;

    const csv = [
      ["Restaurant Sales Report"],
      [`Date Range: ${reports.dateRange.startDate} to ${reports.dateRange.endDate}`],
      [],
      ["SUMMARY METRICS"],
      ["Total Sales", `₹${reports.summary.totalSales.toFixed(2)}`],
      ["Bill Count", reports.summary.billCount],
      ["Average Bill Value", `₹${reports.summary.averageBill.toFixed(2)}`],
      [],
      ["PAYMENT MODE BREAKDOWN"],
      ["Cash Sales", `₹${reports.summary.cashSales.toFixed(2)}`, `(${reports.summary.cashCount} bills)`],
      ["UPI Sales", `₹${reports.summary.upiSales.toFixed(2)}`, `(${reports.summary.upiCount} bills)`],
      ["Card Sales", `₹${reports.summary.cardSales.toFixed(2)}`, `(${reports.summary.cardCount} bills)`],
      [],
      ["TOP SELLING ITEMS"],
      ["Item Name", "Quantity", "Revenue", "Avg Price"],
      ...reports.topItems.map((item) => [
        item.itemName,
        item.qty,
        `₹${item.revenue.toFixed(2)}`,
        `₹${item.avgPrice.toFixed(2)}`,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report_${reports.dateRange.startDate}_to_${reports.dateRange.endDate}.csv`;
    a.click();
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 md:p-6">
      {/* Navigation */}
      <nav className="mb-8 flex gap-4 flex-wrap">
        <Link
          href="/dashboard"
          className={navButtonClass}
        >
          Dashboard
        </Link>
        <Link
          href="/pos"
          className={navButtonClass}
        >
          Sales
        </Link>
        <Link
          href="/bills"
          className={navButtonClass}
        >
          Bills
        </Link>
        <Link
          href="/reports"
          className={navButtonClass}
        >
          Reports
        </Link>
      </nav>

      <h1 className="text-3xl md:text-4xl font-bold mb-8">Reports</h1>

      {/* Date Filter */}
<div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-8 shadow-lg">
  <div className="flex items-center justify-between mb-5">
    <div>
      <h2 className="text-xl font-bold text-white">
        Reports Filter
      </h2>
      <p className="text-slate-400 text-sm">
        Select a date range to analyze sales
      </p>
    </div>
  </div>

  <div className="grid md:grid-cols-2 gap-4 mb-5">
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">
        Start Date
      </label>

      <input
        type="date"
        value={startDate}
        onChange={(e) =>
          setStartDate(e.target.value)
        }
        className="
          w-full
          bg-slate-800
          border
          border-slate-700
          rounded-xl
          px-4
          py-3
          text-white
          focus:outline-none
          focus:ring-2
          focus:ring-orange-500
          focus:border-orange-500
        "
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">
        End Date
      </label>

      <input
        type="date"
        value={endDate}
        onChange={(e) =>
          setEndDate(e.target.value)
        }
        className="
          w-full
          bg-slate-800
          border
          border-slate-700
          rounded-xl
          px-4
          py-3
          text-white
          focus:outline-none
          focus:ring-2
          focus:ring-orange-500
          focus:border-orange-500
        "
      />
    </div>
  </div>

  <div className="flex flex-col md:flex-row gap-3">
    <button
      onClick={handleDateFilter}
      className="
        flex-1
        bg-orange-500
        hover:bg-orange-600
        text-white
        font-semibold
        px-5
        py-3
        rounded-xl
        transition
      "
    >
      Apply Filter
    </button>

    <button
      onClick={handleExport}
      disabled={!reports}
      className="
        flex-1
        bg-emerald-600
        hover:bg-emerald-700
        disabled:bg-slate-700
        disabled:text-slate-400
        text-white
        font-semibold
        px-5
        py-3
        rounded-xl
        transition
      "
    >
      Export CSV
    </button>
  </div>
</div>

      {loading ? (
        <p className="text-center text-gray-600">Loading reports...</p>
      ) : error ? (
        <p className="text-center text-red-600">{error}</p>
      ) : reports ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg">
    <p className="text-slate-400 text-sm mb-2">
      Total Sales
    </p>

    <h2 className="text-4xl font-bold text-orange-400">
      ₹{reports.summary.totalSales.toFixed(2)}
    </h2>

    <p className="text-slate-500 mt-3 text-sm">
      Revenue Generated
    </p>
  </div>

  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg">
    <p className="text-slate-400 text-sm mb-2">
      Bills Generated
    </p>

    <h2 className="text-4xl font-bold text-cyan-400">
      {reports.summary.billCount}
    </h2>

    <p className="text-slate-500 mt-3 text-sm">
      Transactions
    </p>
  </div>

  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg">
    <p className="text-slate-400 text-sm mb-2">
      Average Bill
    </p>

    <h2 className="text-4xl font-bold text-green-400">
      ₹{reports.summary.averageBill.toFixed(2)}
    </h2>

    <p className="text-slate-500 mt-3 text-sm">
      Per Customer
    </p>
  </div>
</div>

          {/* Payment Mode Breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-8">
  <h2 className="text-xl font-bold mb-5">
    Payment Breakdown
  </h2>

  <div className="grid md:grid-cols-3 gap-4">
    <div className="bg-slate-800 rounded-2xl p-5">
      <div className="inline-block px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm mb-3">
        Cash
      </div>

      <p className="text-3xl font-bold">
        ₹{reports.summary.cashSales.toFixed(2)}
      </p>

      <p className="text-slate-400 mt-2">
        {reports.summary.cashCount} bills
      </p>
    </div>

    <div className="bg-slate-800 rounded-2xl p-5">
      <div className="inline-block px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-sm mb-3">
        UPI
      </div>

      <p className="text-3xl font-bold">
        ₹{reports.summary.upiSales.toFixed(2)}
      </p>

      <p className="text-slate-400 mt-2">
        {reports.summary.upiCount} bills
      </p>
    </div>

    <div className="bg-slate-800 rounded-2xl p-5">
      <div className="inline-block px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-sm mb-3">
        Card
      </div>

      <p className="text-3xl font-bold">
        ₹{reports.summary.cardSales.toFixed(2)}
      </p>

      <p className="text-slate-400 mt-2">
        {reports.summary.cardCount} bills
      </p>
    </div>
  </div>
</div>

          {/* Top Selling Items */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
  <h2 className="text-xl font-bold mb-5">
    Top Selling Items
  </h2>

  <div className="overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr className="border-b border-slate-700 text-slate-400">
          <th className="text-left py-4">
            Item
          </th>
          <th className="text-right py-4">
            Qty
          </th>
          <th className="text-right py-4">
            Revenue
          </th>
          <th className="text-right py-4">
            Avg Price
          </th>
        </tr>
      </thead>

      <tbody>
        {reports.topItems.map((item, index) => (
          <tr
            key={index}
            className="border-b border-slate-800 hover:bg-slate-800/50"
          >
            <td className="py-4 font-medium">
              {item.itemName}
            </td>

            <td className="text-right py-4">
              {item.qty}
            </td>

            <td className="text-right py-4 text-orange-400 font-semibold">
              ₹{item.revenue.toFixed(2)}
            </td>

            <td className="text-right py-4 text-slate-300">
              ₹{item.avgPrice.toFixed(2)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
        </>
      ) : (
        <p className="text-center text-gray-600">No data available</p>
      )}
    </main>
  );
}
