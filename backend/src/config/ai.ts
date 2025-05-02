export const AI_CONFIG = {
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: 'gemini-2.0-flash',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  },
  deepseek: {
    apiKey: process.env.GITHUB_TOKEN || '',
    model: 'deepseek/DeepSeek-R1',
    baseUrl: 'https://models.github.ai/inference',
  },
  openai: {
    apiKey: process.env.GITHUB_TOKEN_2 || '',
    model: 'gpt-4.1',
    baseUrl: 'https://models.github.ai/inference',
    publisher: 'openai',
  },
} as const;

export type AIModel = 'gemini' | 'deepseek' | 'openai'; 