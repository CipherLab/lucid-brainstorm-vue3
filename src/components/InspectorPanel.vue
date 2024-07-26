<template>
  <div v-if="selectedNode" class="inspector-content">
    <h3>
      <q-input
        v-model="selectedNode.data.label"
        label="Name"
        dense
        class="inline-name-input"
      />
    </h3>
    <q-slider
      v-model.number="selectedNode.data.temperature"
      :min="0"
      :max="1"
      :step="0.1"
    />
    <q-input
      v-model.number="selectedNode.data.tokenCount"
      type="number"
      :min="1"
      label="Token Count"
    />
  </div>
</template>

<script setup lang="ts">
import { inject, ref, watchEffect } from 'vue';
import type { LucidFlowComposable } from 'src/composables/useLucidFlow'; // Import the type
import { NodeProps } from '@vue-flow/core';
const props = defineProps({
  selectedNodeId: {
    type: String,
    default: null,
  },
});

const lucidFlow = inject<LucidFlowComposable>('lucidFlow');
if (!lucidFlow) {
  throw new Error('lucidFlow composable not provided');
}
const selectedNode = ref<NodeProps | null>(null); // Declare ref for selectedNode
watchEffect(() => {
  if (props.selectedNodeId) {
    // Find and set the selected node, or null if not found
    const node = lucidFlow.nodes.find(
      (node) => node.id === props.selectedNodeId
    ) as NodeProps | undefined; // Cast the result to MyNodeProps or undefined
    selectedNode.value = node ?? null; // Use nullish coalescing operator to handle undefined
  } else {
    selectedNode.value = null; // Reset selectedNode if selectedNodeId is null
  }
});
</script>
