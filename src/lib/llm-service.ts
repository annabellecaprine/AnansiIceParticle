/**
 * Anansi Ice Particle - LLM Service
 * Ported from Anansi's llm.js
 */

import type { LLMConfig, GenerationSettings } from './llm-config';
import { PROVIDER_PRESETS, DEFAULT_GENERATION_SETTINGS } from './llm-config';

/** Storage keys */
const STORAGE_KEYS = {
    configs: 'iceparticle_llm_configs',
    activeConfig: 'iceparticle_active_config_id',
    genSettings: 'iceparticle_gen_settings',
    systemPrompt: 'iceparticle_system_prompt'
};

/** Default System Prompt */
export const DEFAULT_SYSTEM_PROMPT = `You are a helpful roleplay assistant in a visual novel context. 
Your goal is to embody the characters and narrate the scene vividly.
Stay in character at all times.`;

/** Message format for chat */
interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

// ... (existing functions)

/**
 * Get stored System Prompt
 */
export function getSystemPrompt(): string {
    return localStorage.getItem(STORAGE_KEYS.systemPrompt) || DEFAULT_SYSTEM_PROMPT;
}

/**
 * Save System Prompt
 */
export function saveSystemPrompt(prompt: string): void {
    localStorage.setItem(STORAGE_KEYS.systemPrompt, prompt);
}

/**
 * Reset System Prompt to default
 */
export function resetSystemPrompt(): void {
    localStorage.setItem(STORAGE_KEYS.systemPrompt, DEFAULT_SYSTEM_PROMPT);
}

/**
 * Get stored LLM configurations
 */
export function getConfigs(): LLMConfig[] {
    const stored = localStorage.getItem(STORAGE_KEYS.configs);
    return stored ? JSON.parse(stored) : [];
}

/**
 * Save LLM configurations
 */
export function saveConfigs(configs: LLMConfig[]): void {
    localStorage.setItem(STORAGE_KEYS.configs, JSON.stringify(configs));
}

/**
 * Get active configuration ID
 */
export function getActiveConfigId(): string {
    return localStorage.getItem(STORAGE_KEYS.activeConfig) || '';
}

/**
 * Set active configuration ID
 */
export function setActiveConfigId(id: string): void {
    localStorage.setItem(STORAGE_KEYS.activeConfig, id);
}

/**
 * Get active LLM configuration
 */
export function getActiveConfig(): LLMConfig | null {
    const configs = getConfigs();
    const activeId = getActiveConfigId();
    return configs.find(c => c.id === activeId) || configs[0] || null;
}

/**
 * Get generation settings
 */
export function getGenerationSettings(): GenerationSettings {
    const stored = localStorage.getItem(STORAGE_KEYS.genSettings);
    return stored ? JSON.parse(stored) : DEFAULT_GENERATION_SETTINGS;
}

/**
 * Save generation settings
 */
export function saveGenerationSettings(settings: GenerationSettings): void {
    localStorage.setItem(STORAGE_KEYS.genSettings, JSON.stringify(settings));
}

/**
 * Generate a response from the LLM
 * @param system System instruction
 * @param history Array of messages
 * @param overrideConfig Optional config overrides
 */
export async function generate(
    system: string,
    history: ChatMessage[],
    overrideConfig: Partial<LLMConfig> = {}
): Promise<string> {
    const activeConfig = getActiveConfig();
    if (!activeConfig && !overrideConfig.provider) {
        throw new Error('No LLM configuration found. Please configure in Settings.');
    }

    const config = { ...activeConfig, ...overrideConfig } as LLMConfig;
    const genSettings = getGenerationSettings();
    const { provider, model, apiKey, baseUrl } = config;

    // Check for key (except local providers)
    if (!apiKey && provider !== 'kobold') {
        throw new Error(`Missing API Key for ${PROVIDER_PRESETS[provider]?.name || provider}. Please configure in Settings.`);
    }

    // --- Providers ---

    if (provider === 'gemini') {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const contents = history.map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
        }));

        const body: Record<string, unknown> = {
            contents,
            generationConfig: {
                temperature: genSettings.temperature,
                maxOutputTokens: genSettings.maxTokens
            }
        };

        if (system) {
            body.systemInstruction = { parts: [{ text: system }] };
        }

        const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!resp.ok) {
            const err = await resp.json();
            throw new Error(err.error?.message || resp.statusText);
        }

        const data = await resp.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "(No response)";
    }

    if (provider === 'openai' || provider === 'openrouter' || provider === 'chutes' || provider === 'custom') {
        let url = 'https://api.openai.com/v1/chat/completions';
        if (provider === 'openrouter') url = 'https://openrouter.ai/api/v1/chat/completions';
        if (provider === 'chutes') url = 'https://llm.chutes.ai/v1/chat/completions';
        if (provider === 'custom') {
            const cleanBaseUrl = (baseUrl || 'https://api.example.com/v1').replace(/\/$/, '');
            url = `${cleanBaseUrl}/chat/completions`;
        }

        const messages = [
            { role: 'system', content: system },
            ...history.map(m => ({
                role: m.role === 'assistant' ? 'assistant' : 'user',
                content: m.content
            }))
        ];

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        };

        if (provider === 'openrouter') {
            headers['HTTP-Referer'] = 'https://iceparticle.app';
            headers['X-Title'] = 'IceParticle';
        }

        const resp = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                model,
                messages,
                temperature: genSettings.temperature,
                max_tokens: genSettings.maxTokens
            })
        });

        if (!resp.ok) {
            const err = await resp.json();
            throw new Error(err.error?.message || resp.statusText);
        }

        const data = await resp.json();
        let content = data.choices?.[0]?.message?.content || "";
        const reasoning = data.choices?.[0]?.message?.reasoning_content;
        if (reasoning) {
            content = `<think>${reasoning}</think>\n${content}`;
        }
        return content || "(No response)";
    }

    if (provider === 'anthropic') {
        const url = 'https://api.anthropic.com/v1/messages';

        const messages = history.map(m => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content
        }));

        const resp = await fetch(url, {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
                'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: JSON.stringify({
                model,
                max_tokens: genSettings.maxTokens,
                system,
                messages,
                temperature: genSettings.temperature
            })
        });

        if (!resp.ok) {
            const err = await resp.json();
            throw new Error(err.error?.message || resp.statusText);
        }

        const data = await resp.json();
        return data.content?.[0]?.text || "(No response)";
    }

    if (provider === 'kobold') {
        const cleanBaseUrl = (baseUrl || 'http://localhost:5001').replace(/\/$/, '');
        const url = `${cleanBaseUrl}/api/v1/generate`;

        const fullPrompt = `${system}\n\n${history.map(m =>
            `${m.role === 'user' ? 'User' : 'Character'}: ${m.content}`
        ).join('\n')}`;

        const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: fullPrompt,
                max_context_length: 4096,
                max_length: genSettings.maxTokens,
                temperature: genSettings.temperature
            })
        });

        if (!resp.ok) {
            const errText = await resp.text();
            throw new Error(`Kobold Error: ${errText || resp.statusText}`);
        }

        const data = await resp.json();
        return data.results?.[0]?.text || "(No response)";
    }

    throw new Error(`Unknown provider: ${provider}`);
}
