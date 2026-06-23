import { useEffect, useState, useCallback } from "react";
import {
  getPendingBills,
  updateBillStatus,
  deleteBillOffline,
} from "./indexeddb";

export type SyncStatus = "online" | "offline" | "syncing";

/**
 * Hook to manage offline sync and connection status
 */
export function useOfflineSync() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("online");
  const [pendingCount, setPendingCount] = useState(0);

  // Check initial online status
  useEffect(() => {
    setSyncStatus(navigator.onLine ? "online" : "offline");
    updatePendingCount();
  }, []);

  // Listen to online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus("online");
      syncPendingBills();
    };

    const handleOffline = () => {
      setSyncStatus("offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const updatePendingCount = useCallback(async () => {
    try {
      const pending = await getPendingBills();
      setPendingCount(pending.length);
    } catch (err) {
      console.error("Error getting pending bills:", err);
    }
  }, []);

  const syncPendingBills = useCallback(async () => {
    if (syncStatus === "syncing") return;

    setSyncStatus("syncing");

    try {
      const pending = await getPendingBills();

      for (const bill of pending) {
        try {
          const response = await fetch("/api/bills", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              restaurantId: bill.restaurantId,
              deviceId: bill.deviceId,
              staffId: bill.staffId,
              paymentMode: bill.paymentMode,
              items: bill.items,
              clientBillId: bill.clientBillId,
            }),
          });

          if (response.ok) {
            await updateBillStatus(bill.clientBillId, "synced");
          } else {
            await updateBillStatus(bill.clientBillId, "failed");
          }
        } catch (err) {
          console.error("Error syncing bill:", err);
          await updateBillStatus(bill.clientBillId, "failed");
        }
      }

      await updatePendingCount();
      setSyncStatus("online");
    } catch (err) {
      console.error("Error syncing pending bills:", err);
      setSyncStatus("offline");
    }
  }, [syncStatus, updatePendingCount]);

  return {
    syncStatus,
    pendingCount,
    syncPendingBills,
    updatePendingCount,
  };
}
