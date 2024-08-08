// src/services/mockChatService.ts
import { ChatService } from '../models/chatInterfaces';

class MockChatService implements ChatService {
  async startChat(nodeId: string, systemInstructions: string): Promise<void> {
    console.log(
      `[MockChatService] Starting chat for node ${nodeId} with system instructions: ${systemInstructions}`
    );
    // In mock mode, you don't need to actually start a chat.
    // Just log the information for debugging purposes.
    return Promise.resolve(); // Return a resolved promise
  }

  async sendMessage(nodeId: string, text: string): Promise<{ result: string }> {
    console.log(
      `[MockChatService] Sending message "${text}" to node ${nodeId}`
    );
    // Simulate a delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Return a mock response
    return { result: `Mock response to: ${text}` };
  }
}

export default MockChatService;
