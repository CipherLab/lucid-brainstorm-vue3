// src/boot/chatService.ts
import { boot } from 'quasar/wrappers';
import RealChatService from 'src/services/realChatService';
import MockChatService from 'src/services/mockChatService';
import ChatService from 'src/services/chatService'; // The interface
export default boot(({ app }) => {
  // Choose which service to use (e.g., based on environment variable)
  const chatService: ChatService =
    process.env.NODE_ENV === 'development'
      ? new MockChatService()
      : new RealChatService(process.env.CHAT_URL, process.env.CHAT_API_KEY);

  app.provide('chatService', chatService);
});
