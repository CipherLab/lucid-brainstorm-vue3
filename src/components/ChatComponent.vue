<template>
  <div class="q-pa-md" style="height: 100%">
    <q-item-label
      class="text-grey-8 header"
      style="position: absolute; margin-top: -1.2em"
    >
      Conversation History
    </q-item-label>
    <q-layout view="lHh lpr lFf" container class="shadow-1 rounded-borders">
      <q-scroll-area
        ref="scrollAreaRef"
        class=" scroll-wrapper"
        style="height: 60vh"
        :thumb-style="{
          right: '2px',
          borderRadius: '5px',
          backgroundColor: '#027be3',
          width: '5px',
          opacity: 0.75,
        }"
        :bar-style="{ right: '0px', borderRadius: '9px', opacity: 0 }"
      >
        <q-page-container>
          <q-page style="display: flex; flex-direction: column-reverse">
            <div v-if="messages && messages.length > 0">
              <div
                bordered
                class="rounded-borders chat-history"
                ref="chatHistory"
              >
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
                                  >{{
                                    assistantNameProp
                                  }}
                                  agent</q-toolbar-title
                                >

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
                              :assistantName="assistantName"
                            />
                          </q-item-section>
                        </q-item>
                      </div>
                    </template>
                  </draggable>
                </div>
              </div>
            </div>
          </q-page>
        </q-page-container>
      </q-scroll-area>
      <q-footer bordered class="bg-grey-9 text-primary">
        <q-input
          style="color: white !important; background"
          v-model="userInput"
          label="Chat"
          dense
          :input-style="{ color: 'white' }"
          @keyup.enter="sendMessage"
        >
          <template v-slot:append>
            <q-btn dense flat @click="sendMessage">
              <img
                src="/src/assets/geminilogo.webp"
                alt="Send"
                class="message-send-button"
              />
            </q-btn>
          </template>
        </q-input>
      </q-footer>
    </q-layout>
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
import ChatMessage from './ChatMessageTwo.vue';
//import { QMarkdown } from '@quasar/quasar-ui-qmarzkdown';

defineComponent(draggable);
// TODO: 20. Delete edges
// TODO: 21. Add ability to re-order conversation history
// TODO: 40. Add node connection data to current node (context)
// TODO: 50. UI to show/manage node connections
// TODO: 60. UI to show/manage context data from other connected nodes
// TODO: 70. UI to create a custom agent
// TODO: 80. Fix QMarkdown import

// Interface for messages (add selected property)
interface Message {
  id: string;
  sender: string;
  message: string | null;
  createdAt: number;
  error: boolean;
  typing?: boolean;
  selected: boolean; // Add selected property to track selection
}
const chatList = ref(null);
const tab = ref<string>('images');
const route = useRoute();
const messages = ref<Message[]>([]);
const userInput = ref('');
const assistantName = ref('Assistant');
const chatService = inject<ChatService>('chatService')!;
const lucidFlow = inject<LucidFlowComposable>('lucidFlow')!;
const scrollAreaRef = ref(null);
const props = defineProps({
  selectedNodeId: {
    type: String,
    default: null,
  },
  assistantNameProp: {
    type: String,
    default: 'Assistant',
  },
  assistantIcon: {
    type: String,
    default: '',
  },
});
const isHeaderVisible = (index: number) => {
  return true;
};
onMounted(async () => {
  await loadChatHistory();
  //await pushDelayedResponse('Hello! How can I help you today?');
  if (!messages.value || messages.value.length === 0) {
    await pushDelayedResponse('Hello! How can I help you today?');
  }
  assistantName.value = props.assistantNameProp + ' agent';
  console.log('assistantNameProp:', props.assistantNameProp);
});

const chatHistory = ref<HTMLDivElement | null>(null); // Ref for the chat history div

// Function to scroll the chat history to the bottom

const scrollToBottom = () => {
  if (chatHistory.value && scrollAreaRef.value) {
    scrollAreaRef.value.setScrollPosition('vertical', 110000000000, 300);
  }
};

watchEffect(() => {
  const chatData = lucidFlow.getNodeChatData(props.selectedNodeId);
  if (chatData) {
    messages.value = [...chatData];
  } else {
    messages.value = [];
  }

  // Scroll after DOM updates
  nextTick(scrollToBottom);
});

watchEffect(() => {
  const chatData = lucidFlow.getNodeChatData(props.selectedNodeId);
  if (chatData) {
    messages.value = [...chatData]; // Use spread syntax to ensure reactivity
  } else {
    messages.value = [];
  }
});

async function sendMessage() {
  const tempVal = userInput.value;
  if (!tempVal || tempVal.trim() === '') return;
  userInput.value = '';

  try {
    pushImmediateRequest(tempVal); // Push user message
    pushImmediateResponse('', true); // Show thinking indicator

    const response = await chatService.sendMessage(
      tempVal,
      props.selectedNodeId
    );

    messages.value.pop(); // Remove thinking indicator
    await pushDelayedResponse(response.result); // Push assistant message

    await updateChatHistory(); // Save history (adjust logic as needed)
  } catch (error) {
    // ... [error handling]
    userInput.value = tempVal;
  } finally {
    userInput.value = ''; // Clear input field
  }
}

async function pushDelayedMessage(
  msg: string,
  sender: string,
  delay: number
): Promise<void> {
  messages.value.push({
    id: Date.UTC.toString(),
    sender,
    message: null,
    createdAt: Date.now(),
    error: false,
    typing: true,
    selected: false,
  });

  await new Promise((resolve) => setTimeout(resolve, delay));

  const lastIndex = messages.value.length - 1;
  messages.value[lastIndex] = {
    ...messages.value[lastIndex],
    message: msg,
    typing: false,
  };
  updateChatHistory();
}

async function pushDelayedResponse(msg: string) {
  await pushDelayedMessage(msg, assistantName.value, 1500);
}

function pushImmediateResponse(msg: string | undefined, typing: boolean): void {
  messages.value.push({
    id: Date.UTC.toString(),
    sender: assistantName.value,
    message: msg ?? '',
    createdAt: Date.now(),
    error: false,
    typing: typing,
    selected: false,
  });
}

function pushImmediateRequest(msg: string): void {
  messages.value.push({
    id: Date.UTC.toString(),
    sender: 'user',
    message: msg,
    createdAt: Date.now(),
    error: false,
    typing: false,
    selected: false,
  });
}

async function loadChatHistory() {
  const chatData = lucidFlow.getNodeChatData(props.selectedNodeId);
  if (chatData) {
    messages.value = chatData.map((message: any) => ({
      ...message,
      selected: false, // Add selected: false for each message loaded
    }));
  } else {
    messages.value = []; // Initialize with an empty array if no data
  }
}
async function updateChatHistory() {
  lucidFlow.updateNodeChatData(props.selectedNodeId, messages.value);
  nextTick(scrollToBottom);
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
}
</style>
