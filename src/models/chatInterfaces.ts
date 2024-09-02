import { StartChatParams } from './startChatParams';

export interface Message {
  id: string;
  sender: string;
  message: string | null;
  createdAt: number;
  error: boolean;
  typing?: boolean;
  selected: boolean;
  isEnabledByNode: Record<string, boolean>;
  data: any;
}

export interface GitHubRepoAgentData {
  owner: string;
  repo: string;
  path: string;
  branch: string;
  fullUrl: string;
  agentMode: string;
}
export interface ChatService {
  startChat(
    nodeId: string,
    systemInstructions: string
  ): Promise<StartChatParams>;
  sendMessage(nodeId: string, text: string): Promise<{ result: string }>;
}
