// src/services/chatService.ts

interface ChatService {
  sendMessage(text: string, guid?: string | null): Promise<{ result: string }>;
  loadChatHistory(): Promise<void>;
  updateChatHistory(): Promise<void>;
  clearChat(): Promise<void>;
  // Add other methods as needed (e.g., getAgentResponse, etc.)
}

export default ChatService;
