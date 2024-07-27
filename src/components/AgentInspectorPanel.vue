<template>
  <div v-if="selectedNode" class="inspector-content">
    <span class="label bg-secondary text-white">
      Token Count
      <span class="right-detail">{{ selectedNode.data.tokenCount ?? 0 }}</span>
    </span>
    <q-input
      v-model="selectedNode.data.label"
      label="Name"
      dense
      class="inline-name-input"
    />

    <span class="label bg-amber" style="padding: 0.25em">
      <span class="left-detail">
        <q-icon name="thermostat" />
        Temperature:
      </span>
      {{ selectedNode.data.temperature?.toFixed(1) }}
    </span>
    <q-slider
      v-model.number="selectedNode.data.temperature"
      :min="0"
      :max="2"
      :step="0.1"
    />
    <div class="q-pa-sm">
      <q-input
        v-model="selectedNode.data.agent.systemInstructions"
        label="System Instructions"
        filled
        type="textarea"
      />
    </div>
    <div class="q-pa-sm">
      <q-input
        v-model="selectedNode.data.agent.inputData"
        label="Prompt Text"
        filled
        type="textarea"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { QMarkdown } from '@quasar/quasar-ui-qmarkdown';
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
<style scoped>
.inspector-content {
  padding: 10px;
}
.inline-name-input {
  width: 100%;
}
.input-textarea {
  width: 100%;
  min-height: 10em;
}
</style>
