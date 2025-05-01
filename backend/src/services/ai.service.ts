import { AI_CONFIG } from '../config/ai';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export class AIService {
  private static async callGemini(messages: ChatMessage[]) {
    const response = await fetch(`${AI_CONFIG.gemini.baseUrl}/models/${AI_CONFIG.gemini.model}:generateContent`, {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json',
        'x-goog-api-key': AI_CONFIG.gemini.apiKey || '',
      }),
      body: JSON.stringify({
        contents: messages.map(msg => ({
          role: msg.role,
          parts: [{ text: msg.content }],
        })),
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get response from Gemini');
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  public static async getResponse(messages: ChatMessage[]): Promise<string> {
    try {
      return await this.callGemini(messages);
    } catch (error) {
      console.error('Error getting response from Gemini:', error);
      throw error;
    }
  }
} 