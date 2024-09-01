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
import { Octokit } from '@octokit/core';

abstract class BaseChatService implements ChatService {
  protected apiKey: string;

  protected chats: Map<string, any> = new Map();
  protected model: any;
  protected lucidFlow: LucidFlowComposable;
  protected webDataFetcher: DataFetcher;
  protected octoKit: Octokit;

  constructor(apiKey: string, lucidFlow: LucidFlowComposable) {
    this.apiKey = apiKey;
    this.lucidFlow = lucidFlow;
    this.webDataFetcher = new WebDataFetcher();
    this.octoKit = new Octokit();
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

  //github key in storage

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

        //

        const connectedChatHistory = await this.lucidFlow.getNodeChatData(
          connectedNodeId
        );

        if (connectedChatHistory) {
          for (const connectedNode of connectedChatHistory) {
            let freshData = '';
            const enabled = connectedNode.isEnabledByNode[nodeId] ?? true;

            if (!enabled) continue;

            const foundNode = this.lucidFlow.findNodeProps(connectedNodeId);

            if (!foundNode) continue;

            if (
              foundNode.data.agent.subtype !== 'github' &&
              foundNode.data.agent.subtype !== 'webpage'
            )
              continue;

            if (!connectedNode.message) continue;

            if (!foundNode.data.agent.watcher) continue;

            if (foundNode.data.agent.subtype === 'github') {
              try {
                if (foundNode.data.agent.subtype === 'github') {
                  const urlParts = new URL(connectedNode.message).pathname
                    .split('/')
                    .filter(Boolean);
                  const owner = urlParts[0];
                  const repo = urlParts[1];
                  const path = urlParts.slice(2).join('/');

                  console.log('owner, repo, path', owner, repo, path);
                  const response = await this.octoKit.request(
                    'GET /repos/{owner}/{repo}/contents/{path}',
                    {
                      owner,
                      repo,
                      path,
                    }
                  );
                  console.log('got github data:', response.data);
                  // Assuming the response is a file, extract content
                  if (response.data && 'content' in response.data) {
                    const content = Buffer.from(
                      response.data.content,
                      'base64'
                    ).toString();
                    freshData = content; // Update the message content
                  } else {
                    console.warn(
                      'Unexpected response from GitHub API:',
                      response
                    );
                  }
                }
              } catch (error) {
                console.error('Error fetching GitHub content:', error);
                // Handle the error appropriately, e.g., show an error message
              }
            } else if (foundNode.data.agent.subtype === 'webpage') {
              try {
                const content = await this.webDataFetcher.fetchData(
                  foundNode.data.agent.webUrl
                );
                // Update the chat history with the fresh data
                connectedNode.message = content;
                freshData = content;
              } catch (error) {
                console.error(
                  `Error fetching data for node ${connectedNodeId}:`,
                  error
                );
                // Handle the error appropriately, e.g., show an error message
              }
            }

            if (freshData == '') continue;

            await this.lucidFlow.updateNodeChatData(
              connectedNodeId,
              connectedChatHistory
            );
            mergedHistoryText += connectedChatHistory
              .map(
                (message) => `\`\`\`
          //NEW FILE or MESSAGE: ${foundNode.data.label}
          ${freshData.trim()}
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
