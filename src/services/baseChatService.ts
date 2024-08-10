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

    const fullHistoryMap = new Map<string, ChatHistory>(); // Use a Map
    fullHistoryMap.set('initialDummy', { role: 'user', parts: [{ text: '' }] });

    // Get connected nodes using lucidFlow
    const connectedNodeIds = this.lucidFlow.getConnectedNodes(nodeId, true);

    for (const connectedNodeId of connectedNodeIds) {
      const connectedChatHistory = await this.lucidFlow.getNodeChatData(
        connectedNodeId
      );
      if (connectedChatHistory) {
        const formattedHistory = this.formatChatHistory(
          connectedChatHistory,
          nodeId
        );

        // Call ensurePattern before adding to the Map:
        this.ensurePattern(fullHistoryMap, formattedHistory);

        formattedHistory.forEach((item) => {
          if (item.parts[0].text !== '') {
            fullHistoryMap.set(item.parts[0].text, item);
          }
        });
      }
    }

    const fullHistory = Array.from(fullHistoryMap.values());

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
  // Modify ensurePattern to work with the Map
  private ensurePattern(
    fullHistoryMap: Map<string, ChatHistory>,
    newHistory: ChatHistory[]
  ): void {
    if (newHistory.length === 0) {
      return;
    }

    // Get the last message in the Map (which maintains order)
    const lastMessage = Array.from(fullHistoryMap.values()).pop();
    const firstNewMessage = newHistory[0];

    if (lastMessage && lastMessage.role === firstNewMessage.role) {
      const dummyMessage: ChatHistory = {
        role: lastMessage.role === 'user' ? 'model' : 'user',
        parts: [{ text: '' }],
      };
      fullHistoryMap.set('dummy' + Date.now(), dummyMessage); // Ensure unique ID for dummy message
    }
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
      if (message.sender !== 'user' && message.sender !== 'model') {
        message.sender = 'user';
      }
      return {
        role: message.sender + '',
        parts: [{ text: isEnabled ? message.message || '' : '' }],
      };
    });
  }
}

export default BaseChatService;
