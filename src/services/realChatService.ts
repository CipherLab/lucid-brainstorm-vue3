import ChatService from './chatService'; // Import the interface
import {
  startChatParams,
  defaultInstructions,
} from '../models/startChatParams';
import { GoogleGenerativeAI, ModelParams } from '@google/generative-ai';
import { LucidFlowComposable } from '../composables/useLucidFlow';
import { Message } from '../models/chatInterfaces';

class RealChatService implements ChatService {
  private apiKey: string;
  private chats: Map<string, any> = new Map();
  private model: any;
  private lucidFlow: LucidFlowComposable;

  constructor(apiKey: string, lucidFlow: LucidFlowComposable) {
    this.lucidFlow = lucidFlow;
    this.apiKey = apiKey;
    console.log('RealChatService initialized', apiKey);
  }

  async startChat(
    nodeId: string,
    systemInstructions: string = defaultInstructions
  ) {
    if (this.chats.has(nodeId)) {
      this.chats.delete(nodeId); // clear it out
    }

    const genAI = new GoogleGenerativeAI(this.apiKey);
    const modelParams: ModelParams = {
      model: 'gemini-1.5-pro-latest',
    };
    this.model = genAI.getGenerativeModel(modelParams);

    const fullHistory: { role: string; parts: { text: string }[] }[] = [];

    // 1. System Instructions
    fullHistory.push({
      role: 'user', // Or 'system' if that's how your API expects it
      parts: [{ text: systemInstructions }],
    });

    // 2. Add Connected Node Chat History:
    const connectedNodeIds = this.lucidFlow.getConnectedNodes(nodeId);
    for (const connectedNodeId of connectedNodeIds) {
      const connectedChatHistory = await this.lucidFlow.getNodeChatData(
        connectedNodeId
      );
      if (connectedChatHistory) {
        fullHistory.push(...this.formatChatHistory(connectedChatHistory));
      }
    }

    // 3. Add Current Node Chat History:
    const currentChatHistory = await this.lucidFlow.getNodeChatData(nodeId);
    if (currentChatHistory) {
      fullHistory.push(...this.formatChatHistory(currentChatHistory));
    }

    // Create the chat with the combined history:
    const chat = this.model.startChat({ history: fullHistory });
    this.chats.set(nodeId, chat);

    return chat;
  }

  async sendMessage(text: string, nodeId: string): Promise<{ result: string }> {
    try {
      const nodeProps = this.lucidFlow.findNodeProps(nodeId);
      const systemInstructions =
        nodeProps?.data.agent.systemInstructions || defaultInstructions;

      if (!this.chats.has(nodeId)) {
        await this.startChat(nodeId, systemInstructions);
      }

      const chat = this.chats.get(nodeId);
      const result = await chat.sendMessage(text);
      const responseText = result.response.text();
      return { result: responseText };
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Helper to format history
  private formatChatHistory(
    messages: Message[]
  ): { role: string; parts: { text: string }[] }[] {
    return messages.map((message) => ({
      role: message.sender === 'user' ? 'user' : 'model',
      parts: [{ text: message.message || '' }],
    }));
  }

  // ... other methods as needed ...
}

export default RealChatService;
