<template>
  <q-badge
    @click.stop="handleDelete"
    transparent
    class="delete-badge"
    :color="showDeleteConfirm ? 'red' : 'gray'"
  >
    x
  </q-badge>
  <Handle
    v-if="props.data.agent.hasInput"
    type="target"
    :position="Position.Top"
    :id="`${id}-target`"
    style="background-color: red; width: 10px; height: 10px"
  />
  <div
    class="base-node"
    :style="{ backgroundColor: props.data.agent.color }"
    @click="handleInspector"
  >
    <div class="base-name">{{ props.label }}</div>

    <q-avatar>
      <q-icon :name="props.data.agent.icon" size="xl" />
    </q-avatar>

    <slot />
  </div>
  <Handle
    v-if="props.data.agent?.hasOutput"
    type="source"
    :position="Position.Bottom"
    :id="`${id}-source`"
    style="background-color: blue; width: 10px; height: 10px"
  />

  <NodeInspector
    class="inspector-panel"
    :temperature="props.data.temperature"
    :tokenCount="props.data.tokenCount"
    :nodeId="props.id"
  />
</template>
<script setup lang="ts">
import { inject, onMounted, onUnmounted } from 'vue';
import {
  Dimensions,
  HandleConnectable,
  Handle,
  Position,
  Node,
} from '@vue-flow/core';
import { defineProps, computed, PropType, VNode, ref } from 'vue';
import { emitter } from 'src/eventBus'; // Import your event bus
import NodeInspector from './NodeInspector.vue';

const showDeleteConfirm = ref(false);

const props = defineProps<Node>();

const handleDelete = () => {
  if (showDeleteConfirm.value) {
    showDeleteConfirm.value = false;
    //props.onRemoveNode(props.id); // Call the callback to remove the node
  } else {
    showDeleteConfirm.value = true;
  }
};

const handleInspector = () => {
  emitter.emit('node:selected', {
    nodeId: props.id,
    nodeType: props.type + '', // Emit nodeType along with nodeId
  });
  console.log('Open inspector for:', props.label);
  console.log(' props.id:', props.id);
  console.log(' props.temperature:', props.data.temperature);
};

// Handle clicks outside the node to deselect
const handleClickOutside = (event: MouseEvent) => {
  // Check if the click is outside of the current node element
  // if (!(event.target as HTMLElement).closest(`#${props.id}`)) {
  //   emitter.emit('node:deselected', null);
  // }
};

onMounted(() => {
  // Add the click event listener to the document when the node is mounted
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  // Remove the event listener when the node is unmounted
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.inspector-panel {
  position: absolute;
}

.base-node {
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #ccc;
  display: flex;
  flex-direction: column; /* Arrange elements vertically */
  align-items: center; /* Center elements horizontally */
  text-align: center; /* Center text */
  height: 10em;
  width: 10em;
}
.base-name {
  margin-bottom: 10px; /* Add some space between the icon and name */
}
.delete-badge {
  float: right;
  position: absolute;
  top: -20px;
  right: 0px;
  cursor: pointer;
}
</style>
<style scoped></style>
