"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
    <main className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Navigation */}
      <nav className="mb-8 flex gap-4 flex-wrap">
        <Link
          href="/dashboard"
          className="px-4 py-2 border rounded hover:bg-gray-100"
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
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Reports
        </Link>
      </nav>

      <h1 className="text-3xl md:text-4xl font-bold mb-8">Reports</h1>

      {/* Date Filter */}
      <div className="bg-white border rounded-lg p-4 md:p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Date Range Filter</h2>
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div className="flex gap-2 items-end">
            <button
              onClick={handleDateFilter}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Filter
            </button>
            <button
              onClick={handleExport}
              disabled={!reports}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300"
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-600">Loading reports...</p>
      ) : error ? (
        <p className="text-center text-red-600">{error}</p>
      ) : reports ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
            {/* Total Sales */}
            <div className="bg-white border rounded-lg p-4 md:p-6 shadow">
              <div className="text-sm md:text-base text-gray-600 mb-2">
                Total Sales
              </div>
              <div className="text-2xl md:text-3xl font-bold text-green-600">
                ₹{reports.summary.totalSales.toFixed(2)}
              </div>
              <div className="text-xs md:text-sm text-gray-500 mt-2">
                {reports.dateRange.startDate} to {reports.dateRange.endDate}
              </div>
            </div>

            {/* Bill Count */}
            <div className="bg-white border rounded-lg p-4 md:p-6 shadow">
              <div className="text-sm md:text-base text-gray-600 mb-2">
                Number of Bills
              </div>
              <div className="text-2xl md:text-3xl font-bold text-blue-600">
                {reports.summary.billCount}
              </div>
              <div className="text-xs md:text-sm text-gray-500 mt-2">
                Total transactions
              </div>
            </div>

            {/* Average Bill */}
            <div className="bg-white border rounded-lg p-4 md:p-6 shadow">
              <div className="text-sm md:text-base text-gray-600 mb-2">
                Average Bill Value
              </div>
              <div className="text-2xl md:text-3xl font-bold text-indigo-600">
                ₹{reports.summary.averageBill.toFixed(2)}
              </div>
              <div className="text-xs md:text-sm text-gray-500 mt-2">
                Per transaction
              </div>
            </div>
          </div>

          {/* Payment Mode Breakdown */}
          <div className="bg-white border rounded-lg p-4 md:p-6 shadow mb-8">
            <h2 className="text-lg md:text-xl font-semibold mb-4">
              Payment Mode Breakdown
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Cash */}
              <div className="border rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-2">Cash</div>
                <div className="text-2xl font-bold text-purple-600">
                  ₹{reports.summary.cashSales.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  {reports.summary.cashCount} bills
                </div>
                <div className="text-xs text-gray-500">
                  {reports.summary.totalSales > 0
                    ? (
                        (reports.summary.cashSales / reports.summary.totalSales) *
                        100
                      ).toFixed(1)
                    : 0}
                  % of total
                </div>
              </div>

              {/* UPI */}
              <div className="border rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-2">UPI</div>
                <div className="text-2xl font-bold text-orange-600">
                  ₹{reports.summary.upiSales.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  {reports.summary.upiCount} bills
                </div>
                <div className="text-xs text-gray-500">
                  {reports.summary.totalSales > 0
                    ? (
                        (reports.summary.upiSales / reports.summary.totalSales) *
                        100
                      ).toFixed(1)
                    : 0}
                  % of total
                </div>
              </div>

              {/* Card */}
              <div className="border rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-2">Card</div>
                <div className="text-2xl font-bold text-pink-600">
                  ₹{reports.summary.cardSales.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  {reports.summary.cardCount} bills
                </div>
                <div className="text-xs text-gray-500">
                  {reports.summary.totalSales > 0
                    ? (
                        (reports.summary.cardSales / reports.summary.totalSales) *
                        100
                      ).toFixed(1)
                    : 0}
                  % of total
                </div>
              </div>
            </div>
          </div>

          {/* Top Selling Items */}
          <div className="bg-white border rounded-lg p-4 md:p-6 shadow">
            <h2 className="text-lg md:text-xl font-semibold mb-4">
              Top Selling Items
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm md:text-base">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 md:p-4 font-semibold">
                      Item Name
                    </th>
                    <th className="text-right p-3 md:p-4 font-semibold">
                      Qty Sold
                    </th>
                    <th className="text-right p-3 md:p-4 font-semibold">
                      Revenue
                    </th>
                    <th className="text-right p-3 md:p-4 font-semibold">
                      Avg Price
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reports.topItems.map((item, index) => (
                    <tr key={index} className="border-t hover:bg-gray-50">
                      <td className="p-3 md:p-4">{item.itemName}</td>
                      <td className="text-right p-3 md:p-4">
                        {item.qty}
                      </td>
                      <td className="text-right p-3 md:p-4 font-semibold">
                        ₹{item.revenue.toFixed(2)}
                      </td>
                      <td className="text-right p-3 md:p-4">
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
