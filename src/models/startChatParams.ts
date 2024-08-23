import { Content, GenerationConfig } from '@google/generative-ai';
import { modelConfig } from './modelConfig';

interface ChatPart {
  text: string;
}

interface ChatHistory {
  role: 'user' | 'model';
  parts: ChatPart[];
}

interface StartChatParams {
  history: ChatHistory[];
  generationConfig: GenerationConfig;
  systemInstructions: Content;
}

const startChatParams: StartChatParams = {
  history: [
    // {
    //   role: 'user',
    //   parts: [
    //     {
    //       text: '',
    //     },
    //   ],
    // },
    // {
    //   role: 'model',
    //   parts: [{ text: 'Great to meet you. What would you like to know?' }],
    // },
  ],
  // generationConfig: { maxOutputTokens: 400 },
  systemInstructions: {
    role: 'system',
    parts: [{ text: modelConfig.defaultInstructions }], // Correct format for system instructions
  },
  generationConfig: {
    temperature: modelConfig.generationConfig.temperature, // Get default temperature from modelConfig
  },
};

// Use 'export type' for type-only exports
export { startChatParams };
export type { StartChatParams, ChatHistory, ChatPart };
