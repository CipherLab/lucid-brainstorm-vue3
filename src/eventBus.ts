// src/event-bus.ts
import mitt from 'mitt';

// Define a base class for events with a nodeId
class BaseNodeEvent {
  nodeId: string | undefined;

  constructor(nodeId: string | undefined) {
    this.nodeId = nodeId;
  }
}
class GenericEvent {
  data: any | undefined;
  constructor(data: any | undefined) {
    this.data = data;
  }
}

// Define event types extending the base class
class NodeSelectedEvent extends BaseNodeEvent {
  nodeType: string | undefined;

  constructor(nodeId: string | undefined, nodeType: string | undefined) {
    super(nodeId);
    this.nodeType = nodeType;
  }
}
class NodeDeselectedEvent {}

class NodeToggledEvent extends BaseNodeEvent {
  totalConnections: number;

  constructor(nodeId: string | undefined, totalConnections: number) {
    super(nodeId);
    this.totalConnections = totalConnections;
  }
}

class BooleanToggledEvent extends BaseNodeEvent {
  boolState: boolean;

  constructor(nodeId: string | undefined, boolState: boolean) {
    super(nodeId);
    this.boolState = boolState;
  }
}

class NodeWatcherToggledEvent extends BooleanToggledEvent {
  nodeCoords: { x: number; y: number };
  constructor(
    nodeId: string | undefined,
    boolState: boolean,
    nodeCoords: { x: number; y: number }
  ) {
    super(nodeId, boolState);
    this.nodeCoords = nodeCoords;
  }
}
class MessageReceivedEvent extends BaseNodeEvent {
  message: string;

  constructor(nodeId: string | undefined, message: string) {
    super(nodeId);
    this.message = message;
  }
}

class NodeTabbedEvent extends BaseNodeEvent {
  constructor(nodeId: string | undefined) {
    super(nodeId);
  }
}
// Define the types for your event bus
type Events = {
  'node:selected': NodeSelectedEvent;
  'node:deselected': NodeDeselectedEvent;
  'node:accordion-toggled': NodeToggledEvent;
  'node:q-tab-toggled': NodeTabbedEvent;
  'node:message-received': MessageReceivedEvent;
  'node:message-requested': BaseNodeEvent;
  'node:message-failed': BaseNodeEvent;
  'node:agent-created': GenericEvent;
  'node:api-key-invalid': GenericEvent;
  'node:watcher-toggled': NodeWatcherToggledEvent;
  'node:code-copied': GenericEvent;
  'node:error': GenericEvent;
};

// Create the event bus
const emitter = mitt<Events>();

// Export the event bus and event types
export { emitter };

export type {
  NodeSelectedEvent,
  BaseNodeEvent,
  NodeDeselectedEvent,
  NodeToggledEvent,
  NodeTabbedEvent,
  MessageReceivedEvent,
  GenericEvent,
  BooleanToggledEvent,
  NodeWatcherToggledEvent,
};
