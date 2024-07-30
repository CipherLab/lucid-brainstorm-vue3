<template>
  <div class="q-pa-md" style="height: 100%">
    <q-layout view="lHh lpr lFf" container class="shadow-2 rounded-borders">
      <q-header bordered class="bg-grey-9" style="color: azure">
        <q-toolbar>
          <q-toolbar-title class="text-center">
            <q-avatar>
              <img src="/src/assets/geminilogo.webp" />
            </q-avatar>
            Chat History
          </q-toolbar-title>
        </q-toolbar>
      </q-header>

      <q-page-container>
        <q-page>
          <div v-if="messages && messages.length > 0">
            <q-list
              bordered
              class="rounded-borders chat-history"
              ref="chatHistory"
            >
              <q-item-label header class="text-grey-8"
                >Conversation History</q-item-label
              >
              <q-item
                v-for="(message, index) in messages"
                :key="index"
                tag="label"
                v-ripple
                :class="{ selected: message.selected }"
              >
                <q-item-section avatar top>
                  <q-checkbox
                    v-model="message.selected"
                    :color="message.sender === 'user' ? 'blue' : 'green'"
                  />
                </q-item-section>
                <q-item-section>
                  <q-item-label
                    :class="{ 'text-weight-bold': message.sender === 'user' }"
                  >
                    {{ message.sender === 'user' ? 'You:' : assistantName }}:
                  </q-item-label>
                  <q-item-label v-if="message.typing">
                    <q-spinner-dots size="1.5em" color="grey-7" />
                  </q-item-label>
                  <q-item-label v-else>
                    <Markdown :source="message.message" />
                  </q-item-label>
                  <q-item-label caption class="text-grey-8 text-right">
                    {{ formattedTime(message.createdAt) }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side v-if="message.sender === 'user'">
                  <div class="row q-gutter-xs">
                    <q-btn
                      size="12px"
                      flat
                      dense
                      round
                      icon="delete"
                      @click.stop="deleteMessage(index)"
                    />
                    <q-btn size="12px" flat dense round icon="more_vert" />
                  </div>
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </q-page>
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
import { inject, ref, onMounted, computed, watchEffect } from 'vue';
import moment from 'moment';
import { useRoute } from 'vue-router';
import ChatService from 'src/services/chatService';
import type { LucidFlowComposable } from 'src/composables/useLucidFlow';
//import { QMarkdown } from '@quasar/quasar-ui-qmarkdown';

// Interface for messages (add selected property)
interface Message {
  id: number;
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
  //await loadChatHistory();
  //await pushDelayedResponse('Hello! How can I help you today?');
  messages.value.push({
    sender: 'user',
    message:
      'orem ipsum dolor sit amet consectetur adipisicing elit. Fugit nihi',
    createdAt: Date.now(),
    error: false,
    typing: false,
    selected: false,
    id: '1',
  });

  // this.$nextTick(() => {
  //   if (chatList.value) {
  //     this.$q.scrollToElement(chatList.value, 'bottom');
  //   }
  // });
});

watchEffect(() => {
  if (guid.value && typeof guid.value === 'string') {
    const nodeChatData = lucidFlow.getNodeChatData(guid.value);
    messages.value = JSON.parse(nodeChatData) || [];
  }
});

const reversedMessages = computed(() => {
  if (isTargetHandleHovered.value) return 'handle-show-more';
  return [...this.messages].reverse();
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
    selected: false, // Add the 'selected' property
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
  if (!data || data == '') return;
  messages.value = JSON.parse(data) || [];
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
.message-send-button {
  height: 24px;
  width: 24px;
}
</style>
