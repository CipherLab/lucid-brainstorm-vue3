// MockChatService.ts

import { LucidFlowComposable } from '../composables/useLucidFlow';
import { StartChatParams } from '../models/startChatParams';
import BaseChatService from './baseChatService';

class MockChatService extends BaseChatService {
  constructor(apiKey: string, lucidFlow: LucidFlowComposable) {
    console.log('MockChatService initialized', apiKey);
    // Mock implementation does not need parameters
    super('', lucidFlow); // Example, replace with appropriate parameters if needed
  }

  async startChat(
    nodeId: string,
    systemInstructions: string
  ): Promise<StartChatParams> {
    // Mock implementation of startChat
    const updatedChatParams = super.startChat(nodeId, systemInstructions);
    console.log(
      'Mock startChat',
      nodeId,
      systemInstructions,
      updatedChatParams
    );
    return updatedChatParams;
  }

  async sendMessage(nodeId: string, text: string): Promise<{ result: string }> {
    const nodeProps = this.lucidFlow.findNodeProps(nodeId);
    const systemInstructions = nodeProps?.data.agent.systemInstructions;

    const chatHistory = await super.buildChatHistory(
      nodeId,
      systemInstructions
    );

    console.log('Mock chatHistory', chatHistory);

    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { result: `Mock response to: ${text}` };
  }
}

export default MockChatService;
