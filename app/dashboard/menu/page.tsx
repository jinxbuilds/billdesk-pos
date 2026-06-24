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
    <main className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">
        Menu Management
      </h1>

      <div className="border rounded-lg p-4 mb-6 bg-white">
        <h2 className="font-semibold mb-4">
          {editingId ? "Edit Item" : "Add Item"}
        </h2>

        <div className="grid gap-3">
          <input
            className="border rounded p-2"
            placeholder="Item Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            className="border rounded p-2"
            placeholder="Price"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />

          <input
            className="border rounded p-2"
            placeholder="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />

          {editingId ? (
            <button
              onClick={updateItem}
              className="bg-blue-600 text-white rounded p-2"
            >
              Update Item
            </button>
          ) : (
            <button
              onClick={addMenuItem}
              className="bg-green-600 text-white rounded p-2"
            >
              Add Item
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {menu.map((item) => (
          <div
            key={item.id}
            className="border rounded-lg p-4 flex justify-between items-center"
          >
            <div>
              <h3 className="font-semibold">
                {item.name}
              </h3>

              <p className="text-sm text-gray-500">
                ₹{item.price}
              </p>

              <p className="text-xs text-gray-400">
                {item.category}
              </p>

              {!item.active && (
                <span className="text-red-500 text-xs">
                  Disabled
                </span>
              )}
            </div>

            <div className="flex gap-2 items-center">
  <button
    onClick={() => toggleFavorite(item.id)}
    className="text-xl"
  >
    {item.favorite ? "⭐" : "☆"}
  </button>

  <button
    onClick={() => startEdit(item)}
    className="px-3 py-1 border rounded"
  >
    Edit
  </button>

  <button
    onClick={() => toggleItem(item)}
    className="px-3 py-1 border rounded"
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