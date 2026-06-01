export type ReviewNote = {
  key: string;
  text: string;
  updatedAt: string;
};

export interface ReviewNoteRepository {
  load(key: string): Promise<ReviewNote | undefined>;
  save(note: ReviewNote): Promise<void>;
  delete(key: string): Promise<void>;
}

const DB_NAME = "youtube-daily-mind-map";
const DB_VERSION = 2;
const STORE_NAME = "review-notes";

function getIndexedDb(): IDBFactory {
  if (typeof indexedDB === "undefined") {
    throw new Error("이 브라우저에서는 회고 메모를 저장할 수 없습니다.");
  }

  return indexedDB;
}

export class IndexedDbReviewNoteRepository implements ReviewNoteRepository {
  private dbPromise?: Promise<IDBDatabase>;

  private open(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const request = getIndexedDb().open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains("watch-history")) {
            db.createObjectStore("watch-history", { keyPath: "id" });
          }
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: "key" });
          }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error("회고 메모 저장소를 열지 못했습니다."));
      });
    }

    return this.dbPromise;
  }

  async load(key: string): Promise<ReviewNote | undefined> {
    const db = await this.open();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result as ReviewNote | undefined);
      request.onerror = () => reject(request.error ?? new Error("회고 메모를 읽지 못했습니다."));
    });
  }

  async save(note: ReviewNote): Promise<void> {
    const db = await this.open();

    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(note);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error ?? new Error("회고 메모를 저장하지 못했습니다."));
    });
  }

  async delete(key: string): Promise<void> {
    const db = await this.open();

    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error ?? new Error("회고 메모를 삭제하지 못했습니다."));
    });
  }
}

export const indexedDbReviewNoteRepository = new IndexedDbReviewNoteRepository();
