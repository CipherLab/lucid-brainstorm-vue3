import { defaultInstructions } from './startChatParams';

interface GenerationConfig {
  temperature: number;
  topP: number;
  topK: number;
  maxOutputTokens?: number;
}

interface SafetySetting {
  category: string;
  threshold: string;
}

interface ModelConfig {
  model: string;
  generationConfig: GenerationConfig;
  safetySettings: SafetySetting[];
  systemInstruction?: {
    role: 'system';
    parts: { text: string }[];
  };
}

const modelConfig: ModelConfig = {
  // model: "gemini-pro",
  model: 'gemini-1.5-pro-latest',
  generationConfig: {
    temperature: 1,
    topP: 0.95,
    topK: 0,
    // maxOutputTokens: 500,
  },
  safetySettings: [
    {
      category: 'HARM_CATEGORY_HARASSMENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
    {
      category: 'HARM_CATEGORY_HATE_SPEECH',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
    {
      category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
    {
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
  ],
};

if (modelConfig.model !== 'gemini-pro') {
  modelConfig.systemInstruction = {
    role: 'system',
    parts: [
      {
        text: defaultInstructions,
      },
    ],
  };
}

export { modelConfig };
