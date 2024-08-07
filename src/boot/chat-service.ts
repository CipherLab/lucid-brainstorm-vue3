import { boot } from 'quasar/wrappers';
import RealChatService from '../services/realChatService';
import MockChatService from '../services/mockChatService';
import ChatService from '../services/chatService'; // The interface

export default boot(({ app }) => {
  if (process.env.CHAT_API_KEY === undefined) {
    throw new Error('CHAT_API_KEY environment variable not set!');
  }

  const chatService: ChatService =
    process.env.NODE_ENV === 'development'
      ? new MockChatService()
      : new RealChatService(process.env.CHAT_API_KEY);

  app.provide('chatService', chatService);
});
