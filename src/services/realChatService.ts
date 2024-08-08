import {
  Content,
  GoogleGenerativeAI,
  ModelParams,
} from '@google/generative-ai';
import { LucidFlowComposable } from '../composables/useLucidFlow.ts';
import { ChatService, Message } from '../models/chatInterfaces.ts';
import {
  startChatParams,
  StartChatParams,
  ChatHistory,
  ChatPart,
} from '../models/startChatParams.ts';

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

  async startChat(nodeId: string, systemInstructions: string) {
    if (this.chats.has(nodeId)) {
      this.chats.delete(nodeId); // Clear it out
    }
    const genAI = new GoogleGenerativeAI(this.apiKey);

    const modelParams: ModelParams = {
      model: 'gemini-1.5-pro-latest',
    };
    this.model = genAI.getGenerativeModel(modelParams);

    const fullHistory: ChatHistory[] = [];
    // Add a dummy user message
    fullHistory.push({
      role: 'user',
      parts: [{ text: '' }], // An empty user message is enough
    });

    const connectedNodeIds = this.lucidFlow.getConnectedNodes(nodeId);
    for (const connectedNodeId of connectedNodeIds) {
      const connectedChatHistory = await this.lucidFlow.getNodeChatData(
        connectedNodeId
      );
      if (connectedChatHistory) {
        fullHistory.push(...this.formatChatHistory(connectedChatHistory));
      }
    }

    const currentChatHistory = await this.lucidFlow.getNodeChatData(nodeId);
    if (currentChatHistory) {
      fullHistory.push(...this.formatChatHistory(currentChatHistory));
    }

    // Create a new StartChatParams object with the correct system instructions
    const updatedStartChatParams: StartChatParams = {
      ...startChatParams,
      systemInstructions: {
        role: 'system',
        parts: [{ text: systemInstructions }], // Remove the 'data' object
      },
      history: fullHistory, // Override history with the combined history
    };

    const chat = this.model.startChat(updatedStartChatParams);
    this.chats.set(nodeId, chat);
    return chat;
  }

  async sendMessage(nodeId: string, text: string): Promise<{ result: string }> {
    try {
      const nodeProps = this.lucidFlow.findNodeProps(nodeId);
      const systemInstructions = nodeProps?.data.agent.systemInstructions;
      console.log('Sending message:', text, nodeId, systemInstructions);
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

  private formatChatHistory(messages: Message[]): ChatHistory[] {
    return messages.map((message) => ({
      role: message.sender === 'user' ? 'user' : 'model',
      parts: [{ text: message.message || '' }],
    }));
  }
}

export default RealChatService;
