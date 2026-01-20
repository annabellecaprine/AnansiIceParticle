/**
 * Anansi Ice Particle - Application State Store
 * Centralized state management
 */

import type {
    GlassManifest,
    CharacterCard,
    Lorebook,
    Scene,
    ChatMessage,
    Actor,
    Cartridge,
    PersonaProfile
} from './types';
import { events } from './events';

/** Application state */
interface AppState {
    /** Loaded cartridge manifest */
    manifest: GlassManifest | null;
    /** Active Cartridge Data */
    cartridge: Cartridge | null;
    /** Character card data */
    character: CharacterCard | null;
    /** Active User Persona */
    userPersona: PersonaProfile | null;
    /** All loaded lorebooks */
    lorebooks: Lorebook[];
    /** Actor data */
    actors: Record<string, Actor>;
    /** Current scene state */
    scene: Scene;
    /** Chat history */
    messages: ChatMessage[];
    /** Is cartridge loaded */
    isLoaded: boolean;
}

/** Create initial state */
function createInitialState(): AppState {
    return {
        manifest: null,
        cartridge: null,
        character: null,
        userPersona: null,
        lorebooks: [],
        actors: {},
        scene: {
            background: undefined,
            characters: []
        },
        messages: [],
        isLoaded: false
    };
}

class Store {
    private state: AppState = createInitialState();
    private subscribers: Set<(state: AppState) => void> = new Set();

    /**
     * Get current state (immutable copy)
     */
    get(): Readonly<AppState> {
        return this.state;
    }

    /**
     * Update state and notify subscribers
     */
    set(updates: Partial<AppState>): void {
        this.state = { ...this.state, ...updates };
        this.notify();
    }

    /**
     * Subscribe to state changes
     * @returns Unsubscribe function
     */
    subscribe(callback: (state: AppState) => void): () => void {
        this.subscribers.add(callback);
        // Immediately call with current state
        callback(this.state);
        return () => this.subscribers.delete(callback);
    }

    /**
     * Notify all subscribers
     */
    private notify(): void {
        this.subscribers.forEach(cb => cb(this.state));
    }

    /**
     * Reset to initial state
     */
    reset(): void {
        this.state = createInitialState();
        this.notify();
    }

    // ============================================
    // CONVENIENCE METHODS
    // ============================================

    /**
     * Add a chat message
     */
    addMessage(message: ChatMessage): void {
        this.state.messages = [...this.state.messages, message];
        this.notify();
        events.emit('chat:message', { message });
    }

    /**
     * Update current scene
     */
    setScene(scene: Partial<Scene>): void {
        this.state.scene = { ...this.state.scene, ...scene };
        this.notify();
        events.emit('scene:changed', this.state.scene);
    }

    /**
     * Load a lorebook
     */
    addLorebook(lorebook: Lorebook): void {
        this.state.lorebooks = [...this.state.lorebooks, lorebook];
        this.notify();
        events.emit('lorebook:imported', { lorebook });
    }
}

// Singleton export
export const store = new Store();
