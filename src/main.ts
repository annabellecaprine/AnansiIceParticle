/**
 * Anansi Ice Particle - Main Entry Point
 */

import { store } from './lib/store';
import { events } from './lib/events';
import { toggleSettings, initSettingsPanel } from './components/SettingsPanel';
import { getActivePersona } from './lib/persona-service';
import type { ChatMessage, EmotionTag } from './lib/types';

// ============================================
// DOM REFERENCES
// ============================================

const chatMessages = document.getElementById('chat-messages') as HTMLDivElement;
const chatInput = document.getElementById('chat-input') as HTMLTextAreaElement;
const btnSend = document.getElementById('btn-send') as HTMLButtonElement;
const btnLoadCartridge = document.getElementById('btn-load-cartridge') as HTMLButtonElement;
const btnSettings = document.getElementById('btn-settings') as HTMLButtonElement;
const layerBg = document.getElementById('layer-bg') as HTMLDivElement;
const layerCharacters = document.getElementById('layer-characters') as HTMLDivElement;

// ============================================
// UI RENDERING
// ============================================

/**
 * Render a single chat message
 */
function renderMessage(message: ChatMessage): HTMLElement {
  const div = document.createElement('div');
  div.className = `chat-message ${message.role}`;

  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.textContent = message.role === 'user' ? '👤' : getEmotionEmoji(message.emotions?.[0]);

  const content = document.createElement('div');
  content.className = 'message-content';

  const speaker = document.createElement('div');
  speaker.className = 'message-speaker';
  speaker.textContent = message.role === 'user' ? 'You' : (store.get().character?.name || 'Assistant');

  const text = document.createElement('div');
  text.className = 'message-text';
  text.textContent = message.content;

  content.appendChild(speaker);
  content.appendChild(text);
  div.appendChild(avatar);
  div.appendChild(content);

  return div;
}

/**
 * Map emotion to emoji for avatar
 */
function getEmotionEmoji(emotion?: EmotionTag): string {
  const map: Record<EmotionTag, string> = {
    joy: '😊',
    anger: '😠',
    fear: '😨',
    sadness: '😢',
    neutral: '😐',
    flirty: '😏',
    surprise: '😲',
    disgust: '🤢'
  };
  return emotion ? map[emotion] : '😐';
}

/**
 * Render all chat messages
 */
function renderChat(): void {
  const state = store.get();

  if (state.messages.length === 0) {
    chatMessages.innerHTML = `
            <div class="empty-chat-text">
                <div class="empty-icon">💬</div>
                <div>Load a cartridge to begin</div>
            </div>
        `;
    return;
  }

  chatMessages.innerHTML = '';
  state.messages.forEach(msg => {
    chatMessages.appendChild(renderMessage(msg));
  });

  // Scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Render scene with background and characters
 */
/**
 * Render scene with background and characters
 */
function renderScene(): void {
  const state = store.get();
  const scene = state.scene;

  // Background
  if (state.isGalleryMode && state.cartridge?.assets.gallery.length) {
    // Gallery Mode
    const url = state.cartridge.assets.gallery[state.galleryIndex];
    layerBg.innerHTML = `<img src="${url}" alt="Gallery Image" style="object-fit: contain; width: 100%; height: 100%;" />`;

    // Update controls visibility
    const galleryControls = document.getElementById('gallery-controls');
    if (galleryControls) {
      galleryControls.style.display = 'flex';
      const counter = document.getElementById('gallery-counter');
      if (counter) {
        counter.textContent = `${state.galleryIndex + 1} / ${state.cartridge.assets.gallery.length}`;
      }
    }
  } else {
    // Normal Mode
    const galleryControls = document.getElementById('gallery-controls');
    if (galleryControls) galleryControls.style.display = 'none';

    if (scene.background) {
      layerBg.innerHTML = `<img src="${scene.background}" alt="Background" />`;
    } else {
      layerBg.innerHTML = '<div class="empty-scene-text">No scene loaded</div>';
    }
  }

  // Characters (only if not in gallery mode, or overlay?)
  // For now, hide characters in Gallery Mode
  layerCharacters.innerHTML = '';
  if (!state.isGalleryMode) {
    scene.characters.forEach(placement => {
      const actor = state.actors[placement.actorId];
      if (!actor) return;

      // Render character sprite
      const charEl = document.createElement('div');
      charEl.className = `character-sprite position-${placement.position}`;

      // Check for actor sprite, fallback to emoji
      const spriteUrl = actor.sprites?.expressions?.[placement.expression]
        || actor.sprites?.base
        || null;

      if (spriteUrl) {
        charEl.innerHTML = `<img src="${spriteUrl}" alt="${actor.name}" />`;
      } else {
        charEl.innerHTML = `
                <div style="font-size: 64px; text-align: center;">
                    ${getEmotionEmoji(placement.expression)}
                    <div style="font-size: 14px; margin-top: 8px;">${actor.name}</div>
                </div>
            `;
      }
      layerCharacters.appendChild(charEl);
    });
  }
}

// ============================================
// EVENT HANDLERS
// ============================================

/**
 * Handle send message
 */
import { generate, getSystemPrompt } from './lib/llm-service';

// ... (existing imports/code)

/**
 * Handle send message
 */
async function handleSend(): Promise<void> {
  const content = chatInput.value.trim();
  if (!content) return;

  // Create user message
  const userMessage: ChatMessage = {
    id: crypto.randomUUID(),
    role: 'user',
    content,
    timestamp: Date.now()
  };

  store.addMessage(userMessage);
  chatInput.value = '';

  // Get conversation history (map to {role, content})
  const history = store.get().messages.map(m => ({
    role: m.role,
    content: m.content
  }));

  // Add Assistant placeholder
  const placeholderId = crypto.randomUUID();
  store.addMessage({
    id: placeholderId,
    role: 'assistant',
    content: '...',
    timestamp: Date.now(),
    emotions: ['neutral']
  });

  try {
    const systemPrompt = getSystemPrompt();
    const responseText = await generate(systemPrompt, history);

    // Update placeholder with real response
    // Identify emotion (mock for now, or use AURA later)
    // TODO: AURA integration for emotion detection
    const emotions: EmotionTag[] = ['neutral'];

    // Replace placeholder in store
    const messages = store.get().messages.map(m => {
      if (m.id === placeholderId) {
        return {
          ...m,
          content: responseText,
          emotions
        } as ChatMessage;
      }
      return m;
    });

    store.set({ messages });

  } catch (error) {
    console.error('[IceParticle] Generation Error:', error);

    // Update placeholder with error
    const messages = store.get().messages.map(m => {
      if (m.id === placeholderId) {
        return {
          ...m,
          content: `Error: ${error instanceof Error ? error.message : String(error)}`,
          emotions: ['sadness'] as EmotionTag[]
        } as ChatMessage;
      }
      return m;
    });
    store.set({ messages });
  }
}

/**
 * Handle load cartridge button
 */
import { loadGlassFile } from './lib/glass-loader';
import type { Actor, SpriteConfig } from './lib/types';

// ... (existing imports)

/**
 * Handle load cartridge button
 */
function handleLoadCartridge(): void {
  // Create hidden input
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.glass,.zip'; // Accept .zip for easier testing

  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    try {
      console.log('[IceParticle] Loading:', file.name);
      const cartridge = await loadGlassFile(file);

      console.log('[IceParticle] Loaded:', cartridge);

      // 1. Construct Actors from Sprites
      const newActors: Record<string, Actor> = {};

      // If we have a character card, ensure it exists as an actor
      const charName = cartridge.character?.name || 'Unknown';
      const charId = charName.toLowerCase().replace(/\s+/g, '_');

      // Auto-detect actors from sprite folders
      Object.entries(cartridge.assets.sprites).forEach(([actorId, expressions]) => {
        const config: SpriteConfig = {
          expressions: expressions as Record<string, string>,
          base: Object.values(expressions)[0] // Default to first sprite
        };

        newActors[actorId] = {
          id: actorId,
          name: actorId === charId ? charName : (actorId.charAt(0).toUpperCase() + actorId.slice(1)),
          sprites: config
        };
      });

      // 2. Determine Scene
      // Pick first background
      const bgNames = Object.keys(cartridge.assets.backgrounds);
      const firstBg = bgNames.length > 0 ? cartridge.assets.backgrounds[bgNames[0]] : undefined;

      // Gallery Mode Check
      if (!firstBg && cartridge.assets.gallery.length > 0) {
        console.log('[IceParticle] Gallery Mode Active');
        store.set({
          isGalleryMode: true,
          galleryIndex: 0,
          manifest: cartridge.manifest,
          cartridge: cartridge,
          character: cartridge.character || null,
          actors: newActors,
          messages: []
        });

        // Render manually or wait for subscription
        return; // Skip normal scene setup
      } else {

        // Normal Scene
        store.setScene({
          background: firstBg,
          characters: [] // Start empty, or add main char?
        });
      }

      // 3. Update Store
      store.set({
        isLoaded: true,
        manifest: cartridge.manifest,
        cartridge: cartridge,
        character: cartridge.character || null,
        actors: newActors,
        messages: [] // Clear chat
      });

      // 4. Initial Greeting
      if (cartridge.character?.firstMessage) {
        store.addMessage({
          id: crypto.randomUUID(),
          role: 'assistant',
          content: cartridge.character.firstMessage,
          timestamp: Date.now(),
          speakerId: charId // Try to link to actor
        });

        // If we have sprites for this char, show them?
        if (newActors[charId]) {
          store.setScene({
            characters: [{ actorId: charId, position: 'center', expression: 'neutral' }]
          });
        }
      }

    } catch (err) {
      console.error('[IceParticle] Load Failed:', err);
      alert('Failed to load cartridge: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  input.click();
}

/**
 * Toggle between single and multi-character scene (for testing)
 */
function toggleMultiCharacter(): void {
  const state = store.get();
  const currentCount = state.scene.characters.length;

  if (currentCount === 1) {
    // Add wolf
    store.setScene({
      characters: [
        { actorId: 'fox', position: 'left', expression: 'joy' },
        { actorId: 'wolf', position: 'right', expression: 'neutral' }
      ]
    });
    console.log('[IceParticle] Scene: Two characters');
  } else {
    // Single character centered
    store.setScene({
      characters: [
        { actorId: 'fox', position: 'center', expression: 'joy' }
      ]
    });
    console.log('[IceParticle] Scene: Single character');
  }
}

// ============================================
// INITIALIZATION
// ============================================

function init(): void {
  console.log('[IceParticle] Initializing...');

  // Subscribe to store changes
  store.subscribe(() => {
    renderChat();
    renderScene();
  });

  // Load initial persona
  store.set({ userPersona: getActivePersona() });

  // Bind events
  btnSend.addEventListener('click', handleSend);
  btnLoadCartridge.addEventListener('click', handleLoadCartridge);
  btnSettings?.addEventListener('click', () => {
    toggleSettings();
  });

  // Initialize Settings Panel for side-loading
  initSettingsPanel();

  // Gallery Navigation
  document.getElementById('btn-gallery-prev')?.addEventListener('click', () => {
    const state = store.get();
    if (!state.isGalleryMode || !state.cartridge?.assets.gallery.length) return;

    let newIndex = state.galleryIndex - 1;
    if (newIndex < 0) newIndex = state.cartridge.assets.gallery.length - 1;
    store.set({ galleryIndex: newIndex });
  });

  document.getElementById('btn-gallery-next')?.addEventListener('click', () => {
    const state = store.get();
    if (!state.isGalleryMode || !state.cartridge?.assets.gallery.length) return;

    let newIndex = state.galleryIndex + 1;
    if (newIndex >= state.cartridge.assets.gallery.length) newIndex = 0;
    store.set({ galleryIndex: newIndex });
  });

  // Send on Enter (Shift+Enter for newline)
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  // Event bus listeners
  events.on('chat:message', ({ message }) => {
    console.log('[IceParticle] New message:', message.role);
  });

  events.on('emotion:detected', ({ actorId, emotion }) => {
    console.log('[IceParticle] Emotion detected:', actorId, emotion);
    // Update character expression in scene
    const state = store.get();
    const characters = state.scene.characters.map(c =>
      c.actorId === actorId ? { ...c, expression: emotion } : c
    );
    store.setScene({ characters });
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // T = Toggle multi-character scene
    if (e.key === 't' && !e.ctrlKey && !e.altKey && document.activeElement !== chatInput) {
      toggleMultiCharacter();
    }
  });

  console.log('[IceParticle] Ready! (Press T to toggle multi-character scene)');
}

// Start
init();
