// modelConfig.ts
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
  defaultInstructions: string; // New field for default instructions
}

// Set default instructions directly in modelConfig
const modelConfig: ModelConfig = {
  model: 'gemini-1.5-pro-latest',
  generationConfig: {
    temperature: 1,
    topP: 0.95,
    topK: 0,
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
  defaultInstructions: 'You are a helpful AI assistant.', // Your default instructions here
};

// ... (you can remove the `if (modelConfig.model !== 'gemini-pro')` block) ...

export { modelConfig };
