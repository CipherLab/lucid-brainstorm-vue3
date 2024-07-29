// src/services/chatService.ts

interface ChatService {
  sendMessage(text: string, nodeId: string): Promise<{ result: string }>;
  loadChatHistory(nodeId: string): Promise<void>;
  updateChatHistory(nodeId: string): Promise<void>;
  clearChat(nodeId: string): Promise<void>;
  getChatHistory(nodeId: string): Promise<any[]>;
  // Add other methods as needed (e.g., getAgentResponse, etc.)
}

export default ChatService;
