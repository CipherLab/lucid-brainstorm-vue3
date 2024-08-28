export interface StorageService<T extends StoreName> {
  save(key: string, data: any): Promise<void>;
  load(key: string): Promise<any | null>;
  delete(key: string): Promise<void>;
}
// Enum to hold store names
export enum StoreName {
  flowStore = 'flowStore',
  githubTree = 'githubTree',
}
