import { boot } from 'quasar/wrappers';
import RealChatService from '../services/realChatService'; // Make sure this path is correct
import ChatService from '../services/chatService'; // The interface
import useLucidFlow from '../composables/useLucidFlow';

export default boot(({ app }) => {
  const lucidFlow = useLucidFlow(); // Get the lucidFlow instance
  const apiKey = 'AIzaSyCGJYzPdw4I_FBVBN6qvPnhG_IrH_6oywk';
  const chatService: ChatService = new RealChatService(apiKey, lucidFlow);
  app.provide('chatService', chatService);
});
