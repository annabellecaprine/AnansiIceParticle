/**
 * Anansi Ice Particle - Event Bus
 * Strongly-typed pub/sub for decoupled component communication
 */

import type { EventMap } from './types';

type EventCallback<T> = (data: T) => void;

class EventBus {
    private listeners: Map<string, Set<EventCallback<unknown>>> = new Map();

    /**
     * Subscribe to an event
     * @returns Unsubscribe function
     */
    on<K extends keyof EventMap>(event: K, callback: EventCallback<EventMap[K]>): () => void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(callback as EventCallback<unknown>);

        // Return unsubscribe function
        return () => this.off(event, callback);
    }

    /**
     * Subscribe to an event, firing only once
     */
    once<K extends keyof EventMap>(event: K, callback: EventCallback<EventMap[K]>): () => void {
        const wrapper: EventCallback<EventMap[K]> = (data) => {
            callback(data);
            this.off(event, wrapper);
        };
        return this.on(event, wrapper);
    }

    /**
     * Unsubscribe from an event
     */
    off<K extends keyof EventMap>(event: K, callback: EventCallback<EventMap[K]>): void {
        const set = this.listeners.get(event);
        if (set) {
            set.delete(callback as EventCallback<unknown>);
        }
    }

    /**
     * Emit an event to all subscribers
     */
    emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
        const set = this.listeners.get(event);
        if (!set) return;

        set.forEach(callback => {
            try {
                callback(data);
            } catch (err) {
                console.error(`[EventBus] Error in listener for '${event}':`, err);
            }
        });
    }

    /**
     * Remove all listeners for an event (or all events)
     */
    clear(event?: keyof EventMap): void {
        if (event) {
            this.listeners.delete(event);
        } else {
            this.listeners.clear();
        }
    }
}

// Singleton export
export const events = new EventBus();
