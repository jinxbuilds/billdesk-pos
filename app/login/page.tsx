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
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="
  w-full
  max-w-md
  bg-zinc-900
  border
  border-zinc-800
  rounded-3xl
  shadow-2xl
  p-8
">
  {/* Header */}
        <div className="text-center mb-8">
  <div className="text-5xl mb-4">🍽️</div>

  <h1 className="text-3xl font-bold text-white">
    {device.restaurantName}
  </h1>

  <p className="text-zinc-400 mt-2">
    {device.deviceName}
  </p>
</div>

        <form onSubmit={handleSubmit}>

       <div className="text-center mb-6">
  <span className="text-zinc-400 text-sm uppercase tracking-widest">
    Owner Access
  </span>
</div>   

  {/* PIN Dots */}
  <div className="flex justify-center gap-3 mb-8">
  {[0,1,2,3,4,5].map((i) => (
    <div
      key={i}
      className={`
        w-4 h-4 rounded-full
        ${
          i < pin.length
            ? "bg-green-500"
            : "bg-zinc-700"
        }
      `}
    />
  ))}
</div>

  {/* Hidden Input */}
  <input
    type="password"
    value={pin}
    onChange={(e) => setPin(e.target.value)}
    className="hidden"
  />

  {/* Error */}
  {error && (
    <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-center">
      {error}
    </div>
  )}

  {/* Number Pad */}
  <div className="grid grid-cols-3 gap-3">
    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
      <button
        key={n}
        type="button"
        onClick={() => {
          if (pin.length < 6) {
            setPin((prev) => prev + n);
          }
        }}
        className="
  h-20
  rounded-2xl
  bg-zinc-800
  hover:bg-zinc-700
  active:scale-95
  text-3xl
  font-bold
  text-white
  transition
"
      >
        {n}
      </button>
    ))}

    {/* Backspace */}
    <button
      type="button"
      onClick={() => setPin((prev) => prev.slice(0, -1))}
      className="
        h-20
  rounded-2xl
  bg-red-600
  hover:bg-red-700
  text-white
  text-xl
  font-bold
      "
    >
      ⌫
    </button>

    {/* Zero */}
    <button
      type="button"
      onClick={() => {
        if (pin.length < 6) {
          setPin((prev) => prev + "0");
        }
      }}
      className="
        h-20
  rounded-2xl
  bg-zinc-800
  hover:bg-zinc-700
  active:scale-95
  text-3xl
  font-bold
  text-white
  transition
      "
    >
      0
    </button>

    {/* Login */}
    <button
      type="submit"
      disabled={loading || pin.length < 4}
      className="
        h-20
        rounded-2xl
        bg-green-600
        hover:bg-green-700
        text-white
        text-xl
        font-bold
        transition
        disabled:opacity-50
        disabled:cursor-not-allowed
        "
    >
      {loading ? "..." : "→"}
    </button>
  </div>

  <div className="mt-6 text-center text-sm text-slate-500">
    Enter Owner PIN
  </div>
</form>
      </div>
    </div>
  );
}
