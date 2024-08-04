<template>
  <div class="q-pa-md" style="height: 100%">
    <q-item-label
      class="text-grey-8 header"
      style="position: absolute; margin-top: -1.2em"
    >
      Conversation History
    </q-item-label>
    <q-layout
      view="lHh lpr lFf"
      container
      class="rounded-borders overflow-hidden"
    >
      <q-page-container
        class="overflow-hidden"
        style="padding-top: 0px !important"
      >
        <ChatHistory :selectedNodeId="selectedNodeId" />
      </q-page-container>

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
import ChatHistory from './ChatHistory.vue';
import { Message } from '../models/chatInterfaces';
//import { QMarkdown } from '@quasar/quasar-ui-qmarzkdown';

defineComponent(draggable);

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

onMounted(async () => {
  //await pushDelayedResponse('Hello! How can I help you today?');
  if (!messages.value || messages.value.length === 0) {
    await pushDelayedResponse('Hello! How can I help you today?');
  }
  assistantName.value = props.assistantNameProp + ' agent';
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
    isEnabled: true,
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
    isEnabled: true,
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
    isEnabled: true,
  });
}

async function updateChatHistory() {
  lucidFlow.updateNodeChatData(props.selectedNodeId, messages.value);
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
  border: 1px solid #383636;
}
</style>
