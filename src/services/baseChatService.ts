import { ChatService, Message } from '../models/chatInterfaces';
import { LucidFlowComposable } from '../composables/useLucidFlow.ts';
import { GoogleGenerativeAI, ModelParams } from '@google/generative-ai';
import {
  startChatParams,
  StartChatParams,
  ChatHistory,
  ChatPart,
} from '../models/startChatParams.ts';
import { DataFetcher } from './dataFetcher.ts';
import { WebDataFetcher } from './webDataFetcher.ts';

abstract class BaseChatService implements ChatService {
  protected apiKey: string;
  protected chats: Map<string, any> = new Map();
  protected model: any;
  protected lucidFlow: LucidFlowComposable;
  protected webDataFetcher: DataFetcher;

  constructor(apiKey: string, lucidFlow: LucidFlowComposable) {
    this.apiKey = apiKey;
    this.lucidFlow = lucidFlow;
    this.webDataFetcher = new WebDataFetcher();
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
    //console.log('apiKey', apiKey);

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

      // Get connected nodes using lucidFlow
      const connectedNodeIds = this.lucidFlow.getConnectedNodes(nodeId, true);

      // Merge all connected chat histories into a single string
      let mergedHistoryText = '';
      for (const connectedNodeId of connectedNodeIds) {
        if (connectedNodeId === nodeId) continue;

        const connectedNode = this.lucidFlow.findNodeProps(connectedNodeId);

        const connectedChatHistory = await this.lucidFlow.getNodeChatData(
          connectedNodeId
        );

        if (connectedChatHistory) {
          // const isEnabled =
          //   connectedChatHistory[0]?.isEnabledByNode[nodeId] ?? true;
          // Re-fetch data if watcher is true and it's a webpage node
          const isEnabled =
            connectedChatHistory[0]?.isEnabledByNode[nodeId] ?? true;

          if (
            isEnabled &&
            connectedNode?.data.agent.subtype === 'github' &&
            Array.isArray(connectedNode.data.agent.gitHubAgentMode)
          ) {
            // Fetch the latest data from GitHub using octokit. iterate on each message.
            for (const message of connectedChatHistory) {
              console.log(`pretending to process message ${message}`);
            }
          } else if (
            isEnabled &&
            connectedNode?.data.agent.watcher &&
            connectedNode?.data.agent.subtype === 'webpage'
          ) {
            try {
              const freshData = await this.webDataFetcher.fetchData(
                connectedNode.data.agent.webUrl
              );
              // Update the chat history with the fresh data
              connectedChatHistory[0].message = freshData;
              await this.lucidFlow.updateNodeChatData(
                connectedNodeId,
                connectedChatHistory
              );
            } catch (error) {
              console.error(
                `Error fetching data for node ${connectedNodeId}:`,
                error
              );
              // Handle the error appropriately, e.g., show an error message
            }
          }
          if (isEnabled) {
            mergedHistoryText += connectedChatHistory
              .map(
                (message) => `\`\`\`
          //NEW FILE or MESSAGE: ${connectedNode?.data.label}
          ${message.message?.trim()}
          \`\`\`
          \r`
              )
              .join('');
          }
        }
      }

      // Create a single user message with the merged history
      const mergedHistory: ChatHistory = {
        role: 'user',
        parts: [{ text: mergedHistoryText }],
      };

      // Apply ensurePattern to maintain the correct user/model pattern
      const finalHistory = this.ensurePattern([mergedHistory]);

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
    } catch (error: any) {
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
      if (currentMessage.role !== 'user' && currentMessage.role !== 'model') {
        currentMessage.role = 'model';
      }
      //console.log('currentMessage', currentMessage.role);

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
        parts: [{ text: isEnabled ? message.message.trim() || '' : '' }],
      };
    });
  }
}

export default BaseChatService;
