"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { v4 as uuidv4 } from "uuid";
import { registerDevice } from "@/lib/device";
import { getOrCreateDeviceId } from "@/lib/device";
import { useOfflineSync } from "@/lib/offline";
import { saveBillOffline, updateBillStatus } from "@/lib/indexeddb";
import {AuthGuard} from "@/components/AuthGuard";
type MenuItem = {
  id: string;
  name: string;
  price: string;
};

type CartItem = {
  id: string;
  name: string;
  price: string;
  qty: number;
};


export default function PosPage() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [deviceId, setDeviceId] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<"CASH" | "UPI">("UPI");
  const [staffId, setStaffId] = useState("");
  const [restaurantId, setRestaurantId] = useState("");
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const { syncStatus, pendingCount, syncPendingBills } = useOfflineSync();

  useEffect(() => {
  const session = localStorage.getItem("pos-session");

  if (!session) {
    window.location.href = "/login";
    return;
  } 
  const parsed = JSON.parse(session);

  setStaffId(parsed.staffId);
  setRestaurantId(parsed.restaurantId);
  setSessionLoaded(true);
}, []);

useEffect(() => {
  if (!restaurantId) return;

  const setupDevice = async () => {
    try {
      const localId = getOrCreateDeviceId();

      console.log("Local Device ID:", localId);

      await registerDevice(restaurantId);

      setDeviceId(localId);
    } catch (error) {
      console.error("Device registration failed:", error);
    }
  };

  setupDevice();
}, [restaurantId]);

useEffect(() => {
  if (!restaurantId) return;

  const loadMenu = async () => {
    try {
      const response = await fetch("/api/menu");

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setMenu(data);
      } else {
        console.error("Invalid menu response:", data);
        setMenu([]);
      }
    } catch (error) {
  console.error("Failed to load menu:", error);

  setMenu([]);

  alert(
    "Menu could not be loaded. Connect to the internet once to sync menu items."
  );
}
  };

  loadMenu();
}, [restaurantId]);


  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existingItem = prev.find((cartItem) => cartItem.id === item.id);
      if (existingItem) {
        return prev.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, qty: cartItem.qty + 1 }
            : cartItem
        );
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const updateQty = (id: string, newQty: number) => {
    setCart((prev) =>
      newQty <= 0
        ? prev.filter((item) => item.id !== id)
        : prev.map((item) =>
            item.id === id ? { ...item, qty: newQty } : item
          )
    );
  };

  const total = cart.reduce(
    (sum, item) => sum + Number(item.price) * item.qty,
    0
  );

  const saveBill = async () => {
    if (!staffId || !restaurantId) {
      alert("Session expired. Please login again.");
      return;
    }

    if (!deviceId) {
      <button
  disabled={!deviceId || saving}
>
  Save Bill
</button>
      return;
    }

    if (cart.length === 0) {
      alert("Cart is empty");
      return;
    }

    try {
      setSaving(true);

      const clientBillId = uuidv4();
      const billData = {
        restaurantId: restaurantId,
        deviceId: deviceId,
        staffId: staffId,
        paymentMode: paymentMode,
        items: cart.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          qty: item.qty,
        })),
        clientBillId,
      };

      if (!navigator.onLine) {
        // Save offline
        await saveBillOffline({
          id: clientBillId,
          clientBillId,
          restaurantId: restaurantId,
          deviceId: deviceId,
          staffId: staffId,
          paymentMode: paymentMode,
          items: cart.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            qty: item.qty,
          })),
          createdAt: new Date().toISOString(),
          status: "pending",
        });

        alert("Bill saved offline. Will sync when online.");
        setCart([]);
        return;
      }

      const response = await fetch("/api/bills", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(billData),
      });

      const bill = await response.json();

      if (response.ok) {
        // Mark as synced if it was pending
        try {
          await updateBillStatus(clientBillId, "synced");
        } catch (err) {
          console.error("Error updating bill status:", err);
        }

        alert(`Bill #${bill.billNumber} saved`);
        setCart([]);
      } else {
        // Save as pending offline if sync failed
        await saveBillOffline({
          id: clientBillId,
          clientBillId,
          restaurantId: restaurantId,
          deviceId: deviceId,
          staffId: staffId,
          paymentMode: paymentMode,
          items: cart.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            qty: item.qty,
          })),
          createdAt: new Date().toISOString(),
          status: "pending",
        });

        alert("Failed to save bill online. Saved offline.");
        setCart([]);
      }
    } catch (error) {
      console.error(error);
      // Save offline as fallback
      try {
        const clientBillId = uuidv4();
        await saveBillOffline({
          id: clientBillId,
          clientBillId,
          restaurantId: restaurantId,
          deviceId: deviceId,
          staffId: staffId,
          paymentMode: paymentMode,
          items: cart.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            qty: item.qty,
          })),
          createdAt: new Date().toISOString(),
          status: "pending",
        });

        alert("Error saving bill. Saved offline for later sync.");
        setCart([]);
      } catch (offlineErr) {
        alert("Error saving bill");
      }
    } finally {
      setSaving(false);
    }
  };

  if (!sessionLoaded) {
  return (
    <main className="p-6">
      Loading...
    </main>
  );
}

  return (
    <main className="p-6 max-w-4xl mx-auto">
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
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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
      </nav>

      <h1 className="text-3xl font-bold mb-6">
        Restaurant POS
      </h1>
      

      {/* Sync Status Bar */}
      <div className="mb-6 p-4 rounded-lg border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${
              syncStatus === "online"
                ? "bg-green-500"
                : syncStatus === "offline"
                ? "bg-red-500"
                : "bg-yellow-500"
            }`}
          />
          <span className="font-semibold">
            {syncStatus === "online"
              ? "Online"
              : syncStatus === "offline"
              ? "Offline"
              : "Syncing..."}
          </span>
          {pendingCount > 0 && (
            <span className="text-sm text-gray-600">
              ({pendingCount} pending bill{pendingCount !== 1 ? "s" : ""})
            </span>
          )}
        </div>
        {pendingCount > 0 && syncStatus !== "syncing" && (
          <button
            onClick={syncPendingBills}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Sync Now
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {menu.map((item) => (
          <button
            key={item.id}
            onClick={() => addToCart(item)}
            className="border rounded-lg p-4 text-left hover:bg-gray-100"
          >
            <div className="font-semibold">
              {item.name}
            </div>
            <div>₹{item.price}</div>
          </button>
        ))}
      </div>

      <div className="border rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-4">
          Cart
        </h2>

        {cart.length === 0 ? (
          <p>No items added</p>
        ) : (
          <>
            {cart.map((item) => {
              const lineTotal = Number(item.price) * item.qty;
              return (
                <div
                  key={item.id}
                  className="flex justify-between items-center py-2 border-b"
                >
                  <div className="flex-1">
                    <div className="font-semibold">{item.name}</div>
                    <div className="text-sm text-gray-600">
                      ₹{item.price} × {item.qty} = ₹{lineTotal}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQty(item.id, item.qty - 1)}
                      className="border rounded px-2 py-1 hover:bg-gray-100"
                    >
                      −
                    </button>
                    <span className="w-8 text-center">{item.qty}</span>
                    <button
                      onClick={() => updateQty(item.id, item.qty + 1)}
                      className="border rounded px-2 py-1 hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}

            <div className="border-t mt-4 pt-4 font-bold text-lg">
              Total: ₹{total}
            </div>

            {/* Payment Mode Selector */}
            <div className="mt-6 mb-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Payment Mode
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setPaymentMode("CASH")}
                  className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                    paymentMode === "CASH"
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-800 border border-gray-300 hover:bg-gray-200"
                  }`}
                >
                  💵 Cash
                </button>
                <button
                  onClick={() => setPaymentMode("UPI")}
                  className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                    paymentMode === "UPI"
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-800 border border-gray-300 hover:bg-gray-200"
                  }`}
                >
                  📱 UPI
                </button>
              </div>
            </div>

            <button
              onClick={saveBill}
              disabled={saving}
              className="w-full mt-4 border rounded px-4 py-2 bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Bill"}
            </button>

            
          </>
        )}
      </div>
    </main>
  );
}