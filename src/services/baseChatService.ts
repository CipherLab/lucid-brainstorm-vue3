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

  protected getApiKey(): string {
    const apiKey = sessionStorage.getItem('apikey');
    console.log('apiKey', apiKey);

    if (!apiKey || apiKey === '') {
      throw new Error('API key not found in session storage');
    }
    return apiKey;
  }
  protected async buildChatHistory(
    nodeId: string,
    systemInstructions: string
  ): Promise<StartChatParams> {
    if (!this.apiKey || this.apiKey === '') {
      this.apiKey = this.getApiKey();
    }
    try {
      const genAI = new GoogleGenerativeAI(this.apiKey);

      const modelParams: ModelParams = {
        model: 'gemini-1.5-pro-latest',
      };
      this.model = genAI.getGenerativeModel(modelParams);

      const fullHistoryMap = new Map<string, ChatHistory>(); // Use a Map
      fullHistoryMap.set('initialDummy', {
        role: 'user',
        parts: [{ text: '' }],
      });

      // Get connected nodes using lucidFlow
      const connectedNodeIds = this.lucidFlow.getConnectedNodes(nodeId, true);

      for (const connectedNodeId of connectedNodeIds) {
        const connectedChatHistory = await this.lucidFlow.getNodeChatData(
          connectedNodeId
        );

        if (connectedChatHistory) {
          connectedChatHistory.sort((a, b) => a.id.localeCompare(b.id));
          const formattedHistory = this.formatChatHistory(
            connectedChatHistory,
            nodeId
          );

          formattedHistory.forEach((item) => {
            //if (item.parts[0].text !== '') {
            fullHistoryMap.set(item.parts[0].text, item);
            //}
          });
        }
      }

      const fullHistory = Array.from(fullHistoryMap.values());

      const finalHistory = this.ensurePattern(fullHistory);
      console.log('finalHistory', finalHistory);

      // Create the chat with the combined history:
      const updatedStartChatParams: StartChatParams = {
        ...startChatParams,
        systemInstructions: {
          role: 'system',
          parts: [{ text: systemInstructions }],
        },
        history: finalHistory,
      };
      return updatedStartChatParams;
    } catch (error) {
      sessionStorage.removeItem('apikey');
      throw error;
    }
  }
  // Modify ensurePattern to work with the Map
  private ensurePattern(newHistory: ChatHistory[]): ChatHistory[] {
    if (newHistory.length === 0) {
      return newHistory;
    }

    const modifiedHistory: ChatHistory[] = [];

    for (let i = 0; i < newHistory.length; i++) {
      const currentMessage = newHistory[i];

      // If there's a previous message and the roles match, add a dummy message
      if (
        i > 0 &&
        modifiedHistory[modifiedHistory.length - 1].role === currentMessage.role
      ) {
        const dummyMessage: ChatHistory = {
          role: currentMessage.role === 'user' ? 'model' : 'user',
          parts: [{ text: '' }],
        };
        modifiedHistory.push(dummyMessage);
      }

      modifiedHistory.push(currentMessage);
    }

    return modifiedHistory;
  }

  private formatChatHistory(
    messages: Message[],
    nodeId: string
  ): ChatHistory[] {
    // Pass nodeId
    const nonReactive = JSON.parse(JSON.stringify(messages));

    return nonReactive.map((message) => {
      // Check isEnabledByNode for the specific nodeId
      const isEnabled = message.isEnabledByNode[nodeId] ?? true; // Default to true if not set
      if (message.sender === 'input') {
        message.sender = 'user';
      } else if (message.sender === 'Assistant') {
        message.sender = 'model';
      }

      return {
        role: message.sender + '',
        parts: [{ text: isEnabled ? message.message || '' : '' }],
      };
    });
  }
}

export default BaseChatService;
