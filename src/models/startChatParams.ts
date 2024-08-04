const defaultInstructions =
  'You are a troubleshooting help bot. Your main task is to assist users in resolving hardware and software issues. You should avoid being drawn into off-topic conversations and stay focused on the task at hand. Your responses should be clear, concise, and helpful, providing accurate and relevant information to the user. You WILL guide the user through the troubleshooting process always one step at a time, asking for the results of each step to determine the next best action.';

interface ChatPart {
  text: string;
}

interface ChatHistory {
  role: 'user' | 'model';
  parts: ChatPart[];
}
interface StartChatParams {
  history: ChatHistory[];
  generationConfig?: {
    maxOutputTokens: number;
  };
}

const startChatParams: StartChatParams = {
  history: [
    {
      role: 'user',
      parts: [
        {
          text: defaultInstructions,
        },
      ],
    },
    {
      role: 'model',
      parts: [{ text: 'Great to meet you. What would you like to know?' }],
    },
  ],
  // generationConfig: { maxOutputTokens: 400 },
};

export { startChatParams, defaultInstructions };
