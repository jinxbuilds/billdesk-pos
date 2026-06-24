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
  favorite: boolean;
  category: string;
};

type CartItem = {
  id: string;
  name: string;
  price: string;
  favorite: boolean;
  qty: number;
};


export default function PosPage() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deviceId, setDeviceId] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<"CASH" | "UPI">("UPI");
  const [staffId, setStaffId] = useState("");
  const [restaurantId, setRestaurantId] = useState("");
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const {syncStatus, pendingCount, syncPendingBills } = useOfflineSync();
  const [selectedCategory] = useState("All");
  
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
  const cartItemsCount = cart.reduce(
  (sum, item) => sum + item.qty,
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
  const favorites = menu
  .filter((item) => item.favorite)
  .slice(0, 6);

  const categories = [
  "All",
  ...new Set(menu.map((item) => item.category)),
];

const filteredItems =
  selectedCategory === "All"
    ? menu
    : menu.filter(
        (item) =>
          item.category === selectedCategory
      );

const groupedItems = filteredItems.reduce(
  (acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }

    acc[item.category].push(item);

    return acc;
  },
  {} as Record<string, typeof filteredItems>
);

  if (!sessionLoaded) {
  return (
    <main className="p-6">
      Loading...
    </main>
  );
}


  return (
    <main className="p-6 pb-28 max-w-4xl mx-auto">
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

      <>
  {favorites.length > 0 && (
    <div className="mb-6">
  <h2 className="text-lg font-bold mb-3">
    ⭐ Quick Items
  </h2>

      <div className="flex gap-3 overflow-x-auto pb-2">
  {favorites.map((item) => (
    <button
      key={item.id}
      onClick={() => addToCart(item)}
      className="
        min-w-[120px]
        rounded-xl
        border-2
        border-blue-200
        bg-white
        p-3
        shadow-sm
        text-left
      "
    >
      <div className="font-semibold text-gray-900">
        {item.name}
      </div>

      <div className="text-lg font-bold text-blue-600">
        ₹{item.price}
      </div>
    </button>
  ))}
</div>
    </div>
  )}

  <div className="space-y-8">
  {Object.entries(groupedItems).map(
    ([category, items]) => (
      <div key={category}>
        <h2 className="text-xl font-bold mb-4 sticky top-0 bg-white py-2">
          {category}
        </h2>

        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="
                flex
                justify-between
                items-center
                bg-white
                border
                rounded-xl
                p-4
                shadow-sm
              "
            >
              <div>
                <p className="font-medium">
                  {item.name}
                </p>

                <p className="text-gray-500">
                  ₹{item.price}
                </p>
              </div>

              <button
                onClick={() => addToCart(item)}
                className="
                  bg-green-600
                  text-white
                  px-4
                  py-2
                  rounded-lg
                "
              >
                Add
              </button>
            </div>
          ))}
        </div>
      </div>
    )
  )}
</div>
</>

      {/* Bottom Cart Bar */}
{cart.length > 0 && (
  <div
    className="
      fixed
      bottom-0
      left-0
      right-0
      bg-black
      text-white
      p-4
      flex
      justify-between
      items-center
      z-40
    "
  >
    <div>
      <div className="font-semibold">
        {cartItemsCount} Items
      </div>

      <div className="text-sm opacity-80">
        ₹{total}
      </div>
    </div>

    <button
      onClick={() => setCartOpen(true)}
      className="
        bg-green-600
        hover:bg-green-700
        px-4
        py-2
        rounded-lg
        font-semibold
      "
    >
      View Cart
    </button>
  </div>
)}

{/* Cart Drawer */}
{cartOpen && (
  <div
    className="fixed inset-0 bg-black/40 z-50"
    onClick={() => setCartOpen(false)}
  >
    <div
      className="
        absolute
        bottom-0
        left-0
        right-0
        bg-white
        rounded-t-3xl
        p-5
        max-h-[75vh]
        overflow-y-auto
        animate-in
        slide-in-from-bottom
      "
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          Cart
        </h2>

        <button
          onClick={() => setCartOpen(false)}
          className="text-xl"
        >
          ✕
        </button>
      </div>

      {cart.map((item) => {
        const lineTotal =
          Number(item.price) * item.qty;

        return (
          <div
            key={item.id}
            className="
              flex
              justify-between
              items-center
              py-3
              border-b
            "
          >
            <div>
              <div className="font-semibold">
                {item.name}
              </div>

              <div className="text-sm text-gray-500">
                ₹{item.price} × {item.qty}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  updateQty(
                    item.id,
                    item.qty - 1
                  )
                }
                className="border px-2 rounded"
              >
                −
              </button>

              <span>{item.qty}</span>

              <button
                onClick={() =>
                  updateQty(
                    item.id,
                    item.qty + 1
                  )
                }
                className="border px-2 rounded"
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

      {/* Payment Mode */}
      <div className="mt-6 mb-4">
        <p className="text-sm font-semibold mb-2">
          Payment Mode
        </p>

        <div className="flex gap-3">
          <button
            onClick={() =>
              setPaymentMode("CASH")
            }
            className={`flex-1 py-3 rounded-lg ${
              paymentMode === "CASH"
                ? "bg-blue-600 text-white"
                : "bg-gray-100"
            }`}
          >
            💵 Cash
          </button>

          <button
            onClick={() =>
              setPaymentMode("UPI")
            }
            className={`flex-1 py-3 rounded-lg ${
              paymentMode === "UPI"
                ? "bg-blue-600 text-white"
                : "bg-gray-100"
            }`}
          >
            📱 UPI
          </button>
        </div>
      </div>

      <button
        onClick={saveBill}
        disabled={saving}
        className="
          w-full
          mt-4
          bg-green-600
          text-white
          p-4
          rounded-xl
          font-semibold
        "
      >
        {saving ? "Saving..." : "Save Bill"}
      </button>
    </div>
  </div>
)}
    </main>
  );
}