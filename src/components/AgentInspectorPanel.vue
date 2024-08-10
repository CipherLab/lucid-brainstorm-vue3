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
        {{ selectedNode.data.agent }}
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
      <div v-if="shouldShowAgentControls">
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
      </div>

      <div v-if="!shouldShowAgentControls">
        <div class="q-pa-sm">
          <q-input
            class="text-light"
            v-model="textInputData"
            label="Enter something"
            filled
            type="textarea"
            @input="debouncedUpdateChatHistory"
            @blur="debouncedUpdateChatHistory"
          />
        </div>
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
      <ChatWrapper
        v-if="selectedNode && shouldShowAgentControls"
        :selectedNodeId="selectedNodeId"
        :assistantNameProp="assistantName"
        :assistantIcon="selectedNode.data.agent.icon"
        style="flex-grow: 1"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import moment from 'moment';
import { LucidFlowComposable } from '../composables/useLucidFlow';
import draggable from 'vuedraggable';
import ChatHistory from './ChatHistory.vue';
import { ChatService, Message } from '../models/chatInterfaces';
import { debounce } from 'lodash';
import { NodeProps } from '@vue-flow/core';
import { BaseNodeEvent, emitter } from '../eventBus';
import {
  ref,
  inject,
  computed,
  nextTick,
  watchEffect,
  onMounted,
  onUnmounted,
} from 'vue';
import ChatWrapper from './ChatWrapper.vue';
import { on } from 'events';
import { text } from 'stream/consumers';
import { debug } from 'console';
const textInputData = ref('');
const messages = ref<Message[]>([
  {
    id: Date.now().toString(),
    sender: 'user',
    message: textInputData.value,
    createdAt: Date.now(),
    error: false,
    typing: false,
    selected: true,
    isEnabled: true,
  },
]);

const props = defineProps({
  selectedNodeId: {
    type: String,
    default: null,
  },
});
const lucidFlow = inject<LucidFlowComposable>('lucidFlow')!;
if (!lucidFlow) {
  throw new Error('lucidFlow composable not provided');
}
const assistantName = computed(() => {
  if (selectedNode.value) {
    return selectedNode.value.data.label;
  }
  return 'Assistant';
});
onMounted(() => {
  emitter.on('node:selected', handleNodeSelected);
});

onUnmounted(() => {
  emitter.off('node:selected', handleNodeSelected);
});

const handleNodeSelected = (event: BaseNodeEvent) => {
  if (event.nodeId === props.selectedNodeId) {
    const node = lucidFlow.findNodeProps(event.nodeId);
    selectedNode.value = node ?? null;

    const chatData = lucidFlow.getNodeChatData(props.selectedNodeId);
    if (chatData && chatData.length > 0) {
      messages.value = [...chatData];
      textInputData.value = messages.value[0]?.message || ''; // Sync input data with message
    } else {
      messages.value = [];
      textInputData.value = ''; // Clear input if no message data
    }
  }
};

// Watch for changes to selectedNodeId
watchEffect(() => {
  if (props.selectedNodeId) {
    const node = lucidFlow.findNodeProps(props.selectedNodeId);
    selectedNode.value = node ?? null;

    const chatData = lucidFlow.getNodeChatData(props.selectedNodeId);
    if (chatData) {
      messages.value = [...chatData];
      textInputData.value = chatData[0]?.message || ''; // Load the text into the input
    } else {
      messages.value = [];
      textInputData.value = ''; // Clear input if no message data
    }
  } else {
    selectedNode.value = null;
    textInputData.value = ''; // Clear input when no node is selected
  }
});

const shouldShowAgentControls = computed(() => {
  if (selectedNode.value) {
    if (
      !selectedNode.value.data.agent.subtype ||
      selectedNode.value.data.agent.subtype === ''
    ) {
      return true;
    }
    if (selectedNode.value.data.agent.subtype !== 'agent') {
      return false;
    }
  }
  return 'Assistant';
});

watchEffect(() => {
  if (props.selectedNodeId) {
    // Find and set the selected node, or null if not found
    const node = lucidFlow.findNodeProps(props.selectedNodeId); // Cast the result to MyNodeProps or undefined
    selectedNode.value = node ?? null; // Use nullish coalescing operator to handle undefined
  } else {
    selectedNode.value = null; // Reset selectedNode if selectedNodeId is null
  }
});

watchEffect(() => {
  const chatData = lucidFlow.getNodeChatData(props.selectedNodeId);
  if (chatData) {
    messages.value = [...chatData]; // Use spread syntax to ensure reactivity
  } else {
    messages.value = [];
  }
});
// Debounce the updateChatHistory function
const debouncedUpdateChatHistory = debounce(updateChatHistory, 500); // Adjust delay as needed

// ... your other methods ...
async function updateChatHistory() {
  if (textInputData.value && textInputData.value.trim() !== '') {
    if (!messages.value || messages.value.length === 0) {
      messages.value = [
        {
          id: Date.now().toString(),
          sender: 'user',
          message: textInputData.value,
          createdAt: Date.now(),
          error: false,
          typing: false,
          selected: true,
          isEnabled: true,
        },
      ];
    } else {
      messages.value[0].message = textInputData.value;
    }
    lucidFlow.updateNodeChatData(props.selectedNodeId, messages.value);
  }
}
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

.scroll {
  overflow: hidden !important;
  /* Ensure the element has a defined height */
  height: 100vh; /* or any specific height */
}
body.mobile .scroll--mobile {
  overflow: hidden !important;
}
</style>
