<template>
  <div class="brainstorm-canvas" @drop="onDrop" @dragover.prevent>
    <vue-flow
      :nodes="nodes"
      :edges="edges"
      :connection-mode="connectionMode"
      @move-end="onMoveEnd"
      @nodes-change="handleNodesChange"
      @edges-changed="onEdgesChange"
      @connect="onConnect"
      @click="handleClickOutside"
      @edge-click="handleEdgeClick"
      @onEdgeMouseEnter="onEdgeMouseEnter"
      @onEdgeMouseLeave="onEdgeMouseLeave"
      :style="{ background: '#222222' }"
    >
      <Background class="background" />
      <template #node-agent="data">
        <AgentNode v-bind="data" />
      </template>

      <template #node-input="data">
        <InputNode v-bind="data" />
      </template>

      <template #edge-button="edge">
        <EdgeWithButton
          :id="edge.id"
          :source-x="edge.sourceX"
          :source-y="edge.sourceY"
          :target-x="edge.targetX"
          :target-y="edge.targetY"
          :source-position="edge.sourcePosition"
          :target-position="edge.targetPosition"
          :marker-end="edge.markerEnd"
          :style="edge.style"
          :removeEdge="removeEdge"
          :selectedEdgeId="selectedEdgeId || ''"
        />
      </template>
    </vue-flow>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  onMounted,
  computed,
  onUnmounted,
  inject,
  watchEffect,
} from 'vue';
import {
  ConnectionMode,
  Connection,
  Node,
  Edge,
  NodeChange,
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  EdgeMouseEvent,
  Position,
} from '@vue-flow/core';
import { VueFlow } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import AgentNode from './AgentNode.vue';
import InputNode from './InputNode.vue';
import EdgeWithButton from './EdgeWithButton.vue';
import { debounce } from 'lodash-es';

const connectionMode = ref(ConnectionMode.Loose);
const nodesTotal = ref(0);

import {
  emitter,
  NodeToggledEvent,
  NodeWatcherToggledEvent,
} from '../eventBus';
import { LucidFlowComposable } from '../composables/useLucidFlow';

const lucidFlow = inject<LucidFlowComposable>('lucidFlow');
if (!lucidFlow) {
  console.error('useLucidFlow composable not found!');
  throw new Error('useLucidFlow composable not found!'); // Or handle the error appropriately
}

const nodes = computed(() => lucidFlow.getNodes());
const edges = computed(() => lucidFlow.getEdges());

onMounted(async () => {
  //console.log('B-lucidFlow.nodes.length', lucidFlow.getNodeCount());
  await lucidFlow.loadSession();
  emitter.on('node:watcher-toggled', handleWatcherToggled);

  window.addEventListener('keydown', handleKeyDown);
  //console.log('A-lucidFlow.nodes.length', lucidFlow.getNodeCount());
});

onUnmounted(async () => {
  window.removeEventListener('keydown', handleKeyDown);
  emitter.off('node:watcher-toggled', handleWatcherToggled);
});
// Watch for changes in lucidFlow and update local refs
const handleWatcherToggled = async (event: NodeWatcherToggledEvent) => {
  if (!event.nodeId) throw new Error('Node ID not provided');
  // await lucidFlow.updateNodePosition(
  //   event.nodeId,
  //   event.nodeCoords.x,
  //   event.nodeCoords.y
  // );
  await lucidFlow.loadSession();
};

const onConnect = (connection: Edge | Connection) => {
  //console.log('New connection:', connection);
  lucidFlow.addEdge({
    id: `${connection.source}-${connection.target}`,
    source: connection.source,
    target: connection.target,
    type: 'button',
    data: { text: 'custom edge' },
    animated: false,
  });

  // if (sourceNode && targetNode) {
  //   lucidFlow.handleNodeConnection(connection.source, connection.target);
  // }
};

const onEdgesChange = () => {
  console.log('Edges Changes');
};

const handleClickOutside = (event: any) => {
  emitter.emit('node:deselected', {});

  selectedEdgeId.value = '';
  event.stopPropagation();
};
const selectedEdgeId = ref<string | null>(null);

const handleEdgeClick = (event: EdgeMouseEvent) => {
  //console.log('Edge clicked:', event.edge.id);
  selectedEdgeId.value = event.edge.id;

  // Prevent click event from reaching the canvas
  event.event.stopPropagation();
};
const onEdgeMouseEnter = (event: EdgeMouseEvent) => {
  console.log('Edge mouse enter:', event.edge.id);
};

const onEdgeMouseLeave = (event: EdgeMouseEvent) => {
  console.log('Edge mouse leave:', event.edge.id);
};
const removeEdge = (edgeId: string) => {
  lucidFlow.removeEdge(edgeId);
  selectedEdgeId.value = null;
};
const handleKeyDown = (event: KeyboardEvent) => {
  console.log('Key pressed:', event.key);
};
const removeNodeFromCanvas = (nodeId: string) => {
  //console.log('Removing node:', nodeId);
  lucidFlow.removeNode(nodeId);
  nodesTotal.value--;
};

const onDrop = (event: any) => {
  if (!event.dataTransfer) return;

  const eventData = JSON.parse(event.dataTransfer.getData('text/plain'));
  if (!eventData || eventData == '') return;

  //console.log('nodes length:', lucidFlow.getNodeCount());
  const position = {
    x: event.clientX - 300,
    y: event.clientY - 200,
  };
  let newNode: Node | null = null;

  if (eventData.type === 'agent') {
    newNode = {
      id: `${Date.now()}`,
      position,
      data: {
        agent: {
          type: 'agent',
          id: eventData.id,
          name: eventData.name,
          icon: eventData.icon,
          color: eventData.color,
          hasOutput: eventData.hasOutput,
          hasInput: eventData.hasInput,
          temperature: eventData.temperature,
          systemInstructions: eventData.systemInstructions,
          subtype: eventData.subtype ?? 'agent',
          tokenCount: eventData.tokenCount ?? 0,
          webUrl: eventData.webUrl,
          watcher: eventData.watcher,
          githubSelection: eventData.githubSelection,
        },
        onRemoveNode: removeNodeFromCanvas,
        label: eventData.name || 'unknown agent',
      },
      type: eventData.type,
    };
    newNode.type = 'agent';
    //console.log('New agent node:', newNode);
    nodesTotal.value++;
    lucidFlow.addNode(newNode);
  } else if (eventData.type === 'input') {
    //console.log('Input dropped:', eventData);
    newNode = {
      id: `${Date.now()}`,
      position,
      data: {
        // Add the 'agent' property to the data object
        agent: {
          type: 'input',
          id: eventData.id,
          name: eventData.name,
          icon: eventData.icon,
          color: eventData.color,
          hasOutput: eventData.hasOutput,
          hasInput: eventData.hasInput,
          subtype: eventData.subtype,
          inputData: eventData.inputData,
          tokenCount: eventData.tokenCount,
          webUrl: eventData.webUrl,
          watcher: eventData.watcher,
          githubSelection: eventData.githubSelection,
        },
        onRemoveNode: removeNodeFromCanvas,
        label: eventData.name || 'unknown input',
      },
      type: eventData.type,
    };
    newNode.type = 'agent';
    //console.log('New input node:', newNode);
    nodesTotal.value++;
    lucidFlow.addNode(newNode);
  } else if (eventData.type === 'textInput') {
    //console.log('Input dropped:', eventData);
    newNode = {
      id: `${Date.now()}`,
      position,
      data: {
        // Add the 'agent' property to the data object
        agent: {
          type: 'textInput',
          id: eventData.id,
          name: eventData.name,
          icon: eventData.icon,
          color: eventData.color,
          hasOutput: eventData.hasOutput,
          hasInput: eventData.hasInput,
          subtype: eventData.subtype,
          inputData: eventData.inputData,
          tokenCount: eventData.tokenCount,
          webUrl: eventData.webUrl,
          watcher: eventData.watcher,
          githubSelection: eventData.githubSelection,
        },
        onRemoveNode: removeNodeFromCanvas,
        label: eventData.name || 'unknown input',
      },
      type: eventData.type,
    };
    newNode.type = 'agent';
    //console.log('New input node:', newNode);
    nodesTotal.value++;
    lucidFlow.addNode(newNode);
  } else {
    //console.log('Unknown type:', eventData);
  }

  if (newNode) {
    //console.log('N-lucidFlow.nodes.length', lucidFlow.getNodeCount());
    emitter.emit('node:selected', {
      nodeId: newNode.id,
      nodeType: newNode.data.agent.type,
    });
  }
};
const onEdgeHover = (event: EdgeMouseEvent) => {
  console.log('Edge hovered:', event.edge.id);
};
const onMoveEnd = (event: any) => {
  //console.log('Move end:', event.flowTransform);
  //console.log('Node moved:', event.id, event.position);
  lucidFlow.saveViewportState(
    event.flowTransform.x,
    event.flowTransform.y,
    event.flowTransform.zoom
  );
};

const handleNodesChange = async (changes: NodeChange[]) => {
  //loop
  //  changes.forEach((change: NodeChange) => {

  if (!lucidFlow || !changes || changes.length == 0) return;
  const change = changes[0];
  if (change.type === 'add') {
  } else if (change.type === 'remove') {
  } else if (change.type === 'position') {
    if (change.id && change.position) {
      lucidFlow.updateNodePosition(
        change.id,
        change.position.x,
        change.position.y
      );
    }
  }
  //});

  // Handle the changes as needed
};
watchEffect(() => {
  //console.log('Nodes in BrainStormCanvas:', lucidFlow.getNodeCount());
});
</script>
<style scoped>
.brainstorm-canvas {
  flex: 1;
  background-color: #f5f5f5;
  position: relative;
  height: calc(100vh - 55px - 20px - 10px);
}

.background {
  pointer-events: none;
}
</style>
