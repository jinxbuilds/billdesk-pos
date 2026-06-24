"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { navButtonClass } from "@/lib/ui";
import PageHeader from "../components/PageHeader";

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
  const router = useRouter();
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);
  
  
  useEffect(() => {
    fetchReports();
  }, []);

  const handlePressStart = () => {
  const timer = setTimeout(() => {
    router.push("/dashboard/menu");
  }, 2000); // 2 second long press

  setPressTimer(timer);
};

const handlePressEnd = () => {
  if (pressTimer) {
    clearTimeout(pressTimer);
    setPressTimer(null);
  }
};

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
    <main className="p-4 px-24 md:p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Dashboard"
        subtitle="Hotel MH 11 (Airoli)"
      />
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

      <h1 className="text-4xl font-bold mb-2 text-white">
  Dashboard
</h1>

<p className="text-slate-400 mb-8">
  Today's restaurant performance
</p>

{loading ? (
  <p className="text-center text-slate-400">
    Loading reports...
  </p>
) : reports ? (
  <>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5">

      {/* Total Sales */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 border border-slate-700">
        <p className="text-orange-100 text-sm">
          Total Sales
        </p>

        <h2 className="text-4xl font-bold text-white mt-2">
          ₹{(reports?.totalSales ?? 0).toFixed(2)}
        </h2>

        <p className="text-orange-100 mt-4 text-sm">
          Today's Revenue
        </p>
      </div>

      {/* Bills */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
        <p className="text-slate-400 text-sm">
          Bills
        </p>

        <h2 className="text-4xl font-bold text-cyan-400 mt-2">
          {reports.billCount}
        </h2>

        <p className="text-slate-500 mt-4 text-sm">
          Transactions
        </p>
      </div>

      {/* Cash */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
        <p className="text-slate-400 text-sm">
          Cash
        </p>

        <h2 className="text-4xl font-bold text-green-400 mt-2">
          ₹{(reports?.cashSales ?? 0).toFixed(2)}
        </h2>

        <p className="text-slate-500 mt-4 text-sm">
          Cash Collection
        </p>
      </div>

      {/* UPI */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
        <p className="text-slate-400 text-sm">
          UPI
        </p>

        <h2 className="text-4xl font-bold text-purple-400 mt-2">
          ₹{(reports?.upiSales ?? 0).toFixed(2)}
        </h2>

        <p className="text-slate-500 mt-4 text-sm">
          Digital Payments
        </p>
      </div>

      {/* Average Bill */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
        <p className="text-slate-400 text-sm">
          Average Bill
        </p>

        <h2 className="text-4xl font-bold text-yellow-400 mt-2">
          ₹{(reports?.averageBill ?? 0).toFixed(2)}
        </h2>

        <p className="text-slate-500 mt-4 text-sm">
          Per Customer
        </p>
      </div>
    </div>

    {/* Quick Stats Strip */}

    <div className="mt-8 bg-slate-900 border border-slate-800 rounded-3xl p-6">
      <div className="flex flex-col md:flex-row md:justify-between gap-6">

        <div>
          <p className="text-slate-400 text-sm">
            Sales Today
          </p>
          <p className="text-2xl font-bold text-white">
            ₹{(reports?.totalSales ?? 0).toFixed(2)}
          </p>
        </div>

        <div>
          <p className="text-slate-400 text-sm">
            Average Order
          </p>
          <p className="text-2xl font-bold text-white">
            ₹{(reports?.averageBill ?? 0).toFixed(2)}
          </p>
        </div>

        <div>
          <p className="text-slate-400 text-sm">
            Total Orders
          </p>
          <p className="text-2xl font-bold text-white">
            {reports.billCount}
          </p>
        </div>
      </div>
    </div>
  </>
) : (
  <p className="text-center text-red-400">
    Failed to load reports
  </p>
)}
        <div className="mt-8 flex justify-center">
  <button
    onClick={() => {
      localStorage.removeItem("pos-session");
      window.location.href = "/login";
    }}
    className="
      px-6
      py-3
      rounded-xl
      bg-red-600
      hover:bg-red-700
      text-white
      font-medium
      shadow-sm
      hover:shadow-md
      transition-all
      duration-200
    "
  >
    Logout
  </button>
</div>
      
       <footer className="mt-12 text-center border-t border-stone-200 dark:border-zinc-800 pt-4">
  <button
    onMouseDown={handlePressStart}
    onMouseUp={handlePressEnd}
    onMouseLeave={handlePressEnd}
    onTouchStart={handlePressStart}
    onTouchEnd={handlePressEnd}
    className="
      text-xs
      text-stone-400
      dark:text-zinc-500
      hover:text-emerald-600
      dark:hover:text-emerald-400
      transition-colors
    "
  >
    POS v1.0
  </button>
</footer>
    </main>
  );
}
