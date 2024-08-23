import { StorageService } from './StorageService';
import * as fs from 'fs'; // Or your preferred filesystem library

export class FileSystemStorageService implements StorageService {
  private storagePath: string;

  constructor(storagePath: string) {
    this.storagePath = storagePath;
  }

  async save(key: string, data: any): Promise<void> {
    const filePath = `${this.storagePath}/${key}.json`;
    const jsonData = JSON.stringify(data);
    await fs.promises.writeFile(filePath, jsonData);
  }

  async load(key: string): Promise<any> {
    const filePath = `${this.storagePath}/${key}.json`;
    try {
      const jsonData = await fs.promises.readFile(filePath, 'utf-8');
      return JSON.parse(jsonData);
    } catch (error) {
      // Handle file not found or other errors
      return null;
    }
  }
}
