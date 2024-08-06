// src/services/realChatService.ts
import axios from 'axios';
import ChatService from './chatService'; // Import the interface
import { startChatParams } from '../models/startChatParams';
import { GoogleGenerativeAI, ModelParams } from '@google/generative-ai';

class RealChatService implements ChatService {
  private chatUrl: string;
  private apiKey: string;
  private chats: Map<string, any> = new Map(); // Store chat instances by node ID
  private model: any;

  constructor(chatUrl: string, apiKey: string) {
    this.chatUrl = chatUrl;
    this.apiKey = apiKey;
  }

  async startChat(nodeId: string) {
    console.log('Starting chat for node:', nodeId);
    if (this.chats.has(nodeId)) {
      return this.chats.get(nodeId); // Return existing chat for this node
    }

    const genAI = new GoogleGenerativeAI(this.apiKey);
    const modelParams: ModelParams = {
      // Populate the ModelParams object with the necessary properties
      // Example:
      model: 'gemini-1.5-pro-latest',
      // Add other properties as required by the ModelParams interface
    };
    this.model = genAI.getGenerativeModel(modelParams);

    const chat = this.model.startChat(startChatParams);
    this.chats.set(nodeId, chat);
    return chat;
  }

  async sendMessage(
    text: string,
    nodeId: string // Node ID to identify the chat
  ): Promise<any> {
    // Returns the full Gemini response object
    try {
      if (!this.chats.has(nodeId)) {
        await this.startChat(nodeId);
      }
      const chat = this.chats.get(nodeId);
      const result = await chat.sendMessage(text);
      return result;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }
  async loadChatHistory(nodeId: string): Promise<void> {
    const savedHistory = sessionStorage.getItem(`chatHistory_${nodeId}`);
    if (savedHistory) {
      // ... (load history logic -  you'll likely need to update your component's messages ref)
    }
  }

  async updateChatHistory(): Promise<void> {
    // ... (save history logic -  similarly, update the messages ref in your component)
  }

  async clearChat(): Promise<void> {
    try {
      // ... (your existing clear chat logic)
    } catch (error) {
      console.error('Failed to clear chat:', error);
      throw error; // Re-throw
    }
  }

  async getChatHistory(nodeId: string): Promise<any[]> {
    // For now, let's assume history is stored within the chat instance itself
    if (!this.chats.has(nodeId)) {
      return []; // Return empty history if chat doesn't exist
    }

    const chat = this.chats.get(nodeId);
    // Replace this with your actual history retrieval logic from the chat instance
    // Example (adapt as needed):
    const history = chat.messages; // Assuming "messages" is a property of your chat instance
    return history.map((item: any) => ({
      sender: item.role, // Adapt to your chat instance structure
      message: item.text,
      createdAt: item.timestamp, // Adapt if necessary
      error: false,
    }));
  }

  // ... (add other methods from your component as needed)
}

export default RealChatService;
