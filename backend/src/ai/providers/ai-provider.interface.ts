import { HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

export interface AIProviderConfig {
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  provider: string;
}

export interface AIRequestOptions {
  temperature?: number;
  maxOutputTokens?: number;
  safetySettings?: Array<{
    category: HarmCategory;
    threshold: HarmBlockThreshold;
  }>;
  [key: string]: any;
}

export interface AIResponse {
  text: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface AIProvider {
  initialize(config: AIProviderConfig): void;
  generateContent(
    prompt: string,
    options?: AIRequestOptions,
  ): Promise<AIResponse>;
}
