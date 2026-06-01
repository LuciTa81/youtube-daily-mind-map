import type { WatchItem } from "@/types/watch";

export interface WatchHistoryRepository {
  load(): Promise<WatchItem[]>;
  save(items: WatchItem[]): Promise<void>;
  clear(): Promise<void>;
}

type StoredWatchHistory = {
  id: "watch-history";
  items: WatchItem[];
  updatedAt: string;
};

const DB_NAME = "youtube-daily-mind-map";
const DB_VERSION = 2;
const STORE_NAME = "watch-history";
const REVIEW_NOTES_STORE_NAME = "review-notes";
const STORE_KEY: StoredWatchHistory["id"] = "watch-history";

function getIndexedDb(): IDBFactory {
  if (typeof indexedDB === "undefined") {
    throw new Error("이 브라우저에서는 로컬 저장소를 사용할 수 없습니다.");
  }

  return indexedDB;
}

export class IndexedDbWatchHistoryRepository implements WatchHistoryRepository {
  private dbPromise?: Promise<IDBDatabase>;

  private open(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const request = getIndexedDb().open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: "id" });
          }
          if (!db.objectStoreNames.contains(REVIEW_NOTES_STORE_NAME)) {
            db.createObjectStore(REVIEW_NOTES_STORE_NAME, { keyPath: "key" });
          }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error("로컬 저장소를 열지 못했습니다."));
      });
    }

    return this.dbPromise;
  }

  async load(): Promise<WatchItem[]> {
    const db = await this.open();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(STORE_KEY);

      request.onsuccess = () => {
        const record = request.result as StoredWatchHistory | undefined;
        resolve(Array.isArray(record?.items) ? record.items : []);
      };
      request.onerror = () => reject(request.error ?? new Error("저장된 기록을 읽지 못했습니다."));
    });
  }

  async save(items: WatchItem[]): Promise<void> {
    const db = await this.open();
    const record: StoredWatchHistory = {
      id: STORE_KEY,
      items,
      updatedAt: new Date().toISOString()
    };

    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(record);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error ?? new Error("기록을 저장하지 못했습니다."));
    });
  }

  async clear(): Promise<void> {
    const db = await this.open();

    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(STORE_KEY);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error ?? new Error("저장된 기록을 삭제하지 못했습니다."));
    });
  }
}

export const indexedDbWatchHistoryRepository = new IndexedDbWatchHistoryRepository();
