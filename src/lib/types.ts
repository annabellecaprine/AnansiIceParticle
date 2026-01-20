/**
 * Anansi Ice Particle - Core Type Definitions
 * All interfaces defined BEFORE implementation
 */

// ============================================
// EMOTION & EXPRESSION TYPES
// ============================================

/** Supported emotion tags from AURA */
export type EmotionTag =
    | 'joy'
    | 'anger'
    | 'fear'
    | 'sadness'
    | 'neutral'
    | 'flirty'
    | 'surprise'
    | 'disgust';

/** Sprite configuration for an actor */
export interface SpriteConfig {
    /** Base full-body sprite (optional) */
    base?: string;
    /** Expression-specific sprites */
    expressions: Partial<Record<EmotionTag, string>>;
}

// ============================================
// ACTOR TYPES
// ============================================

/** Actor data from Anansi */
export interface Actor {
    id: string;
    name: string;
    sprites?: SpriteConfig;
}

// ============================================
// CHARACTER CARD (V2)
// ============================================

/** Character Card v2 format */
export interface CharacterCard {
    name: string;
    persona: string;
    scenario: string;
    firstMessage: string;
    exampleDialogues?: string[];
    systemPrompt?: string;
    creatorNotes?: string;
}

// ============================================
// LOREBOOK TYPES
// ============================================

/** Single lorebook entry */
export interface LorebookEntry {
    id: string;
    title: string;
    content: string;
    keywords: string[];
    enabled: boolean;
    /** Gates (optional) */
    requireAny?: string[];
    requireAll?: string[];
    blockAny?: string[];
}

/** Lorebook collection */
export interface Lorebook {
    name: string;
    entries: LorebookEntry[];
}

// ============================================
// BUNDLE/CARTRIDGE TYPES
// ============================================

/** Features flags in manifest */
export interface ManifestFeatures {
    hasCustomSprites: boolean;
    hasBackgrounds: boolean;
    emotionDetection: boolean;
}

/** Default scene configuration */
export interface DefaultScene {
    background?: string;
    characters: string[];
}

/** .glass bundle manifest */
export interface GlassManifest {
    version: "1.0";
    title: string;
    author?: string;
    exportedFrom: string;
    createdAt: string;
    features: ManifestFeatures;
    defaultScene?: DefaultScene;
}

// ============================================
// SCENE TYPES
// ============================================

/** Character position in scene */
export type CharacterPosition = 'left' | 'center' | 'right';

/** Scene transition effect */
export type TransitionEffect = 'fade' | 'slide' | 'instant';

/** Character placement in a scene */
export interface CharacterPlacement {
    actorId: string;
    position: CharacterPosition;
    expression: EmotionTag;
}

/** Full scene state */
export interface Scene {
    background?: string;
    midground?: string;
    characters: CharacterPlacement[];
    transition?: TransitionEffect;
}

// ============================================
// CHAT TYPES
// ============================================

/** Message role */
export type MessageRole = 'user' | 'assistant' | 'system';

/** Chat message */
export interface ChatMessage {
    id: string;
    role: MessageRole;
    content: string;
    timestamp: number;
    /** Detected emotions (if any) */
    emotions?: EmotionTag[];
    /** Speaker actor ID (for assistant messages) */
    speakerId?: string;
}

// ============================================
// EVENT BUS TYPES
// ============================================

/** Event map for strongly-typed event bus */
export interface EventMap {
    'cartridge:loaded': { manifest: GlassManifest };
    'chat:message': { message: ChatMessage };
    'emotion:detected': { actorId: string; emotion: EmotionTag };
    'scene:changed': Scene;
    'lorebook:imported': { lorebook: Lorebook };
}
