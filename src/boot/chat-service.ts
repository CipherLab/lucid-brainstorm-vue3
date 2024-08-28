import MockChatService from '../services/mockChatService';
import { boot } from 'quasar/wrappers';
import RealChatService from '../services/realChatService'; // Make sure this path is correct
import useLucidFlow from '../composables/useLucidFlow';
import { ChatService } from '../models/chatInterfaces';
import { StoreName } from '../services/StorageService';
import { IndexedDBStorageService } from '../services/indexedDBStorageService';

export default boot(({ app }) => {
  for (const storeName in StoreName) {
    // Filter out numeric values from the enum
    const service = new IndexedDBStorageService(
      'lucidFlowDB',
      StoreName[storeName]
    );
    if (!service) throw new Error('Service not provided');

    console.log('Providing service', `${storeName}Service`);
    app.provide(`${storeName}Service`, service); // Use storeName for the service key
    if (storeName === StoreName.flowStore) {
      const lucidFlow = useLucidFlow(service);
      app.provide('lucidFlow', lucidFlow);

      const apiKey = '';
      const chatService: ChatService = new RealChatService(apiKey, lucidFlow);

      //const chatService: ChatService = new MockChatService(apiKey, lucidFlow);
      app.provide('chatService', chatService);
    }
  }
});
