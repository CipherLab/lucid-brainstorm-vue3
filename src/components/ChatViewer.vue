<template>
  <q-page-container class="my-qpagecontainer">
    <q-page class="reverse-list">
      <div bordered class="rounded-borders">
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
                    <q-header reveal class="bg-grey-10 sticky-header">
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
                        <q-btn
                          dense
                          flat
                          @click="reRunMessage(index)"
                          v-if="primaryChat && element.sender !== 'user'"
                        >
                          <img
                            src="../assets/geminilogo.webp"
                            alt="Send"
                            class="message-send-button"
                          />
                        </q-btn>
                      </q-toolbar>
                    </q-header>

                    <!-- Chat Message Component -->
                    <ChatMessage
                      :nodeId="element.id"
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
</template>

<script setup lang="ts">
import { inject, ref, computed, watchEffect, defineComponent } from 'vue';
import { LucidFlowComposable } from '../composables/useLucidFlow';
import draggable from 'vuedraggable';
import ChatMessage from './ChatMessage.vue';
import { Message } from '../models/chatInterfaces';
import { NodeProps } from '@vue-flow/core';
//import { QMarkdown } from '@quasar/quasar-ui-qmarzkdown';

defineComponent(draggable);

const messages = ref<Message[]>([]);
const lucidFlow = inject<LucidFlowComposable>('lucidFlow')!;
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
  sendMessageData: {
    type: Function,
    required: true,
  },
});
const primaryChat = computed(() => props.isPrimaryChat); // New computed property

const nodeProps = ref<NodeProps>();

async function toggleMessageEnabled(connectedMessage: Message) {
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

  await updateChatHistory();
}

const isEnabledByNode = (connectedMessage: Message) => {
  const currentMessage = messages.value.find(
    (message) => message.id === connectedMessage.id
  );
  return currentMessage?.isEnabledByNode[props.parentNodeId] ?? true;
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
});

async function updateChatHistory() {
  lucidFlow.updateNodeChatData(props.selectedNodeId, messages.value);
}
async function deleteMessage(index: number) {
  messages.value.splice(index, 1);
  await updateChatHistory();
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
  } catch (error: any) {
    console.error('Failed to clear chat:', error);
  }
}
const isHeaderVisible = (index: number) => {
  return true;
};
const getSenderName = (sender: string) => {
  return sender === 'user' ? 'User' : nodeProps.value?.data.agent.name;
};
const formattedMessages = computed(() => {
  if (!messages.value) return [];

  return messages.value.map((message) => ({
    ...message,
    sender:
      message.sender === 'user' ? 'user' : nodeProps.value?.data.agent.name, // Extract sender from message, use nodeProps for agent name
    message: message.message,
  }));
});

async function reRunMessage(index: number) {
  if (index <= 0 || index >= messages.value.length) {
    return; // Invalid index, do nothing
  }
  await deleteMessage(index);

  // Find the last user message
  let lastUserMessageIndex = index - 1;
  while (
    lastUserMessageIndex >= 0 &&
    messages.value[lastUserMessageIndex].sender !== 'user'
  ) {
    lastUserMessageIndex--;
  }

  if (lastUserMessageIndex < 0) {
    console.warn('No user message found before this model message.');
    return;
  }

  const lastUserMessage = messages.value[lastUserMessageIndex].message;

  // Delete the current model message and any subsequent messages
  await deleteMessage(lastUserMessageIndex);

  // Trigger sending the last user message again
  await props.sendMessageData(lastUserMessage);
}
</script>
<style scoped>
/*  */
.my-qpagecontainer {
  padding: 0px !important;
}
.sticky-header {
  position: sticky;
  position: -webkit-sticky;
  top: 0;
  z-index: 10;
  background-color: black;
}
.message-send-button {
  height: 24px;
  width: 24px;
}

.q-page-container {
  padding: 0px !important;
}

.reverse-list {
  min-height: calc(100vh - 34em) !important;
  display: flex;
  flex-direction: column-reverse;
  overflow: hidden !important;
  height: 100%;
  scroll-behavior: smooth;
}

.disabled-message {
  opacity: 0.3; /* Adjust opacity as needed */
}
.q-drawer {
  top: 0 !important;
}
</style>
