/**
 * Anansi Ice Particle - LLM Configuration Types
 */

/** Supported LLM providers */
export type LLMProvider =
    | 'gemini'
    | 'openai'
    | 'openrouter'
    | 'anthropic'
    | 'chutes'
    | 'kobold'
    | 'custom';

/** Provider presets with default URLs and models */
export interface ProviderPreset {
    name: string;
    baseUrl: string;
    defaultModel: string;
    needsKey: boolean;
}

/** LLM Configuration */
export interface LLMConfig {
    id: string;
    name: string;
    provider: LLMProvider;
    model: string;
    apiKey: string;
    baseUrl: string;
}

/** Generation settings */
export interface GenerationSettings {
    temperature: number;
    maxTokens: number;
    topP: number;
}

/** Provider presets */
export const PROVIDER_PRESETS: Record<LLMProvider, ProviderPreset> = {
    gemini: {
        name: 'Google Gemini',
        baseUrl: 'https://generativelanguage.googleapis.com',
        defaultModel: 'gemini-1.5-flash',
        needsKey: true
    },
    openai: {
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        defaultModel: 'gpt-4o-mini',
        needsKey: true
    },
    openrouter: {
        name: 'OpenRouter',
        baseUrl: 'https://openrouter.ai/api/v1',
        defaultModel: 'openai/gpt-4o-mini',
        needsKey: true
    },
    anthropic: {
        name: 'Anthropic',
        baseUrl: 'https://api.anthropic.com/v1',
        defaultModel: 'claude-3-5-sonnet-20241022',
        needsKey: true
    },
    chutes: {
        name: 'Chutes AI',
        baseUrl: 'https://llm.chutes.ai/v1',
        defaultModel: 'deepseek-ai/DeepSeek-V3',
        needsKey: true
    },
    kobold: {
        name: 'Kobold AI (Local)',
        baseUrl: 'http://localhost:5001',
        defaultModel: '',
        needsKey: false
    },
    custom: {
        name: 'Custom',
        baseUrl: '',
        defaultModel: '',
        needsKey: true
    }
};

/** Default generation settings */
export const DEFAULT_GENERATION_SETTINGS: GenerationSettings = {
    temperature: 0.9,
    maxTokens: 1024,
    topP: 1.0
};
