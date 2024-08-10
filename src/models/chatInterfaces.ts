import { StartChatParams } from './startChatParams';

export interface Message {
  id: string;
  sender: string;
  message: string | null;
  createdAt: number;
  error: boolean;
  typing?: boolean;
  selected: boolean;
  isEnabled: boolean;
}

export interface ChatService {
  startChat(
    nodeId: string,
    systemInstructions: string
  ): Promise<StartChatParams>;
  sendMessage(nodeId: string, text: string): Promise<{ result: string }>;
}
