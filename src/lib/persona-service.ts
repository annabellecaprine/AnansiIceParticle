/**
 * Anansi Ice Particle - Persona Management Service
 * Handles user profiles (Name, Description, Avatar, etc.)
 */

import { PersonaDefinition, PersonaProfile } from './types';

const STORAGE_KEYS = {
    personas: 'iceparticle_personas',
    activePersonaId: 'iceparticle_active_persona_id'
};

const DEFAULT_PERSONAS: PersonaProfile[] = [
    {
        id: 'default',
        name: 'User',
        description: 'The default user.',
        pronouns: 'they/them',
        avatar: ''
    }
];

/**
 * Get all saved personas
 */
export function getPersonas(): PersonaProfile[] {
    const raw = localStorage.getItem(STORAGE_KEYS.personas);
    if (!raw) return DEFAULT_PERSONAS;
    try {
        return JSON.parse(raw);
    } catch {
        return DEFAULT_PERSONAS;
    }
}

/**
 * Save personas list
 */
export function savePersonas(personas: PersonaProfile[]): void {
    localStorage.setItem(STORAGE_KEYS.personas, JSON.stringify(personas));
}

/**
 * Get active persona ID
 */
export function getActivePersonaId(): string {
    return localStorage.getItem(STORAGE_KEYS.activePersonaId) || 'default';
}

/**
 * Set active persona ID
 */
export function setActivePersonaId(id: string): void {
    localStorage.setItem(STORAGE_KEYS.activePersonaId, id);
}

/**
 * Get the full active persona object
 */
export function getActivePersona(): PersonaProfile {
    const personas = getPersonas();
    const activeId = getActivePersonaId();
    return personas.find(p => p.id === activeId) || personas[0] || DEFAULT_PERSONAS[0];
}
