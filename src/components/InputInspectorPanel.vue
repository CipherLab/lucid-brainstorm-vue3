<template>
  <div v-if="selectedNode" class="inspector-content">
    <q-input
      v-model="selectedNode.data.label"
      :label="selectedNode.data.agent.name"
      dense
      class="inline-name-input text-white"
    />

    <span class="label bg-amber" style="padding: 0.25em">
      <span class="left-detail">
        <q-icon name="thermostat" />
        Temperature:
      </span>
      {{ selectedNode.data.temperature?.toFixed(1) }}
    </span>
    <q-input
      v-model="selectedNode.data.inputData"
      label="Prompt Text"
      dense
      class="inline-name-input"
    />
    <!-- <div v-if="selectedNode.data.subtype === 'file'">
      <q-uploader flat label="Upload File" accept=".txt" @added="onFileAdded" />
    </div> -->
  </div>
</template>

<script setup lang="ts">
import { inject, ref, watchEffect } from 'vue';
import { NodeProps } from '@vue-flow/core';
import { LucidFlowComposable } from '../composables/useLucidFlow';
const props = defineProps({
  selectedNodeId: {
    type: String,
    default: null,
  },
});
const onFileAdded = (file: any) => {
  console.log('File added:', file);
  //selectedNode.value.data.file = file;
};

const lucidFlow = inject<LucidFlowComposable>('lucidFlow');
if (!lucidFlow) {
  throw new Error('lucidFlow composable not provided');
}
const selectedNode = ref<NodeProps | null>(null); // Declare ref for selectedNode
watchEffect(() => {
  if (props.selectedNodeId) {
    // Find and set the selected node, or null if not found
    const node = lucidFlow.findNodeProps(props.selectedNodeId);
    selectedNode.value = node ?? null; // Use nullish coalescing operator to handle undefined
    console.log('input panel selectedNode:', selectedNode.value);
  } else {
    selectedNode.value = null; // Reset selectedNode if selectedNodeId is null
  }
});
</script>
