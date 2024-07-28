<template>
  <div class="brainstorm-canvas" @drop="onDrop" @dragover.prevent>
    <vue-flow
      :nodes="flowNodes"
      :edges="flowEdges"
      :connection-mode="connectionMode"
      @nodes-change="handleNodesChange"
      @edges-changed="onEdgesChange"
      @connect="onConnect"
      @click="handleClickOutside"
    >
      <Background class="background" />
      <template #node-agent="data">
        <AgentNode v-bind="data" />
      </template>

      <template #node-input="data">
        <InputNode v-bind="data" />
      </template>
    </vue-flow>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, inject, watchEffect } from 'vue';
import {
  ConnectionMode,
  Connection,
  Node,
  Edge,
  NodeChange,
} from '@vue-flow/core';
import { VueFlow } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import AgentNode from './AgentNode.vue';
import InputNode from './InputNode.vue';

const connectionMode = ref(ConnectionMode.Loose);
const nodeTypes = ref(['agent', 'input', 'file', 'prompt', 'webpage']); // Add all your node types here
const nodesTotal = ref(0);

import type { LucidFlowComposable } from 'src/composables/useLucidFlow'; // Import the type
import { emitter } from 'src/eventBus';

const lucidFlow = inject<LucidFlowComposable>('lucidFlow');
if (!lucidFlow) {
  console.error('useLucidFlow composable not found!');
  throw new Error('useLucidFlow composable not found!'); // Or handle the error appropriately
}

const flowNodes = ref<Node[]>([]); // Initialize as an empty array
const flowEdges = ref<Edge[]>([]); // Initialize as an empty array

// Watch for changes in lucidFlow and update local refs
watchEffect(() => {
  flowNodes.value = lucidFlow?.nodes || [];
  flowEdges.value = lucidFlow?.edges || [];
});

const onConnect = (connection: Edge | Connection) => {
  console.log('New connection:', connection);
  lucidFlow.addEdge({
    id: `${connection.source}-${connection.target}`,
    source: connection.source,
    target: connection.target,
    type: 'smoothstep',
    animated: false,
  });
};

const onEdgesChange = (changes: any) => {
  console.log('Edges Changes:', changes);
};

const handleClickOutside = (changes: any) => {
  emitter.emit('node:deselected', null);
};

const removeNodeFromCanvas = (nodeId: string) => {
  console.log('Removing node:', nodeId);
  lucidFlow.removeNode(nodeId);
  nodesTotal.value--;
};

const onDrop = (event: any) => {
  if (!event.dataTransfer) return;

  const eventData = JSON.parse(event.dataTransfer.getData('text/plain'));
  if (!eventData || eventData == '') return;
  console.log('nodes length:', lucidFlow.nodes.length);
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
          systemInstructions: eventData.ssystemInstructions,
        },
        onRemoveNode: removeNodeFromCanvas,
        label: eventData.name || 'unknown agent',
      },
      type: eventData.type,
    };
    newNode.type = 'agent';
    console.log('New agent node:', newNode);
    nodesTotal.value++;
    lucidFlow.addNode(newNode);
  } else if (eventData.type === 'input') {
    console.log('Input dropped:', eventData);
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
          subtype: eventData.subype,
          inputData: eventData.inputData,
        },
        onRemoveNode: removeNodeFromCanvas,
        label: eventData.name || 'unknown input',
      },
      type: eventData.type,
    };
    newNode.type = 'agent';
    console.log('New input node:', newNode);
    nodesTotal.value++;
    lucidFlow.addNode(newNode);
  } else {
    console.log('Unknown type:', eventData);
  }

  if (newNode) {
    emitter.emit('node:selected', {
      nodeId: newNode.id,
      nodeType: newNode.data.agent.type,
    });
  }
};
const handleNodesChange = (changes: NodeChange[]) => {
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
</script>
<style scoped>
.brainstorm-canvas {
  flex: 1;
  background-color: #f5f5f5;
  position: relative;
  height: 100%;
}

.background {
  pointer-events: none;
}
</style>
