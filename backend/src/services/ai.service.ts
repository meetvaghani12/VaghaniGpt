import { AI_CONFIG } from '../config/ai';
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface OpenAIRequest {
  messages: ChatMessage[];
  model: string;
  max_tokens: number;
  publisher: string;
}

export class AIService {
  private static async callGemini(messages: ChatMessage[]) {
    console.log('[AI Service] Calling Gemini API...');
    const apiKey = AI_CONFIG.gemini.apiKey;
    if (!apiKey) {
      throw new Error('Gemini API key is not configured');
    }

    const response = await fetch(`${AI_CONFIG.gemini.baseUrl}/models/${AI_CONFIG.gemini.model}:generateContent`, {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
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
      const errorText = await response.text();
      console.error('[AI Service] Gemini API error:', errorText);
      throw new Error(`Failed to get response from Gemini: ${errorText}`);
    }

    const data = await response.json();
    console.log('[AI Service] Gemini API response received');
    return data.candidates[0].content.parts[0].text;
  }

  private static async callDeepSeek(messages: ChatMessage[]): Promise<string> {
    console.log('[AI Service] Calling DeepSeek API...');
    const apiKey = AI_CONFIG.deepseek.apiKey;
    if (!apiKey) {
      throw new Error('DeepSeek API key is not configured');
    }
    
    console.log('[AI Service] DeepSeek API Key:', apiKey ? 'Present' : 'Missing');
    
    const client = ModelClient(
      AI_CONFIG.deepseek.baseUrl,
      new AzureKeyCredential(apiKey)
    );

    const response = await client.path("/chat/completions").post({
      body: {
        messages: messages,
        model: AI_CONFIG.deepseek.model,
        max_tokens: 2048,
      }
    });

    if (isUnexpected(response)) {
      console.error('[AI Service] DeepSeek API error:', response.body.error);
      throw response.body.error;
    }

    console.log('[AI Service] DeepSeek API response received');
    const content = response.body.choices[0].message.content;
    if (!content) {
      throw new Error('DeepSeek API returned empty response');
    }
    return content;
  }

  private static async callOpenAI(messages: ChatMessage[]): Promise<string> {
    console.log('[AI Service] Calling OpenAI API...');
    const apiKey = AI_CONFIG.openai.apiKey;
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured');
    }
    
    console.log('[AI Service] OpenAI API Key:', apiKey ? 'Present' : 'Missing');
    
    const client = ModelClient(
      AI_CONFIG.openai.baseUrl,
      new AzureKeyCredential(apiKey)
    );

    try {
      const requestBody: OpenAIRequest = {
        messages: messages,
        model: AI_CONFIG.openai.model,
        max_tokens: 2048,
        publisher: AI_CONFIG.openai.publisher,
      };

      const response = await client.path("/chat/completions").post({
        body: requestBody
      });

      if (isUnexpected(response)) {
        const errorMessage = response.body.error?.message || 'Unknown error occurred';
        const errorCode = response.body.error?.code || 'UNKNOWN_ERROR';
        console.error('[AI Service] OpenAI API error:', {
          message: errorMessage,
          code: errorCode,
          status: response.status,
          body: response.body
        });
        throw new Error(`OpenAI API error (${errorCode}): ${errorMessage}`);
      }

      console.log('[AI Service] OpenAI API response received');
      const content = response.body.choices[0].message.content;
      if (!content) {
        throw new Error('OpenAI API returned empty response');
      }
      return content;
    } catch (error) {
      console.error('[AI Service] OpenAI API error:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      });
      throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    }
  }

  public static async getResponse(messages: ChatMessage[], model: 'gemini' | 'deepseek' | 'openai' = 'gemini'): Promise<string> {
    try {
      console.log('[AI Service] Starting getResponse with model:', model);
      
      switch (model) {
        case 'gemini':
          return await this.callGemini(messages);
        case 'deepseek':
          return await this.callDeepSeek(messages);
        case 'openai':
          return await this.callOpenAI(messages);
        default:
          throw new Error(`Invalid model specified: ${model}`);
      }
    } catch (error) {
      console.error(`[AI Service] Error getting response from ${model}:`, error);
      throw error;
    }
  }
} 