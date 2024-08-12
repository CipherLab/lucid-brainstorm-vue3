import MockChatService from '../services/mockChatService';
import { boot } from 'quasar/wrappers';
import RealChatService from '../services/realChatService'; // Make sure this path is correct
import useLucidFlow from '../composables/useLucidFlow';
import { ChatService } from '../models/chatInterfaces';

export default boot(({ app }) => {
  const lucidFlow = useLucidFlow(); // Get the lucidFlow instance
  app.provide('lucidFlow', lucidFlow);

  const apiKey = '';
  const chatService: ChatService = new RealChatService(apiKey, lucidFlow);
  //const chatService: ChatService = new MockChatService(apiKey, lucidFlow);
  app.provide('chatService', chatService);
});
