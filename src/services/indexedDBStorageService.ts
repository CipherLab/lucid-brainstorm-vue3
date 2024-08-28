// IndexedDBStorageService.ts
import { StorageService, StoreName } from './StorageService';

export class IndexedDBStorageService<T extends StoreName>
  implements StorageService<T>
{
  private dbName: string;
  private storeName: T; // Store the store name as a property
  private db: IDBDatabase | null = null;

  constructor(dbName: string, storeName: T) {
    // Pass the store name in the constructor
    this.dbName = dbName;
    this.storeName = storeName;
  }
  private async openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        resolve(this.db);
        return;
      }

      //console.log('Opening database...');

      const totalStores = Object.keys(StoreName).length + 2;
      const request = indexedDB.open(this.dbName, totalStores); // Increment version if adding a new object store

      request.onupgradeneeded = (event) => {
        //console.log('Upgrading database...');
        const db = (event.target as IDBOpenDBRequest).result;

        for (const key of Object.keys(StoreName)) {
          this.createStore(db, StoreName.flowStore);
          this.createStore(db, StoreName.githubTree);
        }

        // Create object stores if they don't exist

        // Add more object stores here if needed...
      };

      request.onsuccess = (event) => {
        //console.log('Database opened successfully.');
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error(
          'Error opening database:',
          (event.target as IDBRequest).error
        );
        reject((event.target as IDBRequest).error);
      };
    });
  }

  private createStore(db: IDBDatabase, storeName: StoreName) {
    if (!db.objectStoreNames.contains(storeName)) {
      db.createObjectStore(storeName, { keyPath: 'key' });
      //console.log(`Object store created: ${storeName}`);
    }
  }

  async save(key: string, data: any): Promise<void> {
    const db = await this.openDatabase();
    const transaction = db.transaction(this.storeName, 'readwrite'); // Use this.storeName
    const store = transaction.objectStore(this.storeName);
    store.put({ key, data });

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = (event) => {
        reject((event.target as IDBRequest).error);
      };
    });
  }

  async load(key: string): Promise<any> {
    const db = await this.openDatabase();
    const transaction = db.transaction(this.storeName, 'readonly'); // Use this.storeName
    const store = transaction.objectStore(this.storeName);
    const getRequest = store.get(key);

    return new Promise((resolve, reject) => {
      getRequest.onsuccess = () => {
        resolve(getRequest.result ? getRequest.result.data : null);
      };

      getRequest.onerror = (event) => {
        reject((event.target as IDBRequest).error);
      };
    });
  }
}
