import { boot } from 'quasar/wrappers';
import RealChatService from '../services/realChatService';
import MockChatService from '../services/mockChatService';
import ChatService from '../services/chatService'; // The interface

export default boot(({ app }) => {
  // const chatService: ChatService =
  //   process.env.NODE_ENV === 'development'
  //     ? new MockChatService()
  //     : new RealChatService('AIzaSyCGJYzPdw4I_FBVBN6qvPnhG_IrH_6oywk');
  // const chatService: ChatService = new RealChatService(
  //   'AIzaSyCGJYzPdw4I_FBVBN6qvPnhG_IrH_6oywk'
  // );
  //app.provide('chatService', chatService);
});
