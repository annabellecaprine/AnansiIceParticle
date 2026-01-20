import type { LLMConfig, LLMProvider } from '../lib/llm-config';
import {
    PROVIDER_PRESETS
} from '../lib/llm-config';
import {
    getConfigs,
    saveConfigs,
    getActiveConfigId,
    setActiveConfigId,
    getGenerationSettings,
    saveGenerationSettings,
    getSystemPrompt,
    saveSystemPrompt,
    DEFAULT_SYSTEM_PROMPT
} from '../lib/llm-service';
import {
    getPersonas,
    savePersonas,
    getActivePersonaId,
    setActivePersonaId,
    PersonaProfile
} from '../lib/persona-service';

let panelElement: HTMLElement | null = null;
let isVisible = false;

/**
 * Initialize the settings panel (render once and hide)
 */
export function initSettingsPanel(): void {
    if (panelElement) return;

    const overlay = document.createElement('div');
    overlay.className = 'settings-panel'; // Changed from modal-overlay to settings-panel
    overlay.innerHTML = `
        <div class="settings-header">
            <h2>⚙️ Settings</h2>
            <button class="btn btn-ghost btn-close" id="btn-close-settings">✕</button>
        </div>
        <div class="settings-body">
            <!-- Tabs -->
            <div class="settings-tabs">
                <button class="tab-btn active" data-tab="llm">LLM Provider</button>
                <button class="tab-btn" data-tab="generation">Generation</button>
                <button class="tab-btn" data-tab="system">System Prompt</button>
                <button class="tab-btn" data-tab="persona">Persona</button>
            </div>

            <!-- LLM Tab -->
            <div class="tab-content" id="tab-llm">
                <div class="config-list" id="config-list">
                    <!-- Configs rendered here -->
                </div>
                <button class="btn btn-ghost btn-sm" id="btn-add-config" style="margin-top: 12px;">
                    + Add Configuration
                </button>
            </div>

            <!-- Generation Tab -->
            <div class="tab-content hidden" id="tab-generation">
                <div class="form-group">
                    <label>Temperature</label>
                    <div class="slider-row">
                        <input type="range" id="setting-temp" min="0" max="2" step="0.1" />
                        <span id="setting-temp-val">0.7</span>
                    </div>
                </div>
                <div class="form-group">
                    <label>Max Tokens</label>
                    <div class="slider-row">
                        <input type="range" id="setting-tokens" min="256" max="4096" step="128" />
                        <span id="setting-tokens-val">1024</span>
                    </div>
                </div>
                <div class="form-group">
                    <label>Top P</label>
                    <div class="slider-row">
                        <input type="range" id="setting-topp" min="0" max="1" step="0.05" />
                        <span id="setting-topp-val">0.9</span>
                    </div>
                </div>
            </div>

            <!-- System Prompt Tab -->
            <div class="tab-content hidden" id="tab-system">
                <div class="form-group" style="height: 100%; display: flex; flex-direction: column;">
                    <label>System Prompt</label>
                    <textarea id="setting-system-prompt" class="system-prompt-input" style="flex: 1; min-height: 200px; resize: none; margin-bottom: 8px;"></textarea>
                    <div style="display: flex; justify-content: flex-end;">
                        <button class="btn btn-ghost btn-sm" id="btn-reset-system">Reset to Default</button>
                    </div>
                </div>
            </div>

            <!-- Persona Tab -->
            <div class="tab-content hidden" id="tab-persona">
                <div class="config-list" id="persona-list">
                    <!-- Personas rendered here -->
                </div>
                <button class="btn btn-ghost btn-sm" id="btn-add-persona" style="margin-top: 12px;">
                    + Add Persona
                </button>
            </div>
        </div>
        <div class="settings-footer">
            <button class="btn btn-primary" id="btn-save-settings">Save & Close</button>
        </div>
    `;

    document.body.appendChild(overlay);
    panelElement = overlay;

    // Attach event listeners (only once)
    bindEvents(panelElement);

    // Initial Render
    renderValues();
}

/**
 * Toggle settings panel visibility
 */
export function toggleSettings(): void {
    if (!panelElement) initSettingsPanel();

    isVisible = !isVisible;
    if (isVisible) {
        panelElement?.classList.add('visible');
        renderValues(); // Refresh values on open
    } else {
        panelElement?.classList.remove('visible');
    }
}

function bindEvents(panel: HTMLElement): void {
    // Close button
    panel.querySelector('#btn-close-settings')?.addEventListener('click', () => {
        isVisible = false;
        panel.classList.remove('visible');
    });

    // Tab switching
    panel.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            panel.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const tabId = btn.getAttribute('data-tab');
            panel.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.toggle('hidden', tab.id !== `tab-${tabId}`);
            });
        });
    });

    // Save button
    panel.querySelector('#btn-save-settings')?.addEventListener('click', () => {
        saveAll();
        isVisible = false;
        panel.classList.remove('visible');
    });

    // Add Config
    panel.querySelector('#btn-add-config')?.addEventListener('click', () => {
        const configs = getConfigs();
        const newConfig: LLMConfig = {
            id: crypto.randomUUID(),
            name: `Config ${configs.length + 1}`,
            provider: 'openai',
            model: PROVIDER_PRESETS.openai.defaultModel,
            apiKey: '',
            baseUrl: PROVIDER_PRESETS.openai.baseUrl
        };
        configs.push(newConfig);
        saveConfigs(configs); // Auto-save on add for simplicity in panel mode
        // If no active config, set this one
        if (!getActiveConfigId()) setActiveConfigId(newConfig.id);

        renderConfigList(panel);
    });

    // Add Persona
    panel.querySelector('#btn-add-persona')?.addEventListener('click', () => {
        const personas = getPersonas();
        const newPersona: PersonaProfile = {
            id: crypto.randomUUID(),
            name: `User ${personas.length + 1}`,
            description: 'A new user profile.',
            pronouns: 'they/them',
            avatar: ''
        };
        personas.push(newPersona);
        savePersonas(personas);
        if (!getActivePersonaId()) setActivePersonaId(newPersona.id);
        renderPersonaList(panel);
    });

    // Reset System Prompt
    panel.querySelector('#btn-reset-system')?.addEventListener('click', () => {
        (panel.querySelector('#setting-system-prompt') as HTMLTextAreaElement).value = DEFAULT_SYSTEM_PROMPT;
    });

    // Sliders live update
    const bindSlider = (id: string, valId: string) => {
        const slider = panel.querySelector(`#${id}`) as HTMLInputElement;
        const valSpan = panel.querySelector(`#${valId}`) as HTMLSpanElement;
        slider?.addEventListener('input', () => {
            valSpan.textContent = slider.value;
        });
    };
    bindSlider('setting-temp', 'setting-temp-val');
    bindSlider('setting-tokens', 'setting-tokens-val');
    bindSlider('setting-topp', 'setting-topp-val');
}


function renderValues(): void {
    if (!panelElement) return;

    const genSettings = getGenerationSettings();
    const systemPrompt = getSystemPrompt();

    // Sliders
    (panelElement.querySelector('#setting-temp') as HTMLInputElement).value = String(genSettings.temperature);
    (panelElement.querySelector('#setting-temp-val') as HTMLElement).textContent = String(genSettings.temperature);

    (panelElement.querySelector('#setting-tokens') as HTMLInputElement).value = String(genSettings.maxTokens);
    (panelElement.querySelector('#setting-tokens-val') as HTMLElement).textContent = String(genSettings.maxTokens);

    (panelElement.querySelector('#setting-topp') as HTMLInputElement).value = String(genSettings.topP);
    (panelElement.querySelector('#setting-topp-val') as HTMLElement).textContent = String(genSettings.topP);

    // System Prompt
    (panelElement.querySelector('#setting-system-prompt') as HTMLTextAreaElement).value = systemPrompt;

    // Config List
    renderConfigList(panelElement);

    // Persona List
    renderPersonaList(panelElement);
}

function renderConfigList(panel: HTMLElement): void {
    const list = panel.querySelector('#config-list') as HTMLElement;
    const configs = getConfigs();
    const activeId = getActiveConfigId();

    if (configs.length === 0) {
        list.innerHTML = '<div class="empty-text">No configurations. Add one.</div>';
        return;
    }

    list.innerHTML = configs.map((cfg, index) => `
        <div class="config-item ${cfg.id === activeId ? 'active' : ''}" data-id="${cfg.id}">
            <div class="config-item-header">
                <input type="radio" name="active-config" ${cfg.id === activeId ? 'checked' : ''} data-id="${cfg.id}" />
                <input type="text" class="config-name" value="${cfg.name}" data-index="${index}" />
                <button class="btn btn-ghost btn-sm btn-delete" data-index="${index}">🗑️</button>
            </div>
            <div class="config-item-body">
                <div class="form-group">
                    <label>Provider</label>
                    <select class="config-provider" data-index="${index}">
                        ${Object.entries(PROVIDER_PRESETS).map(([key, preset]) =>
        `<option value="${key}" ${cfg.provider === key ? 'selected' : ''}>${preset.name}</option>`
    ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Model</label>
                    <input type="text" class="config-model" value="${cfg.model}" data-index="${index}" />
                </div>
                <div class="form-group">
                    <label>API Key</label>
                    <input type="password" class="config-key" value="${cfg.apiKey}" data-index="${index}" />
                </div>
                <div class="form-group ${cfg.provider === 'custom' || cfg.provider === 'kobold' ? '' : 'hidden'}">
                    <label>Base URL</label>
                    <input type="text" class="config-url" value="${cfg.baseUrl}" data-index="${index}" />
                </div>
            </div>
        </div>
    `).join('');

    list.querySelectorAll('input, select').forEach(el => {
        el.addEventListener('change', (e) => {
            if ((e.target as HTMLElement).getAttribute('name') === 'active-config') {
                list.querySelectorAll('.config-item').forEach(item => item.classList.remove('active'));
                (e.target as HTMLElement).closest('.config-item')?.classList.add('active');
            }
        });
    });

    list.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt((e.target as HTMLButtonElement).dataset.index || '0');
            const currentConfigs = getConfigs();
            currentConfigs.splice(idx, 1);
            saveConfigs(currentConfigs);
            renderConfigList(panel);
        });
    });
}

function renderPersonaList(panel: HTMLElement): void {
    const list = panel.querySelector('#persona-list') as HTMLElement;
    const personas = getPersonas();
    const activeId = getActivePersonaId();

    if (personas.length === 0) {
        list.innerHTML = '<div class="empty-text">No personas. Add one.</div>';
        return;
    }

    list.innerHTML = personas.map((p, index) => `
        <div class="config-item ${p.id === activeId ? 'active' : ''}" data-id="${p.id}">
            <div class="config-item-header">
                <input type="radio" name="active-persona" ${p.id === activeId ? 'checked' : ''} data-id="${p.id}" />
                <input type="text" class="persona-name" value="${p.name}" data-index="${index}" placeholder="Name" />
                <button class="btn btn-ghost btn-sm btn-delete-persona" data-index="${index}">🗑️</button>
            </div>
            <div class="config-item-body">
                <div class="form-group">
                    <label>Description</label>
                    <textarea class="persona-desc" data-index="${index}" rows="2" style="resize:none;">${p.description}</textarea>
                </div>
                <div class="form-group">
                    <label>Pronouns</label>
                    <input type="text" class="persona-pronouns" value="${p.pronouns}" data-index="${index}" placeholder="e.g. she/her" />
                </div>
                <div class="form-group">
                    <label>Avatar URL</label>
                    <input type="text" class="persona-avatar" value="${p.avatar || ''}" data-index="${index}" placeholder="https://..." />
                </div>
            </div>
        </div>
    `).join('');

    // Bind Persona List Events

    // Auto-save input changes
    const savePersonasFromDOM = () => {
        const displayedItems = list.querySelectorAll('.config-item');
        const updatedAPI: PersonaProfile[] = [];
        let newActive = getActivePersonaId();

        displayedItems.forEach(item => {
            const id = (item as HTMLElement).dataset.id!;
            const name = (item.querySelector('.persona-name') as HTMLInputElement).value;
            const description = (item.querySelector('.persona-desc') as HTMLTextAreaElement).value;
            const pronouns = (item.querySelector('.persona-pronouns') as HTMLInputElement).value;
            const avatar = (item.querySelector('.persona-avatar') as HTMLInputElement).value;

            if ((item.querySelector('input[name="active-persona"]') as HTMLInputElement).checked) {
                newActive = id;
            }
            updatedAPI.push({ id, name, description, pronouns, avatar });
        });
        savePersonas(updatedAPI);
        setActivePersonaId(newActive);
    };

    list.querySelectorAll('input, textarea').forEach(el => {
        el.addEventListener('change', (e) => {
            const elHtml = e.target as HTMLElement;
            if (elHtml.getAttribute('name') === 'active-persona') {
                list.querySelectorAll('.config-item').forEach(item => item.classList.remove('active'));
                elHtml.closest('.config-item')?.classList.add('active');
            }
            savePersonasFromDOM();
        });
    });

    list.querySelectorAll('.btn-delete-persona').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt((e.target as HTMLButtonElement).dataset.index || '0');
            const current = getPersonas();
            current.splice(idx, 1);
            savePersonas(current);
            renderPersonaList(panel);
        });
    });
}

function saveAll(): void {
    if (!panelElement) return;

    // 1. Gather all configs from DOM
    const list = panelElement.querySelector('#config-list') as HTMLElement;
    const configItems = list.querySelectorAll('.config-item');
    const newConfigs: LLMConfig[] = [];
    let newActiveId = getActiveConfigId();

    configItems.forEach((item) => {
        const id = (item as HTMLElement).dataset.id!;
        const name = (item.querySelector('.config-name') as HTMLInputElement).value;
        const provider = (item.querySelector('.config-provider') as HTMLSelectElement).value as LLMProvider;
        const model = (item.querySelector('.config-model') as HTMLInputElement).value;
        const apiKey = (item.querySelector('.config-key') as HTMLInputElement).value;
        const baseUrl = (item.querySelector('.config-url') as HTMLInputElement).value;
        const isActive = (item.querySelector('input[name="active-config"]') as HTMLInputElement).checked;

        if (isActive) newActiveId = id;

        newConfigs.push({
            id, name, provider, model, apiKey, baseUrl
        });
    });

    saveConfigs(newConfigs);
    setActiveConfigId(newActiveId);

    // 2. Gather Generation Settings
    const temp = parseFloat((panelElement.querySelector('#setting-temp') as HTMLInputElement).value);
    const tokens = parseInt((panelElement.querySelector('#setting-tokens') as HTMLInputElement).value);
    const topP = parseFloat((panelElement.querySelector('#setting-topp') as HTMLInputElement).value);
    saveGenerationSettings({ temperature: temp, maxTokens: tokens, topP });

    // 3. Gather System Prompt
    const prompt = (panelElement.querySelector('#setting-system-prompt') as HTMLTextAreaElement).value;
    saveSystemPrompt(prompt);

    // 4. Gather Personas (Redundant loop but safer if not auto-saved)
    const pList = panelElement!.querySelector('#persona-list') as HTMLElement;
    if (pList) {
        const pItems = pList.querySelectorAll('.config-item');
        const newPersonas: PersonaProfile[] = [];
        let newActiveP = getActivePersonaId();

        pItems.forEach(item => {
            const id = (item as HTMLElement).dataset.id!;
            const name = (item.querySelector('.persona-name') as HTMLInputElement).value;
            const description = (item.querySelector('.persona-desc') as HTMLTextAreaElement).value;
            const pronouns = (item.querySelector('.persona-pronouns') as HTMLInputElement).value;
            const avatar = (item.querySelector('.persona-avatar') as HTMLInputElement).value;
            const isActive = (item.querySelector('input[name="active-persona"]') as HTMLInputElement).checked;

            if (isActive) newActiveP = id;

            newPersonas.push({ id, name, description, pronouns, avatar });
        });
        savePersonas(newPersonas);
        setActivePersonaId(newActiveP);
    }

    console.log('[IceParticle] Settings Saved');
}
