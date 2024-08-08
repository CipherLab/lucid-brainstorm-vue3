// src/services/mockChatService.ts

import { ChatService } from '../models/chatInterfaces';

class MockChatService implements ChatService {
  startChat(nodeId: string, systemInstructions: string): Promise<void> {
    // ... (no need to actually start in mock mode)
    return Promise.resolve();
  }
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

  // ... (implement other mock methods as needed)
}

export default MockChatService;
