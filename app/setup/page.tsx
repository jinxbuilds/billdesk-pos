"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SetupPage() {
  const router = useRouter();

  const [restaurantId, setRestaurantId] = useState("");
  const [pin, setPin] = useState("");
  const [deviceName, setDeviceName] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function registerDevice() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/register-device", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          restaurantId,
          pin,
          deviceName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      localStorage.setItem(
        "pos_device",
        JSON.stringify({
          deviceId: data.deviceId,
          restaurantId: data.restaurantId,
          restaurantName: data.restaurantName,
          deviceName: data.deviceName,
        })
      );

      router.push("/login");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        Register Device
      </h1>

      <div className="space-y-4">
        <input
          className="w-full border p-3 rounded"
          placeholder="Restaurant ID"
          value={restaurantId}
          onChange={(e) => setRestaurantId(e.target.value)}
        />

        <input
          className="w-full border p-3 rounded"
          type="password"
          placeholder="Owner PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
        />

        <input
          className="w-full border p-3 rounded"
          placeholder="Device Name (Counter 1)"
          value={deviceName}
          onChange={(e) => setDeviceName(e.target.value)}
        />

        {error && (
          <p className="text-red-500">{error}</p>
        )}

        <button
          onClick={registerDevice}
          disabled={loading}
          className="w-full bg-black text-white p-3 rounded"
        >
          {loading ? "Registering..." : "Register Device"}
        </button>
      </div>
    </main>
  );
}