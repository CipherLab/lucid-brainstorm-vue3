import { ChatService, Message } from '../models/chatInterfaces';
import { LucidFlowComposable } from '../composables/useLucidFlow.ts';
import { GoogleGenerativeAI, ModelParams } from '@google/generative-ai';
import {
  startChatParams,
  StartChatParams,
  ChatHistory,
  ChatPart,
} from '../models/startChatParams.ts';

abstract class BaseChatService implements ChatService {
  protected apiKey: string;
  protected chats: Map<string, any> = new Map();
  protected model: any;
  protected lucidFlow: LucidFlowComposable;

  constructor(apiKey: string, lucidFlow: LucidFlowComposable) {
    this.apiKey = apiKey;
    this.lucidFlow = lucidFlow;
  }

  async startChat(
    nodeId: string,
    systemInstructions: string
  ): Promise<StartChatParams> {
    // To be implemented by derived classes
    return this.buildChatHistory(nodeId, systemInstructions);
  }

  async sendMessage(nodeId: string, text: string): Promise<{ result: string }> {
    // To be implemented by derived classes
    return { result: '' };
  }

  protected async buildChatHistory(
    nodeId: string,
    systemInstructions: string
  ): Promise<StartChatParams> {
    const genAI = new GoogleGenerativeAI(this.apiKey);

    const modelParams: ModelParams = {
      model: 'gemini-1.5-pro-latest',
    };
    this.model = genAI.getGenerativeModel(modelParams);

    const fullHistory: ChatHistory[] = [];
    fullHistory.push({
      role: 'user', // Dummy message
      parts: [{ text: '' }],
    });

    // Get connected nodes using lucidFlow
    const connectedNodeIds = this.lucidFlow.getConnectedNodes(nodeId, true); // Include self

    for (const connectedNodeId of connectedNodeIds) {
      const connectedChatHistory = await this.lucidFlow.getNodeChatData(
        connectedNodeId
      );
      if (connectedChatHistory) {
        const formattedHistory = this.formatChatHistory(connectedChatHistory);
        this.ensurePattern(fullHistory, formattedHistory);
        fullHistory.push(...formattedHistory);
      }
    }

    // Create the chat with the combined history:
    const updatedStartChatParams: StartChatParams = {
      ...startChatParams,
      systemInstructions: {
        role: 'system',
        parts: [{ text: systemInstructions }],
      },
      history: fullHistory,
    };

    return updatedStartChatParams;
  }

  private ensurePattern(
    fullHistory: ChatHistory[],
    newHistory: ChatHistory[]
  ): void {
    if (fullHistory.length > 0 && newHistory.length > 0) {
      const lastMessage = fullHistory[fullHistory.length - 1];
      const firstNewMessage = newHistory[0];

      if (lastMessage.role === firstNewMessage.role) {
        const dummyMessage: ChatHistory = {
          role: lastMessage.role === 'user' ? 'model' : 'user',
          parts: [{ text: '' }],
        };
        fullHistory.push(dummyMessage);
      }
    }
  }

  private formatChatHistory(messages: Message[]): ChatHistory[] {
    const nonReactive = JSON.parse(JSON.stringify(messages));

    return nonReactive.map((message) => ({
      role: message.sender === 'user' ? 'user' : 'model',
      parts: [{ text: message.message || '' }],
    }));
  }
}

export default BaseChatService;
