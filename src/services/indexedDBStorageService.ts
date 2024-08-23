// IndexedDBStorageService.ts
import { StorageService } from './StorageService';

export class IndexedDBStorageService implements StorageService {
  private dbName: string;
  private storeName: string;
  private db: IDBDatabase | null = null; // Add a reference to the database

  constructor(dbName = 'lucidFlowDB', storeName = 'flowStore') {
    this.dbName = dbName;
    this.storeName = storeName;
  }
  private async openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        resolve(this.db);
        return;
      }

      const request = indexedDB.open(this.dbName, 1); // Start with version 1

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          // Check if store exists
          db.createObjectStore(this.storeName, { keyPath: 'key' });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        reject((event.target as IDBRequest).error);
      };
    });
  }
  async save(key: string, data: any): Promise<void> {
    const db = await this.openDatabase(); // Open the database
    const transaction = db.transaction(this.storeName, 'readwrite');
    const store = transaction.objectStore(this.storeName);
    store.put({ key, data });

    return new Promise((resolve, reject) => {
      // Use a promise for transaction completion
      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = (event) => {
        reject((event.target as IDBRequest).error);
      };
    });
  }

  async load(key: string): Promise<any> {
    const db = await this.openDatabase(); // Open the database
    const transaction = db.transaction(this.storeName, 'readonly');
    const store = transaction.objectStore(this.storeName);
    const getRequest = store.get(key);

    return new Promise((resolve, reject) => {
      // Use a promise for get request
      getRequest.onsuccess = () => {
        resolve(getRequest.result ? getRequest.result.data : null);
      };

      getRequest.onerror = (event) => {
        reject((event.target as IDBRequest).error);
      };
    });
  }
}
