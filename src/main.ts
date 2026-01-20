/**
 * Anansi Ice Particle - Main Entry Point
 */

import { store } from './lib/store';
import { events } from './lib/events';
import type { ChatMessage, EmotionTag } from './lib/types';

// ============================================
// DOM REFERENCES
// ============================================

const chatMessages = document.getElementById('chat-messages') as HTMLDivElement;
const chatInput = document.getElementById('chat-input') as HTMLTextAreaElement;
const btnSend = document.getElementById('btn-send') as HTMLButtonElement;
const btnLoadCartridge = document.getElementById('btn-load-cartridge') as HTMLButtonElement;
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
function renderScene(): void {
  const state = store.get();
  const scene = state.scene;

  // Background
  if (scene.background) {
    layerBg.innerHTML = `<img src="${scene.background}" alt="Background" />`;
  } else {
    layerBg.innerHTML = '<div class="empty-scene-text">No scene loaded</div>';
  }

  // Characters
  layerCharacters.innerHTML = '';
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

// ============================================
// EVENT HANDLERS
// ============================================

/**
 * Handle send message
 */
function handleSend(): void {
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

  // TODO: Send to LLM and get response
  // For now, add a mock response
  setTimeout(() => {
    const emotions: EmotionTag[] = ['joy', 'neutral', 'flirty'];
    const mockResponse: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `This is a placeholder response. LLM integration coming soon!`,
      timestamp: Date.now(),
      emotions: [emotions[Math.floor(Math.random() * emotions.length)]]
    };
    store.addMessage(mockResponse);
  }, 500);
}

/**
 * Handle load cartridge button
 */
function handleLoadCartridge(): void {
  // TODO: Open file dialog via Tauri
  console.log('[IceParticle] Load cartridge clicked');

  // Test: Load assets from test folder
  store.set({
    isLoaded: true,
    character: {
      name: 'Fox',
      persona: 'A curious fox roommate',
      scenario: 'In a cozy dorm room',
      firstMessage: 'Oh! You\'re finally here! I was just getting settled in. What do you think of our new room?'
    },
    actors: {
      'fox': {
        id: 'fox',
        name: 'Fox',
        sprites: {
          base: '/src/assets/test/fox.png',
          expressions: {
            joy: '/src/assets/test/fox.png',
            neutral: '/src/assets/test/fox.png'
          }
        }
      },
      'wolf': {
        id: 'wolf',
        name: 'Wolf',
        sprites: {
          base: '/src/assets/test/wolf.png',
          expressions: {
            neutral: '/src/assets/test/wolf.png'
          }
        }
      }
    }
  });

  // Add first message
  const firstMessage: ChatMessage = {
    id: crypto.randomUUID(),
    role: 'assistant',
    content: store.get().character?.firstMessage || 'Hello!',
    timestamp: Date.now(),
    emotions: ['joy']
  };
  store.addMessage(firstMessage);

  // Set scene with background and characters (both Fox and Wolf)
  store.setScene({
    background: '/src/assets/test/background.png',
    characters: [
      { actorId: 'fox', position: 'left', expression: 'joy' },
      { actorId: 'wolf', position: 'right', expression: 'neutral' }
    ]
  });
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

  // Bind events
  btnSend.addEventListener('click', handleSend);
  btnLoadCartridge.addEventListener('click', handleLoadCartridge);

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
