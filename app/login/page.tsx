"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type DeviceInfo = {
  deviceId: string;
  restaurantId: string;
  restaurantName: string;
  deviceName: string;
};

export default function LoginPage() {
  const router = useRouter();

  const [device, setDevice] = useState<DeviceInfo | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedDevice = localStorage.getItem("pos_device");

    if (!savedDevice) {
      router.push("/setup");
      return;
    }

    try {
      const parsed = JSON.parse(savedDevice);
      setDevice(parsed);
    } catch {
      localStorage.removeItem("pos_device");
      router.push("/setup");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!device) return;

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deviceId: device.deviceId,
          pin,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      localStorage.setItem(
  "pos-session",
  JSON.stringify({
    staffId: data.staffId,
    restaurantId: data.restaurantId,
  })
);

      router.push("/pos");
    } catch (err) {
      console.error(err);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!device) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-gray-800">
          {device.restaurantName}
        </h1>

        <p className="text-center text-gray-500 mb-6">
          {device.deviceName}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label
              htmlFor="pin"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Owner PIN
            </label>

            <input
              type="password"
              id="pin"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter PIN"
              required
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded-lg transition"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
