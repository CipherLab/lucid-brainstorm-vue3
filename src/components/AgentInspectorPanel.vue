<template>
  <div
    style="color: white; height: 100%; display: flex; flex-direction: column"
  >
    <div v-if="selectedNode" class="inspector-content">
      <span
        class="label span-width"
        :style="{ backgroundColor: selectedNode.data.agent.color }"
      >
        Token Count
        <span class="right-detail">{{
          selectedNode.data.tokenCount ?? 0
        }}</span>
      </span>
      <div class="q-pa-md">
        <q-input
          style="color: white !important"
          v-model="selectedNode.data.label"
          label="Name"
          dense
          :input-style="{ color: 'white' }"
        />
      </div>

      <div class="q-pa-sm">
        <span class="label" style="padding: 0.25em">
          <span class="left-detail">
            <q-icon name="thermostat" />
            Temperature:
          </span>
          {{ selectedNode.data.agent.temperature?.toFixed(1) }}
        </span>
        <q-slider
          class="text-light"
          v-model.number="selectedNode.data.agent.temperature"
          :min="0"
          :max="2"
          :step="0.1"
        />
      </div>
      <div class="q-pa-sm">
        <q-input
          class="text-light"
          v-model="selectedNode.data.agent.systemInstructions"
          label="System Instructions"
          filled
          type="textarea"
        />
      </div>
      <!-- <div class="q-pa-sm">
      <q-input
        v-model="selectedNode.data.agent.inputData"
        label="Prompt Text"
        filled
        type="textarea"
      />
    </div> -->
    </div>
    <div style="flex-grow: 1; display: flex">
      <ChatComponent
        :selectedNodeId="selectedNodeId"
        :assistantNameProp="assistantName"
        style="flex-grow: 1"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { QMarkdown } from '@quasar/quasar-ui-qmarkdown';
import { inject, ref, computed, watchEffect } from 'vue';
import { NodeProps } from '@vue-flow/core';
import ChatComponent from './ChatComponent.vue';
import { LucidFlowComposable } from '../composables/useLucidFlow';
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
const assistantName = computed(() => {
  if (selectedNode.value) {
    return selectedNode.value.data.label;
  }
  return 'Assistant';
});

const selectedNode = ref<NodeProps | null>(null); // Declare ref for selectedNode
watchEffect(() => {
  if (props.selectedNodeId) {
    // Find and set the selected node, or null if not found
    const node = lucidFlow.findNodeProps(props.selectedNodeId); // Cast the result to MyNodeProps or undefined
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
  color: white !important;
  width: 100%;
}
.input-textarea {
  width: 100%;
  min-height: 15em;
}
.span-width {
  padding-top: 2px;
  width: 100%;
  display: block;
  align-items: center;
  text-align: center;
  border-radius: 2px;
}
</style>
