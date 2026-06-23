/**
 * IndexedDB utilities for offline bill storage
 */

export interface OfflineBill {
  id: string;
  clientBillId: string;
  restaurantId: string;
  deviceId: string;
  staffId: string;
  paymentMode: string;
  items: Array<{
    id: string;
    name: string;
    price: string;
    qty: number;
  }>;
  createdAt: string;
  status: "pending" | "synced" | "failed";
  syncedAt?: string;
}

const DB_NAME = "POS_OFFLINE_DB";
const STORE_NAME = "pending_bills";
const DB_VERSION = 1;

let db: IDBDatabase | null = null;

/**
 * Initialize IndexedDB
 */
export async function initDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, {
          keyPath: "clientBillId",
        });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };
  });
}

/**
 * Save a bill to IndexedDB
 */
export async function saveBillOffline(bill: OfflineBill): Promise<void> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(bill);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Get all pending bills
 */
export async function getPendingBills(): Promise<OfflineBill[]> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index("status");
    const request = index.getAll("pending");

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

/**
 * Update bill status
 */
export async function updateBillStatus(
  clientBillId: string,
  status: "pending" | "synced" | "failed"
): Promise<void> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const getRequest = store.get(clientBillId);

    getRequest.onerror = () => reject(getRequest.error);
    getRequest.onsuccess = () => {
      const bill = getRequest.result;
      if (bill) {
        bill.status = status;
        bill.syncedAt = new Date().toISOString();
        const putRequest = store.put(bill);
        putRequest.onerror = () => reject(putRequest.error);
        putRequest.onsuccess = () => resolve();
      } else {
        resolve();
      }
    };
  });
}

/**
 * Get a specific bill by clientBillId
 */
export async function getBillByClientId(
  clientBillId: string
): Promise<OfflineBill | undefined> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(clientBillId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

/**
 * Delete a bill from IndexedDB
 */
export async function deleteBillOffline(clientBillId: string): Promise<void> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(clientBillId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Clear all bills from IndexedDB
 */
export async function clearAllBills(): Promise<void> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}
