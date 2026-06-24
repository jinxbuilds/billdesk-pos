"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { v4 as uuidv4 } from "uuid";
import { registerDevice } from "@/lib/device";
import { getOrCreateDeviceId } from "@/lib/device";
import { useOfflineSync } from "@/lib/offline";
import { saveBillOffline, updateBillStatus } from "@/lib/indexeddb";
import {AuthGuard} from "@/components/AuthGuard";
import { navButtonClass } from "@/lib/ui";
import PageHeader from "../components/PageHeader";
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
    <main
  className="
    min-h-screen
    bg-gray-950
    text-white
    p-6
    pb-32
    max-w-5xl
    mx-auto
  "
>
      <PageHeader
  title="Hotel MH 11"
  subtitle="Create bills and manage orders"
/>
      {/* Navigation */}
      <nav className="mb-8 flex gap-4 justify-center flex-wrap">
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
            className="
              px-4
              py-2
              bg-emerald-600
              hover:bg-emerald-700
              rounded-xl
              text-sm
              font-medium
              transition
              "
          >
            Sync Now
          </button>
        )}
      </div>

      <>

{favorites.length > 0 && (
  <section className="mb-10">
    <div className="flex items-center justify-between mb-6">
  <div>
    <h2 className="text-xl font-bold text-white mb-1">
      Quick Items
    </h2>

    <p className="text-sm text-gray-400">
      Most frequently ordered items
    </p>
  </div>

  <div
    className="
      px-3
      py-1
      rounded-full
      bg-amber-500/10
      border
      border-amber-500/20
      shrink-0
    "
  >
    <span className="text-xs font-medium text-amber-400">
      Favorites
    </span>
  </div>
</div>

    <div className="flex gap-4 overflow-x-auto pt-2 pb-3 scrollbar-hide">
      {favorites.map((item) => (
        <button
  key={item.id}
  onClick={() => addToCart(item)}
  className="
    min-w-[170px]
    text-left
    rounded-3xl
    border
    border-amber-500/20
    bg-gradient-to-br
    from-gray-900
    to-gray-950
    p-5
    shadow-lg
    hover:border-amber-500/60
    hover:-translate-y-1
    transition-all
    duration-200
  "
>
  <div className="font-semibold text-white text-lg mb-3 truncate">
    {item.name}
  </div>

  <div className="text-2xl font-bold text-amber-400">
    ₹{item.price}
  </div>
</button>
      ))}
    </div>
  </section>
)}


  <div className="space-y-8">
  {Object.entries(groupedItems).map(
    ([category, items]) => (
      <div key={category}>
        <h2
  className="
    sticky
    top-0
    z-10
    bg-gray-950/90
    backdrop-blur
    py-3
    mb-3
    text-lg
    font-semibold
    text-amber-400
  "
>
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
bg-gray-900
border
border-gray-800
rounded-2xl
p-4
hover:border-emerald-500
transition
"
            >
              <div>
                <p className="font-medium text-white">
                  {item.name}
                </p>

                <p className="text-gray-400">
                  ₹{item.price}
                </p>
              </div>

              <button
                onClick={() => addToCart(item)}
                className="
bg-emerald-600
hover:bg-emerald-700
text-white
px-5
py-2
rounded-xl
font-medium
transition
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
bottom-4
left-4
right-4
max-w-5xl
mx-auto
bg-gray-900
border
border-gray-800
rounded-2xl
px-5
py-4
flex
justify-between
items-center
shadow-2xl
z-40
"
  >
    <div>
      <div className="font-semibold">
        {cartItemsCount} Items
      </div>

      <div className="text-xl font-bold text-emerald-400">
        ₹{total}
      </div>
    </div>

    <button
      onClick={() => setCartOpen(true)}
      className="
bg-emerald-600
hover:bg-emerald-700
px-5
py-3
rounded-xl
font-semibold
transition
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
    bg-gray-950
    border-t
    border-gray-800
    rounded-t-[28px]
    p-5
    max-h-[85vh]
    overflow-y-auto
    animate-in
    slide-in-from-bottom
    shadow-2xl
  "
      onClick={(e) => e.stopPropagation()}
    >
      {/* Drag Handle */}
    <div className="flex justify-center mb-4">
      <div className="w-12 h-1.5 rounded-full bg-gray-700" />
    </div>

      <div className="flex justify-between items-center mb-5">
  <div>
    <h2 className="text-2xl font-bold text-white">
      Current Order
    </h2>

    <p className="text-sm text-gray-400">
      {cartItemsCount} items
    </p>
  </div>

         <button
    onClick={() => setCartOpen(false)}
    className="
      w-10
      h-10
      rounded-xl
      bg-gray-900
      border
      border-gray-800
      flex
      items-center
      justify-center
      text-gray-300
    "
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
                bg-gray-900
                border
                border-gray-800
                rounded-2xl
                p-4
                mb-3
                flex
                justify-between
                items-center
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

              <span className="font-semibold min-w-[24px] text-center">
  {item.qty}
</span>

              <button
                onClick={() =>
                  updateQty(
                    item.id,
                    item.qty + 1
                  )
                }
                className="
w-8
h-8
rounded-lg
bg-emerald-600
hover:bg-emerald-700
text-white
"
              >
                +
              </button>
            </div>
          </div>
        );
      })}

      {/* Sticky Checkout Section */}
<div
  className="
    sticky
    bottom-0
    bg-gray-950
    pt-4
    pb-2
    mt-6
    border-t
    border-gray-800
  "
>
  {/* Order Summary */}
  <div
    className="
      bg-gray-900
      border
      border-gray-800
      rounded-2xl
      p-4
      mb-5
    "
  >
    <div className="flex justify-between mb-2">
      <span className="text-gray-400">
        Items
      </span>

      <span className="font-medium text-white">
        {cartItemsCount}
      </span>
    </div>

    <div className="flex justify-between items-center">
      <span className="text-gray-400">
        Total
      </span>

      <span className="text-2xl font-bold text-emerald-400">
        ₹{total}
      </span>
    </div>
  </div>

  {/* Payment Mode */}
  <div className="mb-5">
    <p className="text-sm font-semibold text-gray-300 mb-3">
      Payment Method
    </p>

    <div className="grid grid-cols-2 gap-3">
      <button
        onClick={() => setPaymentMode("CASH")}
        className={`
          rounded-2xl
          p-4
          border
          transition
          ${
            paymentMode === "CASH"
              ? "bg-emerald-600 border-emerald-500 text-white"
              : "bg-gray-900 border-gray-800 text-gray-300"
          }
        `}
      >

        <div className="font-medium">
          Cash
        </div>
      </button>

      <button
        onClick={() => setPaymentMode("UPI")}
        className={`
          rounded-2xl
          p-4
          border
          transition
          ${
            paymentMode === "UPI"
              ? "bg-emerald-600 border-emerald-500 text-white"
              : "bg-gray-900 border-gray-800 text-gray-300"
          }
        `}
      >
      
        <div className="font-medium">
          UPI
        </div>
      </button>
    </div>
  </div>

  {/* Save Bill */}
  <button
    onClick={saveBill}
    disabled={saving}
    className="
      w-full
      bg-emerald-600
      hover:bg-emerald-700
      text-white
      p-5
      rounded-2xl
      font-bold
      text-lg
      shadow-lg
      transition
      disabled:opacity-50
      disabled:cursor-not-allowed
    "
  >
    {saving ? "Saving Bill..." : `Save Bill • ₹${total}`}
  </button>
</div>
    </div>
  </div>
)}
    </main>
  );
}