<template>
  <q-scroll-area ref="scrollAreaRef" class="scroll-wrapper">
    <q-page-container>
      <q-page class="reverse-list">
        <div bordered class="rounded-borders chat-history" ref="chatHistory">
          <div>
            <draggable
              :list="formattedMessages"
              item-key="id"
              handle=".drag-handle"
              @end="onDragEnd"
            >
              <template #item="{ element, index }">
                <div
                  :key="element.id"
                  :class="{
                    'disabled-message': !isEnabledByNode(element),
                  }"
                >
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

                          <!-- Eye Icon Button -->
                          <q-btn
                            v-if="!primaryChat"
                            size="12px"
                            flat
                            dense
                            round
                            :icon="
                              isEnabledByNode(element)
                                ? 'visibility'
                                : 'visibility_off'
                            "
                            @click.stop="toggleMessageEnabled(element)"
                          />

                          <!-- Delete Button (only for primary chat) -->
                          <q-btn
                            v-if="primaryChat"
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
                        :assistantName="getSenderName(element.sender)"
                      />
                    </q-item-section>
                  </q-item>
                </div>
              </template>
            </draggable>
          </div>
        </div>
      </q-page>
    </q-page-container>
  </q-scroll-area>
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
  onUnmounted,
} from 'vue';
import moment from 'moment';
import { useRoute } from 'vue-router';
import { LucidFlowComposable } from '../composables/useLucidFlow';
import draggable from 'vuedraggable';
import ChatMessage from './ChatMessage.vue';
import { Message } from '../models/chatInterfaces';
import { NodeProps } from '@vue-flow/core';
import { emitter, BaseNodeEvent, NodeTabbedEvent } from '../eventBus';
//import { QMarkdown } from '@quasar/quasar-ui-qmarzkdown';

defineComponent(draggable);

const messages = ref<Message[]>([]);
const userInput = ref('');
const lucidFlow = inject<LucidFlowComposable>('lucidFlow')!;
const scrollAreaRef = ref<any>(null);
const props = defineProps({
  parentNodeId: {
    type: String,
    default: '',
  },
  selectedNodeId: {
    type: String,
    default: '',
  },
  isPrimaryChat: {
    type: Boolean,
    default: false,
  },
});
const primaryChat = computed(() => props.isPrimaryChat); // New computed property

const nodeProps = ref<NodeProps>();

onMounted(() => {
  // emitter.on('node:selected', handleScrollToBottom);
  emitter.on('node:accordion-toggled', handleTabScrollToBottom);
  // emitter.on('node:q-tab-toggled', handleScrollToBottom);
});

onUnmounted(() => {
  // emitter.off('node:selected', handleScrollToBottom);
  emitter.off('node:accordion-toggled', handleTabScrollToBottom);
  // emitter.off('node:q-tab-toggled', handleScrollToBottom);
});
function toggleMessageEnabled(connectedMessage: Message) {
  const nodeId = props.selectedNodeId; // Get the ID of the currently selected node
  const message = messages.value.find(
    (message) => message.id === connectedMessage.id
  );
  if (!message) {
    console.error('Message not found:', connectedMessage);
    return;
  }

  // Toggle the isEnabled state for the current node
  message.isEnabledByNode[props.parentNodeId] =
    !message.isEnabledByNode[props.parentNodeId];

  updateChatHistory();
}

const isEnabledByNode = (connectedMessage: Message) => {
  const currentMessage = messages.value.find(
    (message) => message.id === connectedMessage.id
  );
  return currentMessage?.isEnabledByNode[props.parentNodeId] ?? true;
};
const handleTabScrollToBottom = (event: NodeTabbedEvent) => {
  if (event.nodeId === props.selectedNodeId) {
    //console.log('TAB scroll to bottom');
    nextTick(scrollToBottom);
  }
};
const scrollToBottom = () => {
  //console.log('Scrolling to bottom');
  if (chatHistory.value && scrollAreaRef.value) {
    scrollAreaRef.value.setScrollPosition('vertical', 110000000000, 300);
  }
};
watchEffect(() => {
  nodeProps.value = lucidFlow.findNodeProps(props.selectedNodeId);
  const chatData = lucidFlow.getNodeChatData(props.selectedNodeId);
  if (chatData) {
    messages.value = chatData.map((message: Message) => ({
      ...message,
      selected: false, // Add selected: false for each message loaded
    }));
  } else {
    messages.value = []; // Initialize with an empty array if no data
  }
  nextTick(scrollToBottom);
});

async function updateChatHistory() {
  lucidFlow.updateNodeChatData(props.selectedNodeId, messages.value);
}
function deleteMessage(index: number) {
  messages.value.splice(index, 1);
  updateChatHistory();
}

const onDragEnd = () => {
  // Force a re-evaluation of the computed property:
  const temp = formattedMessages.value; // Trigger a re-evaluation
  messages.value = [...temp]; // Update the original array

  updateChatHistory(); // Save the changes
};
const messageIsEnabledForNode = computed(() => (message: Message) => {
  return message.isEnabledByNode[props.selectedNodeId] ?? true;
});
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
const chatHistory = ref<HTMLDivElement | null>(null); // Ref for the chat history div
const formattedMessages = computed(() => {
  if (!messages.value) return [];

  return messages.value.map((message) => ({
    ...message,
    sender:
      message.sender === 'user' ? 'user' : nodeProps.value?.data.agent.name, // Extract sender from message, use nodeProps for agent name
    message: message.message,
  }));
});
</script>
<style scoped>
.scroll-wrapper {
  height: 45vh;
  display: flex;
  width: 100%;
  flex: 1; /* Allows the wrapper to take up the remaining space */
  overflow: hidden; /* Prevents system scrollbar from appearing */
  border: 1px solid #383636;
}
.sticky-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: black;
}
.message-send-button {
  height: 24px;
  width: 24px;
}

.q-page-container {
  padding-top: 0px !important;
}
.reverse-list {
  display: flex;
  flex-direction: column-reverse;
  overflow: hidden !important;
}
.disabled-message {
  opacity: 0.3; /* Adjust opacity as needed */
}
</style>
