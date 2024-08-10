// RealChatService.ts
import { LucidFlowComposable } from '../composables/useLucidFlow.ts';
import { GoogleGenerativeAI, ModelParams } from '@google/generative-ai';
import BaseChatService from './baseChatService.ts';
import {
  startChatParams,
  StartChatParams,
  ChatHistory,
  ChatPart,
} from '../models/startChatParams.ts';

class RealChatService extends BaseChatService {
  constructor(apiKey: string, lucidFlow: LucidFlowComposable) {
    super(apiKey, lucidFlow);
    //console.log('RealChatService initialized', apiKey);
  }

  async startChat(nodeId: string, systemInstructions: string) {
    const updatedChatParams = await super.startChat(nodeId, systemInstructions);
    const chat = this.model.startChat(updatedChatParams);
    this.chats.set(nodeId, chat);
    return chat;
  }

  async sendMessage(nodeId: string, text: string): Promise<{ result: string }> {
    try {
      const nodeProps = this.lucidFlow.findNodeProps(nodeId);
      const systemInstructions = nodeProps?.data.agent.systemInstructions;
      const chat = await this.startChat(nodeId, systemInstructions);
      const chatHistory = await super.buildChatHistory(
        nodeId,
        systemInstructions
      );
      //console.log('Real chatHistory', chatHistory);

      const result = await chat.sendMessage(text);
      const responseText = result.response.text();
      return { result: responseText };
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }
}

export default RealChatService;
