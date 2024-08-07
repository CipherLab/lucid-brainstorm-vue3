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
  private model: any;
  private lucidFlow: LucidFlowComposable;

  constructor(apiKey: string, lucidFlow: LucidFlowComposable) {
    this.lucidFlow = lucidFlow;
    this.apiKey = apiKey;
    console.log('RealChatService initialized', apiKey);
  }

  async sendMessage(text: string, nodeId: string): Promise<{ result: string }> {
    try {
      const nodeProps = this.lucidFlow.findNodeProps(nodeId);
      if (!nodeProps) {
        throw new Error(`Node with ID ${nodeId} not found!`);
      }

      const systemInstructions =
        nodeProps.data.agent.systemInstructions || defaultInstructions;

      const genAI = new GoogleGenerativeAI(this.apiKey);
      const modelParams: ModelParams = {
        model: 'gemini-1.5-pro-latest',
      };
      this.model = genAI.getGenerativeModel(modelParams);

      const fullHistory: { role: string; parts: { text: string }[] }[] = [];

      // 1. System Instructions
      fullHistory.push({
        role: 'system', // Gemini expects 'system'
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

      // 4. Add User Message (Important!)
      fullHistory.push({
        role: 'user',
        parts: [{ text }],
      });

      // Start a NEW chat each time with the full history:
      const chat = this.model.startChat({ history: fullHistory });
      const response = await chat.sendMessage(text);
      const responseText = response.response.text();
      return { result: responseText };
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  private formatChatHistory(
    messages: Message[]
  ): { role: string; parts: { text: string }[] }[] {
    return messages.map((message) => ({
      role: message.sender === 'user' ? 'user' : 'model',
      parts: [{ text: message.message || '' }],
    }));
  }

  async getChatHistory(nodeId: string): Promise<any[]> {
    // This might not be necessary if you're rebuilding history each time.
    const currentChatHistory = await this.lucidFlow.getNodeChatData(nodeId);
    return this.formatChatHistory(currentChatHistory || []);
  }
}

export default RealChatService;
