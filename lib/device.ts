import { v4 as uuidv4 } from "uuid";

const DEVICE_ID_KEY = "pos_device_id";
const DEVICE_NAME_KEY = "pos_device_name";

/**
 * Generate or retrieve device ID from localStorage
 * On first call, generates a new UUID and stores it
 */
export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") {
    // Running on server, return empty string
    return "";
  }

  let deviceId = localStorage.getItem(DEVICE_ID_KEY);

  if (!deviceId) {
    deviceId = uuidv4();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }

  return deviceId;
}

/**
 * Get device name from localStorage or generate default
 */
export function getOrCreateDeviceName(): string {
  if (typeof window === "undefined") {
    return "";
  }

  let deviceName = localStorage.getItem(DEVICE_NAME_KEY);

  if (!deviceName) {
    // Generate a device name based on browser/OS info
    const userAgent = navigator.userAgent;
    let browser = "Unknown Device";

    if (userAgent.includes("Chrome")) {
      browser = "Chrome POS";
    } else if (userAgent.includes("Safari")) {
      browser = "Safari POS";
    } else if (userAgent.includes("Firefox")) {
      browser = "Firefox POS";
    }

    deviceName = browser;
    localStorage.setItem(DEVICE_NAME_KEY, deviceName);
  }

  return deviceName;
}

/**
 * Register device with backend
 * Creates a device record if it doesn't exist
 */
export async function registerDevice(
  restaurantId: string
): Promise<string> {
  const deviceId = getOrCreateDeviceId();
  const deviceName = getOrCreateDeviceName();

  try {
    const response = await fetch("/api/devices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        deviceId,
        deviceName,
        restaurantId,
      }),
    });

    if (!response.ok) {
      console.error("Failed to register device");
    }

    return deviceId;
  } catch (error) {
    console.error("Device registration error:", error);
    return deviceId;
  }
}
