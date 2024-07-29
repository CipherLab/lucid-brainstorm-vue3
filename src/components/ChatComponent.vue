<template>
  <div class="chat-container q-pa-md column full-height">
    <q-list>
      <q-item v-for="(message, index) in messages" :key="index">
        <q-item-section>
          <q-item-label :class="{ 'user-message': message.sender === 'user' }">
            <div class="message-header">
              <span class="sender-name">{{ message.sender }}</span>
              <span class="timestamp">{{
                formattedTime(message.createdAt)
              }}</span>
            </div>
            <div v-if="message.typing" class="thinking-indicator q-mt-sm">
              <q-spinner-dots size="1.5rem" color="grey-8" />
            </div>
            <div v-else class="message-content q-mt-sm">
              <Markdown :source="message.message" />
            </div>
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
    <q-footer>
      <q-toolbar>
        <q-input v-model="userInput" @keyup.enter="sendMessage">
          <template v-slot:append>
            <q-btn round dense flat icon="send" @click="sendMessage"></q-btn>
          </template>
        </q-input>
      </q-toolbar>
    </q-footer>
  </div>
</template>

<script setup lang="ts">
import { inject, ref, onMounted, computed, watchEffect } from 'vue';
import moment from 'moment';
import { useRoute } from 'vue-router';
import ChatService from 'src/services/chatService';
import type { LucidFlowComposable } from 'src/composables/useLucidFlow';

// Interface for messages (add selected property)
interface Message {
  sender: string;
  message: string | null;
  createdAt: number;
  error: boolean;
  typing?: boolean;
  selected: boolean; // Add selected property to track selection
}

const route = useRoute();
const guid = computed(() => route.query.guid);
const messages = ref<Message[]>([]);
const userInput = ref('');
const assistantName = ref('ArpWave Assistant');
const chatService = inject<ChatService>('chatService')!;
const lucidFlow = inject<LucidFlowComposable>('lucidFlow')!;
const props = defineProps({
  selectedNodeId: {
    type: String,
    default: null,
  },
});
onMounted(async () => {
  await loadChatHistory();
  await pushDelayedResponse('Hello! How can I help you today?');
});

watchEffect(() => {
  if (guid.value && typeof guid.value === 'string') {
    const nodeChatData = lucidFlow.getNodeChatData(guid.value);
    messages.value = JSON.parse(nodeChatData) || [];
  }
});

async function sendMessage() {
  if (!userInput.value) return; // Don't send empty messages

  try {
    await updateChatHistory();
  } catch (error) {
    // Handle error
  }
}

// async function loadChatHistory() {
//   if (guid.value && typeof guid.value === 'string') {
//     const nodeChatData = lucidFlow.getNodeChatData(guid.value);
//     messages.value = JSON.parse(nodeChatData) || [];
//   }
// }

// async function updateChatHistory() {
//   sessionStorage.setItem('chatHistory', JSON.stringify(messages.value)); // Or save to session
// }

async function pushDelayedMessage(
  msg: string,
  sender: string,
  delay: number
): Promise<void> {
  messages.value.push({
    sender,
    message: null,
    createdAt: Date.now(),
    error: false,
    typing: true,
  });

  await new Promise((resolve) => setTimeout(resolve, delay));

  const lastIndex = messages.value.length - 1;
  messages.value[lastIndex] = {
    ...messages.value[lastIndex],
    message: msg,
    typing: false,
  };
}

async function pushDelayedResponse(msg: string) {
  await pushDelayedMessage(msg, assistantName.value, 1500);
}

function pushImmediateResponse(msg: string | undefined, typing: boolean): void {
  messages.value.push({
    sender: assistantName.value,
    message: msg,
    createdAt: Date.now(),
    error: false,
    typing: typing,
    selected: false, // Initialize as not selected
  });
}

function pushImmediateRequest(msg: string): void {
  messages.value.push({
    sender: 'user',
    message: msg,
    createdAt: Date.now(),
    error: false,
    typing: false,
    selected: false, // Initialize as not selected
  });
}

async function loadChatHistory() {
  const data = lucidFlow.getNodeChatData(props.selectedNodeId);
  if (!data) return;
  messages.value = JSON.parse() || [];
  // const savedHistory = sessionStorage.getItem('chatHistory'); // Or get from session
  // if (savedHistory) {
  //   messages.value = JSON.parse(savedHistory);
  // }
}

async function updateChatHistory() {
  sessionStorage.setItem('chatHistory', JSON.stringify(messages.value)); // Or save to session
}
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
function deleteMessage(index: number) {
  messages.value.splice(index, 1);
}
function formattedTime(createdAt: number): string {
  return moment(createdAt).fromNow();
}
async function pushDelayedRequest(msg: string) {
  await pushDelayedMessage(msg, 'user', 500);
}
</script>

<style scoped>
.thinking-indicator {
  text-align: center;
}
</style>
