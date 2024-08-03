// src/event-bus.ts
import mitt from 'mitt';

// Define event types
type NodeSelectedEvent = {
  nodeId: string | undefined;
  nodeType: string | undefined;
}; // Added nodeType
type NodeDeselectedEvent = null;

// Define the event handler types
type NodeSelectedHandler = (event: NodeSelectedEvent) => void;
type NodeDeselectedHandler = (event: NodeDeselectedEvent) => void;

// Define the types for your event bus
type Events = {
  'node:selected': NodeSelectedEvent;
  'node:deselected': NodeDeselectedEvent;
};

// Create the event bus
const emitter = mitt<Events>();

// Export the event bus and event types
export { emitter };

export type { NodeSelectedEvent, NodeSelectedHandler, NodeDeselectedHandler };
