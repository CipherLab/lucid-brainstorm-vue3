<template>
  <div class="q-pa-md row justify-center">
    <div style="width: 100%; max-width: 400px">
      <div v-for="(message, index) in messages" :key="index">
        <q-chat-message
          :name="message.sender"
          :text="[message.message]"
          :sent="message.sender === 'user'"
          :stamp="formattedTime(message.createdAt)"
        >
          <div v-if="message.typing" class="thinking-indicator">
            <q-spinner-dots size="2rem" />
          </div>
          <div v-else>
            <Markdown :source="message.message" />
          </div>
        </q-chat-message>
      </div>
      <q-input
        outlined
        v-model="userInput"
        label="Type your message here"
        maxlength="500"
        @keyup.enter="sendMessage"
      >
        <template v-slot:append>
          <q-btn round dense flat icon="send" @click="sendMessage"></q-btn>
        </template>
      </q-input>
      <q-btn dense @click="clearChat">clear history</q-btn>
    </div>
  </div>
</template>
<script setup lang="ts">
import { inject, ref, onMounted, computed } from 'vue';
import moment from 'moment';
//import Markdown from 'vue3-markdown-it';
import { useRoute } from 'vue-router';
import ChatService from 'src/services/chatService'; // Import the interface
import type { LucidFlowComposable } from 'src/composables/useLucidFlow'; // Import the type

const chatService = inject<ChatService>('chatService')!; // Inject the service
if (!chatService) {
  throw new Error('Chat service not provided!');
}

const lucidFlow = inject<LucidFlowComposable>('lucidFlow')!; // Inject the composable
if (!lucidFlow) {
  throw new Error('lucidFlow composable not provided');
}
const props = defineProps({
  selectedNodeId: {
    type: String,
    required: true,
  },
});
interface Message {
  sender: string;
  message: string | null;
  createdAt: number;
  error: boolean;
  typing?: boolean; // Optional for thinking indicator
}

const route = useRoute();
const guid = computed(() => route.query.guid);
const messages = ref<Message[]>([]);
const userInput = ref('');
const assistantName = ref('ArpWave Assistant');

const formattedTime = computed(() => {
  return (createdAt: number) => moment(createdAt).fromNow();
});

onMounted(async () => {
  //await loadChatHistory();
  //await pushDelayedResponse('Hello! How can I help you today?');
});

async function sendMessage() {
  if (!userInput.value) return; // Don't send empty messages

  try {
    const tempVal = userInput.value;
    userInput.value = '';

    pushImmediateRequest(tempVal);
    pushImmediateResponse('', true);

    const response = await chatService.sendMessage(
      tempVal,
      props.selectedNodeId
    );

    messages.value.pop(); // Remove loading dots
    await pushDelayedResponse(response.result);

    await updateChatHistory();
  } catch (error) {
    console.error('Error sending message:', error);
    messages.value.pop(); // Remove loading dots
    await pushDelayedResponse(
      'Error communicating with server. Please try again later.'
    );
  }
}

async function loadChatHistory() {
  messages.value =
    JSON.parse(lucidFlow.getNodeChatData(props.selectedNodeId)) || [];
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
async function pushDelayedMessage(
  msg: string,
  sender: string,
  delay: number
): Promise<void> {
  messages.value.push({
    sender: sender,
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
    message: msg ?? '',
    createdAt: Date.now(),
    error: false,
    typing: typing,
  });
}
function pushImmediateRequest(msg: string): void {
  messages.value.push({
    sender: 'user',
    message: msg,
    createdAt: Date.now(),
    error: false,
    typing: false,
  });
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
