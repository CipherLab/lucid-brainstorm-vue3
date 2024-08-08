<template>
  <div @mouseover="handleMouseOver('node')" @mouseleave="handleMouseLeave">
    <q-badge
      @click.stop="handleDelete"
      transparent
      class="delete-badge"
      :color="showDeleteConfirm ? 'red' : 'grey'"
    >
      x
    </q-badge>
    <Handle
      v-if="props.data.agent.hasInput"
      type="target"
      :class="targetHandleClass"
      :position="Position.Left"
      :id="`${id}-target`"
      @mouseover="handleMouseOver('target')"
      @mouseleave="handleMouseLeave"
      style="background-color: goldenrod; border-radius: 50%"
    />
    <Handle
      v-if="props.data.agent.hasOutput"
      type="source"
      :class="sourceHandleClass"
      :position="Position.Bottom"
      :id="`${id}-target`"
      @mouseover="handleMouseOver('source')"
      @mouseleave="handleMouseLeave"
      style="background-color: olivedrab; border: 2px solid white"
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

    <NodeInspector
      v-if="false"
      class="inspector-panel"
      :temperature="props.data.temperature"
      :tokenCount="props.data.tokenCount"
      :nodeId="props.id"
    />
  </div>
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
import { emitter } from '../eventBus';

import { LucidFlowComposable } from '../composables/useLucidFlow';
const lucidFlow = inject<LucidFlowComposable>('lucidFlow');
if (!lucidFlow) {
  console.error('useLucidFlow composable not found!');
  throw new Error('useLucidFlow composable not found!'); // Or handle the error appropriately
}

const showDeleteConfirm = ref(false);

const props = defineProps<Node>();

const handleDelete = () => {
  if (showDeleteConfirm.value) {
    showDeleteConfirm.value = false;
    //props.onRemoveNode(props.id); // Call the callback to remove the node\
    //console.log('Delete node:', props.id);
    lucidFlow.removeNode(props.id);
    emitter.emit('node:deselected', { nodeId: props.id });
  } else {
    showDeleteConfirm.value = true;
  }
};

const handleInspector = () => {
  emitter.emit('node:selected', {
    nodeId: props.id,
    nodeType: props.data.agent.type + '', // Emit nodeType along with nodeId
  });
  //console.log('Open inspector for:', props.label);
  //console.log(' props.id:', props.id);
  //console.log(' props.:', props.data.agent.temperature);
};

// Handle clicks outside the node to deselect
const handleClickOutside = (event: MouseEvent) => {
  showDeleteConfirm.value = false;
};
const isNodeHovered = ref(false);
const isTargetHandleHovered = ref(false);
const isSourceHandleHovered = ref(false);
const hoverTimeout = ref<NodeJS.Timeout | null>(null);

const handleMouseOver = (target: 'node' | 'target' | 'source') => {
  if (target === 'node') isNodeHovered.value = true;
  if (target === 'target') isTargetHandleHovered.value = true;
  if (target === 'source') isSourceHandleHovered.value = true;
  if (hoverTimeout.value) clearTimeout(hoverTimeout.value); // Clear any existing timeout
};

const handleMouseLeave = () => {
  // Set the timeout only when leaving ALL elements:
  hoverTimeout.value = setTimeout(() => {
    isNodeHovered.value = false;
    isTargetHandleHovered.value = false;
    isSourceHandleHovered.value = false;
  }, 1000); // Adjust timeout duration as needed
};

const targetHandleClass = computed(() => {
  if (isTargetHandleHovered.value) return 'handle-show-more';
  return isNodeHovered.value ? 'handle-show' : 'handle-show-barely';
});

const sourceHandleClass = computed(() => {
  if (isSourceHandleHovered.value) return 'handle-show-more';
  return isNodeHovered.value ? 'handle-show' : 'handle-show-barely';
});

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
.handle-show {
  width: 0.75em;
  height: 0.75em;
}
.handle-show-more {
  width: 1.5em;
  height: 1.5em;
}
.handle-show-barely {
  width: 0.25em;
  height: 0.25em;
}
.handle-show,
.handle-show-more,
.handle-show-barely {
  transition: width 0.2s ease, height 0.2s ease; /* Adjust timing as desired */
}
.handle-show[type='target'] {
  /* Target handle */
  width: 1em;
  height: 1em;
}

.handle-show[type='source'] {
  /* Source handle */
  width: 0.8em;
  height: 0.8em;
}

.handle-show-more[type='target'] {
  width: 1.5em;
  height: 1.5em;
}

.handle-show-more[type='source'] {
  width: 1.2em;
  height: 1.2em;
}
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
