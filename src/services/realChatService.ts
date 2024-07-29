// src/services/realChatService.ts
import axios from 'axios';
import ChatService from './chatService'; // Import the interface
import { startChatParams } from 'src/models/startChatParams';
const { GoogleGenerativeAI } = require('@google/generative-ai');

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
    if (this.chats.has(nodeId)) {
      return this.chats.get(nodeId); // Return existing chat for this node
    }

    const genAI = new GoogleGenerativeAI(this.apiKey);
    this.model = genAI.getGenerativeModel('gemini-1.5-pro-latest'); // Assuming this is your model ID

    const chat = this.model.startChat(startChatParams);
    this.chats.set(nodeId, chat);
    return chat;
  }

  async sendMessage(
    text: string,
    nodeId: string // Node ID to identify the chat
  ): Promise<{ result: string }> {
    try {
      if (!this.chats.has(nodeId)) {
        await this.startChat(nodeId); // Start a new chat if it doesn't exist
      }

      const chat = this.chats.get(nodeId);
      //const contextUris = this.loadUrisFromFile(); // Load your URIs

      // Customize based on your Gemini API:
      const result = await chat.sendMessage(text); // Add contextFiles or other parameters as needed
      const responseText = result.response.text();

      return { result: responseText };
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async loadChatHistory(): Promise<void> {
    const savedHistory = sessionStorage.getItem('chatHistory');
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

  // ... (add other methods from your component as needed)
}

export default RealChatService;
