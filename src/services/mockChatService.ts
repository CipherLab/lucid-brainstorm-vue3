// src/services/mockChatService.ts
import ChatService from './chatService';

class MockChatService implements ChatService {
  async sendMessage(text: string): Promise<{ result: string }> {
    // Simulate a delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Return a mock response
    return { result: `Mock response to: ${text}` };
  }

  async loadChatHistory(): Promise<void> {
    // ... (load mock history if needed)
  }

  async updateChatHistory(): Promise<void> {
    // ... (no need to actually save in mock mode)
  }

  async clearChat(): Promise<void> {
    // ... (no need to actually clear in mock mode)
  }
  async getChatHistory(nodeId: string): Promise<any[]> {
    // ... (return mock history if needed)
    return [];
  }
  // ... (implement other mock methods as needed)
}

export default MockChatService;
