"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { navButtonClass } from "@/lib/ui";

type Bill = {
  id: string;
  billNumber: string;
  restaurantId: string;
  staffId: string;
  deviceId: string;
  paymentMode: string;
  totalAmount: string;
  status: string;
  createdAt: string;
  items: Array<{
    id: string;
    itemName: string;
    price: string;
    qty: number;
  }>;
};

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/bills");
      const data = await response.json();

      if (Array.isArray(data)) {
        setBills(data);
      }
    } catch (error) {
      console.error("Failed to fetch bills:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-950 text-white p-6 max-w-6xl mx-auto">
        <p>Loading bills...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6 max-w-6xl mx-auto">
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

      <h1 className="text-3xl font-bold mb-6">Bills</h1>

      {selectedBill ? (
  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
    <button
      onClick={() => setSelectedBill(null)}
      className="mb-6 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white"
    >
      ← Back
    </button>

    <div className="mb-6">
      <h2 className="text-3xl font-bold text-white mb-6">
        Bill #{selectedBill.billNumber}
      </h2>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-sm text-gray-400 mb-1">
            Date
          </p>
          <p className="text-white font-medium">
            {new Date(selectedBill.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-sm text-gray-400 mb-1">
            Status
          </p>
          <p className="text-green-400 font-medium">
            {selectedBill.status}
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-sm text-gray-400 mb-1">
            Payment
          </p>
          <p className="text-white font-medium">
            {selectedBill.paymentMode}
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-sm text-gray-400 mb-1">
            Total
          </p>
          <p className="text-red-400 text-2xl font-bold">
            ₹{selectedBill.totalAmount}
          </p>
        </div>
      </div>

      <h3 className="text-xl font-bold text-white mb-4">
        Items
      </h3>

      <div className="overflow-hidden rounded-xl border border-gray-800">
        <table className="w-full">
          <thead className="bg-gray-800">
            <tr>
              <th className="text-left p-4 text-gray-300">
                Item
              </th>
              <th className="text-left p-4 text-gray-300">
                Price
              </th>
              <th className="text-left p-4 text-gray-300">
                Qty
              </th>
              <th className="text-left p-4 text-gray-300">
                Total
              </th>
            </tr>
          </thead>

          <tbody>
            {selectedBill.items.map((item) => (
              <tr
                key={item.id}
                className="border-t border-gray-800"
              >
                <td className="p-4 text-white">
                  {item.itemName}
                </td>

                <td className="p-4 text-gray-300">
                  ₹{item.price}
                </td>

                <td className="p-4 text-gray-300">
                  {item.qty}
                </td>

                <td className="p-4 text-red-400 font-semibold">
                  ₹{Number(item.price) * item.qty}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
) : (
  <div className="grid gap-4">
    {bills.map((bill) => (
      <div
        key={bill.id}
        className="
          bg-gray-900
          border
          border-gray-800
          rounded-2xl
          p-5
        "
      >
        <div className="flex justify-between items-start">
          <div>
            <p className="text-white text-lg font-bold">
              Bill #{bill.billNumber}
            </p>

            <p className="text-gray-400 text-sm mt-1">
              {new Date(bill.createdAt).toLocaleString()}
            </p>
          </div>

          <div className="text-right">
            <p className="text-red-400 text-2xl font-bold">
              ₹{bill.totalAmount}
            </p>

            <p className="text-gray-400 text-sm">
              {bill.paymentMode}
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={() => setSelectedBill(bill)}
            className="
              flex-1
              bg-gray-800
              hover:bg-gray-700
              text-white
              rounded-xl
              py-3
              font-medium
            "
          >
            View Bill
          </button>

          <Link
            href={`/receipt/${bill.id}`}
            className="
              flex-1
              text-center
              bg-red-500
              hover:bg-red-600
              text-white
              rounded-xl
              py-3
              font-medium
            "
          >
          Receipt
        </Link>
      </div>
    </div>
  ))}
</div>
      )}
    </main>
  );
}
