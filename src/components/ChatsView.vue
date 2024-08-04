<template>
  <div bordered class="rounded-borders chat-history" ref="chatHistory">
    <div>
      <draggable
        :list="messages"
        item-key="id"
        handle=".drag-handle"
        @end="onDragEnd"
      >
        <template #item="{ element, index }">
          <div :key="element.id">
            <!-- Sticky Header -->
            <q-item>
              <q-item-section>
                <q-header
                  v-if="isHeaderVisible(index)"
                  class="bg-grey-10 sticky-header"
                >
                  <q-toolbar>
                    <q-btn
                      class="drag-handle"
                      size="12px"
                      flat
                      dense
                      round
                      icon="drag_indicator"
                    />

                    <q-toolbar-title
                      style="font-size: small"
                      class="text-grey-8"
                      >{{ getSenderName(element.sender) }}
                    </q-toolbar-title>

                    <q-btn
                      size="12px"
                      flat
                      dense
                      round
                      icon="delete"
                      @click.stop="deleteMessage(index)"
                    />
                  </q-toolbar>
                </q-header>

                <!-- Chat Message Component -->
                <ChatMessage
                  :message="element.message"
                  :sender="element.sender"
                  :createdAt="element.createdAt"
                  :typing="element.typing"
                  assistantName="test"
                />
              </q-item-section>
            </q-item>
          </div>
        </template>
      </draggable>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  inject,
  ref,
  onMounted,
  computed,
  watchEffect,
  defineComponent,
  nextTick,
} from 'vue';
import moment from 'moment';
import { useRoute } from 'vue-router';
import { LucidFlowComposable } from '../composables/useLucidFlow';
import ChatService from '../services/chatService';
import draggable from 'vuedraggable';
import ChatMessage from './ChatMessage.vue';
import { Message } from '../models/chatInterfaces';
import { NodeProps } from '@vue-flow/core';
//import { QMarkdown } from '@quasar/quasar-ui-qmarzkdown';

defineComponent(draggable);

const messages = ref<Message[]>([]);
const userInput = ref('');
const chatService = inject<ChatService>('chatService')!;
const lucidFlow = inject<LucidFlowComposable>('lucidFlow')!;
const scrollAreaRef = ref(null);
const props = defineProps({
  selectedNodeId: {
    type: String,
    default: '',
  },
});

const nodeProps = ref<NodeProps>();

watchEffect(() => {
  if (!props.selectedNodeId || props.selectedNodeId == '') {
    console.log('selectedNodeId is null or empty');
    return;
  }
  console.log('selectedNodeId:', props.selectedNodeId);
  nodeProps.value = lucidFlow.findNodeProps(props.selectedNodeId);
  const chatData = lucidFlow.getNodeChatData(props.selectedNodeId);
  if (chatData) {
    messages.value = chatData.map((message: any) => ({
      ...message,
      selected: false, // Add selected: false for each message loaded
    }));
  } else {
    messages.value = []; // Initialize with an empty array if no data
  }
});

async function updateChatHistory() {
  lucidFlow.updateNodeChatData(props.selectedNodeId, messages.value);
}
function deleteMessage(index: number) {
  messages.value.splice(index, 1);
  updateChatHistory();
}
const onDragEnd = () => {
  // Call your function to update the chat history:
  updateChatHistory();
};
async function clearChat() {
  try {
    if (messages.value && messages.value.length > 0) {
      messages.value = messages.value.slice(0, 1); // Keep the first message (assistant greeting
      lucidFlow.updateNodeChatData(props.selectedNodeId, null); // Clear chat history in the graph
    }
  } catch (error) {
    console.error('Failed to clear chat:', error);
  }
}
const isHeaderVisible = (index: number) => {
  return true;
};
const getSenderName = (sender: string) => {
  return sender === 'user' ? 'User' : nodeProps.value?.data.agent.name;
};
</script>

<style scoped>
.sticky-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: black;
}
.thinking-indicator {
  text-align: center;
}
.message-send-button {
  height: 24px;
  width: 24px;
}
.scroll-wrapper {
  height: 65vh;

  width: 100%;
  flex: 1; /* Allows the wrapper to take up the remaining space */
  overflow: hidden; /* Prevents system scrollbar from appearing */
  border: 1px solid #383636;
}
</style>
