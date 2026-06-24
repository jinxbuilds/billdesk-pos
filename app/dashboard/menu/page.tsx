"use client";

import { useEffect, useState } from "react";

type MenuItem = {
  id: string;
  name: string;
  price: number;
  category: string;
  active: boolean;
  favorite: boolean;
};

export default function MenuManagementPage() {
  const [menu, setMenu] = useState<MenuItem[]>([]);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadMenu();
  }, []);

  async function loadMenu() {
    try {
      const res = await fetch("/api/menu");
      const data = await res.json();
      setMenu(data);
    } catch (error) {
      console.error(error);
    }
  }

  async function addMenuItem() {
  const session = localStorage.getItem("pos-session");

  if (!session) {
    alert("POS session not found");
    return;
  }

  const { restaurantId } = JSON.parse(session);

  const res = await fetch("/api/menu", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      restaurantId,
      name,
      price: Number(price),
      category,
    }),
  });

    if (res.ok) {
      setName("");
      setPrice("");
      setCategory("");
      loadMenu();
    } else {
      const error = await res.json();
      alert(error.error);
    }
  }
  const toggleFavorite = async (id: string) => {
  try {
    const res = await fetch(
      `/api/menu/${id}/favorite`,
      {
        method: "PATCH",
      }
    );

    if (!res.ok) {
  const error = await res.json();
  console.error(error);
  throw new Error(error.error || "Failed");
}

    setMenu((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              favorite: !item.favorite,
            }
          : item
      )
    );
  } catch (error) {
    console.error(error);
  }
};

  async function updateItem() {
    if (!editingId) return;

    const res = await fetch(`/api/menu/${editingId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        price: Number(price),
        category,
      }),
    });

    if (res.ok) {
      setEditingId(null);
      setName("");
      setPrice("");
      setCategory("");
      loadMenu();
    }
  }

  async function toggleItem(item: MenuItem) {
    await fetch(`/api/menu/${item.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        active: !item.active,
      }),
    });

    loadMenu();
  }

  function startEdit(item: MenuItem) {
    setEditingId(item.id);
    setName(item.name);
    setPrice(item.price.toString());
    setCategory(item.category);
  }


return (
  <main className="max-w-5xl mx-auto p-4">
    <h1 className="text-3xl font-bold mb-2 text-white">
      Menu Management
    </h1>

    <p className="text-slate-400 mb-8">
      Add, edit and manage menu items
    </p>

    {/* Add / Edit Form */}

    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-8 shadow-lg">
      <h2 className="text-xl font-semibold text-white mb-5">
        {editingId ? "Edit Item" : "Add Item"}
      </h2>

      <div className="grid gap-4">
        <input
          className="
            bg-slate-800
            border
            border-slate-700
            rounded-xl
            px-4
            py-3
            text-white
            placeholder:text-slate-500
          "
          placeholder="Item Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="
            bg-slate-800
            border
            border-slate-700
            rounded-xl
            px-4
            py-3
            text-white
            placeholder:text-slate-500
          "
          placeholder="Price"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />

        <input
          className="
            bg-slate-800
            border
            border-slate-700
            rounded-xl
            px-4
            py-3
            text-white
            placeholder:text-slate-500
          "
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />

        {editingId ? (
          <button
            onClick={updateItem}
            className="
              bg-cyan-600
              hover:bg-cyan-700
              text-white
              rounded-xl
              py-3
              font-medium
              transition
            "
          >
            Update Item
          </button>
        ) : (
          <button
            onClick={addMenuItem}
            className="
              bg-orange-500
              hover:bg-orange-600
              text-white
              rounded-xl
              py-3
              font-medium
              transition
            "
          >
            Add Item
          </button>
        )}
      </div>
    </div>

    {/* Menu Items */}

    <div className="space-y-4">
      {menu.map((item) => (
        <div
          key={item.id}
          className="
            bg-slate-900
            border
            border-slate-800
            rounded-2xl
            p-5
            flex
            justify-between
            items-center
            hover:border-slate-700
            transition
          "
        >
          <div>
            <h3 className="font-semibold text-white text-lg">
              {item.name}
            </h3>

            <p className="text-emerald-400 font-medium mt-1">
              ₹{item.price}
            </p>

            <p className="text-slate-400 text-sm">
              {item.category}
            </p>

            {!item.active && (
              <span className="
                inline-block
                mt-2
                px-2
                py-1
                rounded-full
                bg-red-500/20
                text-red-400
                text-xs
              ">
                Disabled
              </span>
            )}
          </div>

          <div className="flex gap-2 items-center">
            <button
              onClick={() => toggleFavorite(item.id)}
              className="
                h-10
                w-10
                rounded-xl
                bg-slate-800
                hover:bg-slate-700
                text-xl
              "
            >
              {item.favorite ? "⭐" : "☆"}
            </button>

            <button
              onClick={() => startEdit(item)}
              className="
                px-4
                py-2
                rounded-xl
                bg-slate-800
                text-white
                hover:bg-slate-700
              "
            >
              Edit
            </button>

            <button
              onClick={() => toggleItem(item)}
              className="
                px-4
                py-2
                rounded-xl
                bg-orange-500
                hover:bg-orange-600
                text-white
              "
            >
              {item.active ? "Disable" : "Enable"}
            </button>
          </div>
        </div>
      ))}
    </div>
  </main>
);
}