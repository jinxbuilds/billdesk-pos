"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
      <main className="p-6 max-w-6xl mx-auto">
        <p>Loading bills...</p>
      </main>
    );
  }

  return (
    <main className="p-6 max-w-6xl mx-auto">
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
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Bills
        </Link>
        <Link
          href="/reports"
          className="px-4 py-2 border rounded hover:bg-gray-100"
        >
          Reports
        </Link>
      </nav>

      <h1 className="text-3xl font-bold mb-6">Bills</h1>

      {selectedBill ? (
        <div className="border rounded-lg p-6 mb-6">
          <button
            onClick={() => setSelectedBill(null)}
            className="mb-4 px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
          >
            ← Back
          </button>

          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4">
              Bill #{selectedBill.billNumber}
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-semibold">
                  {new Date(selectedBill.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-semibold">{selectedBill.status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Payment Mode</p>
                <p className="font-semibold">{selectedBill.paymentMode}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="font-semibold text-lg">₹{selectedBill.totalAmount}</p>
              </div>
            </div>

            <h3 className="text-xl font-bold mb-4">Items</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left p-4">Item</th>
                    <th className="text-left p-4">Price</th>
                    <th className="text-left p-4">Qty</th>
                    <th className="text-left p-4">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedBill.items.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="p-4">{item.itemName}</td>
                      <td className="p-4">₹{item.price}</td>
                      <td className="p-4">{item.qty}</td>
                      <td className="p-4">
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
        <div className="border rounded-lg overflow-hidden">
          {bills.length === 0 ? (
            <p className="p-6 text-center text-gray-500">No bills found</p>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left p-4">Bill #</th>
                  <th className="text-left p-4">Date</th>
                  <th className="text-left p-4">Total</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Payment</th>
                  <th className="text-left p-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => (
                  <tr key={bill.id} className="border-t hover:bg-gray-50">
                    <td className="p-4 font-semibold">{bill.billNumber}</td>
                    <td className="p-4">
                      {new Date(bill.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">₹{bill.totalAmount}</td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded text-sm ${
                          bill.status === "COMPLETED"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {bill.status}
                      </span>
                    </td>
                    <td className="p-4">{bill.paymentMode}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedBill(bill)}
                          className="text-blue-600 hover:underline"
                        >
                          View
                        </button>
                        <Link
                          href={`/receipt/${bill.id}`}
                          className="text-green-600 hover:underline"
                        >
                          Receipt
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </main>
  );
}
