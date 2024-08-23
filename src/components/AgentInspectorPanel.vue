<template>
  <div
    class="chat-wrapper"
    :style="{ paddingTop: shouldShowAgentControls ? '0px' : '0px' }"
  >
    <div v-if="selectedNode" class="inspector-content">
      <span
        class="label span-width"
        :style="{ backgroundColor: selectedNode.data.agent.color }"
      >
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
      <div v-if="selectedNode.data.agent.subtype === 'file'">
        <div class="q-pa-sm">
          <q-file
            v-model="files"
            label="Pick files"
            outlined
            use-chips
            multiple
          />
          <q-btn
            label="Load File"
            @click="loadFile"
            :disable="!files || files.length <= 0"
          />
        </div>
      </div>
      <div
        v-if="selectedNode.data.agent.subtype === 'webpage'"
        class="q-pa-sm row items-center"
      >
        <WebPageAgent
          :selectedNode="selectedNode"
          :updateChatHistoryData="updateChatHistoryData"
          :toggleWatcherState="toggleWatcher"
          :webUrlProp="webUrl"
        />
      </div>
      <div v-if="!shouldShowAgentControls">
        <div class="q-pa-md">
          <q-input
            class="text-light"
            v-model="textInputData"
            :label="hintText"
            filled
            type="textarea"
            @input="updateChatHistory"
            @blur="updateChatHistory"
          />
        </div>
      </div>
    </div>

    <ChatWrapper
      v-if="selectedNode && shouldShowAgentControls"
      :selectedNodeId="selectedNodeId"
      :assistantNameProp="assistantName"
      :assistantIcon="selectedNode.data.agent.icon"
    />
  </div>
</template>

<script setup lang="ts">
import moment from 'moment';
import { LucidFlowComposable } from '../composables/useLucidFlow';
import draggable from 'vuedraggable';
import { ChatService, Message } from '../models/chatInterfaces';
import { debounce } from 'lodash';
import { NodeProps } from '@vue-flow/core';
import { BaseNodeEvent, emitter } from '../eventBus';
import axios from 'axios';
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
import { debug } from 'console';
import { useQuasar } from 'quasar';
import { WebDataFetcher } from '../services/webDataFetcher';
const textInputData = ref('');
const props = defineProps({
  selectedNodeId: {
    type: String,
    default: null,
  },
});
import WebPageAgent from './WebPageAgent.vue';
// import FileAgent from './FileAgent.vue';
// import InputAgent from './InputAgent.vue';

const files = ref<FileList | null>(null);
const messages = ref<Message[]>([]);
const selectedNode = ref<NodeProps | null>(null); // Declare ref for selectedNode

const $q = useQuasar();

const lucidFlow = inject<LucidFlowComposable>('lucidFlow')!;
if (!lucidFlow) {
  $q.notify({
    message: 'LucidFlow composable not provided',
    color: 'negative',
    position: 'top',
  });
  throw new Error('lucidFlow composable not provided');
}
const assistantName = computed(() => {
  if (selectedNode.value) {
    return selectedNode.value.data.label;
  }
  return 'Assistant';
});
const toggleWatcher = async () => {
  if (selectedNode.value) {
    selectedNode.value.data.agent.watcher =
      !selectedNode.value.data.agent.watcher;
    //pdateChatHistory();

    await lucidFlow.toggleEdgeAnimation(
      selectedNode.value.id,
      selectedNode.value.data.agent.watcher
    );

    emitter.emit('node:watcher-toggled', {
      nodeId: selectedNode.value.id,
      boolState: selectedNode.value.data.agent.watcher,
    });
  }
};

const loadFile = () => {
  if (files.value && files.value?.length > 0) {
    let fileData = '';

    for (let i = 0; i < files.value.length; i++) {
      const file = files.value[i];
      console.log('File:', file);
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          fileData += e.target?.result as string;
          // 1. Log fileData AFTER reading is complete
          textInputData.value = fileData;
          updateChatHistory();
        };
        reader.readAsText(file);
      }
    }
  }
};
const hintText = computed(() => {
  if (textInputData.value) {
    return 'Data is loaded';
  }
  if (selectedNode.value?.data.agent.subtype === 'input') {
    return 'Enter something';
  } else if (selectedNode.value?.data.agent.subtype === 'file') {
    return 'Select a file, your data will be loaded here';
  } else if (selectedNode.value?.data.agent.subtype === 'webpage') {
    return 'Enter a URL, your content will be loaded here';
  }
  return 'Assistant';
});
onMounted(() => {
  emitter.on('node:selected', handleNodeSelected);
});

onUnmounted(() => {
  emitter.off('node:selected', handleNodeSelected);
});

const handleNodeSelected = async (event: BaseNodeEvent) => {
  if (event.nodeId === props.selectedNodeId) {
    const node = await lucidFlow.findNodeProps(event.nodeId);
    selectedNode.value = node ?? null;

    const chatData = await lucidFlow.getNodeChatData(props.selectedNodeId);
    if (chatData && chatData.length > 0) {
      messages.value = [...chatData];
      textInputData.value = messages.value[0]?.message || ''; // Sync input data with message
    } else {
      messages.value = [];
      textInputData.value = ''; // Clear input if no message data
    }
  }
};
const dataFetcher = new WebDataFetcher(); // Create an instance

const webUrl = ref(selectedNode.value?.data.agent.webUrl ?? '');
const corsProxy = 'https://api.allorigins.win/get?url='; // Different CORS proxy

const getDataFromUrl = async () => {
  if (webUrl.value) {
    try {
      textInputData.value = await dataFetcher.fetchData(webUrl.value);
      updateChatHistory();
    } catch (error) {
      $q.notify({
        message: error.message, // Use the error message from the service
        color: 'negative',
        position: 'top',
      });
    }
  }
};
// Watch for changes to selectedNodeId
watchEffect(async () => {
  if (props.selectedNodeId) {
    const node = await lucidFlow.findNodeProps(props.selectedNodeId);
    selectedNode.value = node ?? null;
    //console.log('Selected Node:', selectedNode.value);
    const chatData = await lucidFlow.getNodeChatData(props.selectedNodeId);
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

watchEffect(async () => {
  if (props.selectedNodeId) {
    const node = await lucidFlow.findNodeProps(props.selectedNodeId);
    selectedNode.value = node ?? null;

    const chatData = await lucidFlow.getNodeChatData(props.selectedNodeId);
    if (chatData && chatData.length > 0) {
      messages.value = [...chatData];
      textInputData.value = messages.value[0]?.message || '';
      webUrl.value = messages.value[0]?.webUrl || '';
    } else {
      messages.value = [
        {
          id: 'textInputMessage',
          sender: 'user',
          message: '', // Start with an empty message
          createdAt: Date.now(),
          error: false,
          typing: false,
          selected: false,
          isEnabledByNode: {}, // Initialize isEnabledByNode
        },
      ];
      textInputData.value = ''; // Clear input if no message data
    }
  } else {
    selectedNode.value = null;
    textInputData.value = '';
  }
});

// Method to update the single-item message
const updateTextInputMessage = debounce(() => {
  if (selectedNode.value && selectedNode.value.data.agent.subtype === 'input') {
    messages.value[0].message = textInputData.value;
    updateChatHistory();
  }
}, 500); // Debounce for 500ms (adjust as needed)

watchEffect(async () => {
  const chatData = await lucidFlow.getNodeChatData(props.selectedNodeId);
  if (chatData) {
    messages.value = [...chatData]; // Use spread syntax to ensure reactivity
  } else {
    messages.value = [];
  }
});
// Debounce the updateChatHistory function
const debouncedUpdateChatHistory = debounce(updateChatHistory, 500); // Adjust delay as needed
async function updateChatHistoryData(data: string) {
  console.log('Update Chat History:', data);
  if (!messages.value || messages.value.length === 0) {
    messages.value = [
      {
        id: Date.now() + '',
        sender: 'user',
        message: data,
        webUrl: webUrl.value,
        createdAt: Date.now(),
        error: false,
        typing: false,
        selected: true,
        isEnabledByNode: {}, // Safe to initialize here (new message)
      },
    ];
  } else {
    // Preserve existing isEnabledByNode!

    messages.value[0] = {
      ...messages.value[0], // Copy existing properties
      message: data, // Update the message
      webUrl: webUrl.value,
    };
  }

  await lucidFlow.updateNodeChatData(props.selectedNodeId, messages.value);
}
async function updateChatHistory() {
  await updateChatHistoryData(textInputData.value);
}

const currentAgentComponent = computed(() => {
  if (!selectedNode.value) return null;
  switch (selectedNode.value.data.agent.subtype) {
    case 'webpage':
      return WebPageAgent;
    // case 'file':
    //   return FileAgent;
    // case 'input':
    //   return InputAgent;
    default:
      return null;
  }
});
</script>

<style scoped>
.chat-wrapper {
  top: 0px !important;
  color: white;
  height: 100%;
  overflow: hidden !important;
  display: flex;
  flex-direction: column;
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
