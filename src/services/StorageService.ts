export interface StorageService {
  save(key: string, data: any): Promise<void>;
  load(key: string): Promise<any>;
}
