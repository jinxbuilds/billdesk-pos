"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type BillItem = {
  id: string;
  itemName: string;
  price: string;
  qty: number;
  lineTotal: string;
};

type BillData = {
  id: string;
  billNumber: number;
  restaurantId: string;
  paymentMode: string;
  totalAmount: string;
  createdAt: string;
  restaurant: {
    name: string;
  };
  items: BillItem[];
};

export default function ReceiptPage() {
  const params = useParams();
  const billId = params.id as string;

  const [bill, setBill] = useState<BillData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBill = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/bills/${billId}`);

        if (!response.ok) {
          setError("Bill not found");
          return;
        }

        const data = await response.json();
        setBill(data);
      } catch (err) {
        console.error("Failed to fetch bill:", err);
        setError("Failed to load bill");
      } finally {
        setLoading(false);
      }
    };

    if (billId) {
      fetchBill();
    }
  }, [billId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <main className="p-4 flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading receipt...</p>
      </main>
    );
  }

  if (error || !bill) {
    return (
      <main className="p-4 flex items-center justify-center min-h-screen">
        <p className="text-red-600">{error || "Bill not found"}</p>
      </main>
    );
  }

  const billDate = new Date(bill.createdAt);
  const formattedDate = billDate.toLocaleDateString();
  const formattedTime = billDate.toLocaleTimeString();

  return (
    <>
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none;
          }
          .receipt-container {
            max-width: 58mm;
            margin: 0;
            padding: 0;
          }
        }
      `}</style>

      <main className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="w-full max-w-xs">
          {/* Print Button - Hidden on Print */}
          <div className="no-print mb-4 flex gap-2">
            <button
              onClick={handlePrint}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Print Receipt
            </button>
            <button
              onClick={() => window.history.back()}
              className="flex-1 px-4 py-2 border rounded hover:bg-gray-100"
            >
              Back
            </button>
          </div>

          {/* Receipt Container - Thermal Printer Style */}
          <div className="receipt-container bg-white border border-gray-300 p-4 font-mono text-sm">
            {/* Header */}
            <div className="text-center border-b border-gray-300 pb-3 mb-3">
              <h1 className="text-lg font-bold">{bill.restaurant.name}</h1>
              <p className="text-xs text-gray-600 mt-1">RECEIPT</p>
            </div>

            {/* Bill Details */}
            <div className="border-b border-gray-300 pb-3 mb-3 text-xs">
              <div className="flex justify-between">
                <span>Bill #:</span>
                <span className="font-bold">{bill.billNumber}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>Date:</span>
                <span>{formattedDate}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>Time:</span>
                <span>{formattedTime}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>Payment:</span>
                <span className="font-bold">{bill.paymentMode}</span>
              </div>
            </div>

            {/* Items Header */}
            <div className="border-b border-gray-300 pb-2 mb-2 text-xs font-bold">
              <div className="flex justify-between">
                <span>Item</span>
                <span className="text-right">Qty × Price</span>
              </div>
            </div>

            {/* Items List */}
            <div className="border-b border-gray-300 pb-3 mb-3">
              {bill.items.map((item) => (
                <div key={item.id} className="text-xs mb-2">
                  <div className="font-semibold">{item.itemName}</div>
                  <div className="flex justify-between text-gray-700">
                    <span>
                      {item.qty} × ₹{parseFloat(item.price).toFixed(2)}
                    </span>
                    <span className="font-semibold">
                      ₹{parseFloat(item.lineTotal).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="text-center border-t-2 border-gray-300 pt-3">
              <div className="flex justify-between text-sm font-bold mb-2">
                <span>TOTAL</span>
                <span>₹{parseFloat(bill.totalAmount).toFixed(2)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-4 pt-3 border-t border-gray-300">
              <p className="text-xs text-gray-600">
                Thank you for your purchase!
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Please visit again
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
