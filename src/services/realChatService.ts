// src/services/realChatService.ts
import { GoogleGenerativeAI, ModelParams } from '@google/generative-ai';
import { Message } from '../models/chatInterfaces';
import { inject } from 'vue';
import { LucidFlowComposable } from '../composables/useLucidFlow';
import ChatService from '../services/chatService';
import { startChatParams } from '../models/startChatParams';

class RealChatService implements ChatService {
  private apiKey: string;
  private chats: Map<string, any> = new Map(); // Store chat instances by node ID
  private model: any;
  private lucidFlow: LucidFlowComposable;

  constructor(apiKey: string, lucidFlow: LucidFlowComposable) {
    this.apiKey = apiKey;
    this.lucidFlow = lucidFlow;
    if (!this.lucidFlow) {
      throw new Error('lucidFlow composable not provided!');
    }
  }
  loadChatHistory(nodeId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  updateChatHistory(nodeId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  clearChat(nodeId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async startChat(nodeId: string) {
    console.log('Starting chat for node:', nodeId);
    if (this.chats.has(nodeId)) {
      return this.chats.get(nodeId);
    }

    const genAI = new GoogleGenerativeAI(this.apiKey);
    const modelParams: ModelParams = {
      model: 'gemini-1.5-pro-latest',
    };
    this.model = genAI.getGenerativeModel(modelParams);

    // Load initial chat history from lucidFlow
    const initialHistory = (await this.lucidFlow.getNodeChatData(nodeId)) || [];
    console.log('initialHistory length:', initialHistory.length);

    // Integrate initialHistory into startChatParams - ADAPT THIS SECTION:
    startChatParams.history = startChatParams.history.concat(
      initialHistory.map((message) => ({
        role: message.sender === 'user' ? 'user' : 'model',
        parts: [{ text: message.message }],
      }))
    );

    const chat = this.model.startChat(startChatParams);
    this.chats.set(nodeId, chat);
    return chat;
  }

  async sendMessage(text: string, nodeId: string): Promise<any> {
    console.log('Sending message:', text, 'for node:', nodeId);
    // Returns the full Gemini response
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

  async getChatHistory(nodeId: string): Promise<any[]> {
    if (!this.chats.has(nodeId)) {
      return [];
    }

    const chat = this.chats.get(nodeId);
    const history = chat.messages; // Assuming "messages" is in your chat instance
    return history.map((item: any) => ({
      sender: item.role,
      message: item.text,
      createdAt: item.timestamp,
      error: false,
    }));
  }
}

export default RealChatService;
