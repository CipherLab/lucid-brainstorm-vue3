<template>
  <div class="q-pa-md" style="height: 100%">
    <q-layout view="lHh lpr lFf" container class="shadow-2 rounded-borders">
      <q-page-container>
        <q-page style="display: flex; flex-direction: column-reverse">
          <div v-if="messages && messages.length > 0">
            <div
              bordered
              class="rounded-borders chat-history"
              ref="chatHistory"
            >
              <div>
                <q-item-label header class="text-grey-8"
                  >Conversation History</q-item-label
                >
                <q-item
                  v-for="(messages, index) in messages"
                  :key="index"
                  tag="label"
                  v-ripple
                >
                  <q-item-section avatar top>
                    <q-checkbox
                      v-model="messages.selected"
                      :color="messages.sender === 'user' ? 'blue' : 'green'"
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label
                      :class="{
                        'text-weight-bold': messages.sender === 'user',
                      }"
                    >
                      {{ messages.sender === 'user' ? 'User' : assistantName }}:
                    </q-item-label>
                    <q-item-label v-if="messages.typing">
                      <q-spinner-dots size="1.5em" color="grey-7" />
                    </q-item-label>
                    <q-item-label v-else>
                      <!-- <Markdown :source="messages.message" /> -->
                      {{ messages.message }}
                    </q-item-label>
                    <q-item-label caption class="text-grey-8 text-right">
                      {{ formattedTime(messages.createdAt) }}
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side v-if="messages.sender === 'user'">
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
              </div>
            </div>
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
import { LucidFlowComposable } from '../composables/useLucidFlow';
import ChatService from '../services/chatService';
//import { QMarkdown } from '@quasar/quasar-ui-qmarkdown';

//TODO:
// 10. Delete nodes
// 20. Delete edges
// 21. Add ability to re-order conversation history
// 30. Update/Save node chat data as conversation progresses or parts of conversation are re-ordered/deleted
// 40. Add node connection data to current node (context)
// 50. UI to show/manage node connections
// 60. UI to show/manage context data from other connected nodes
// 70. UI to create a custom agent
// 80. Save/Load vue flow state (session storage enough, or need IndexDB?)
// 90. Save/Load chat history (via saving/loading vue flow state)

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
const props = defineProps({
  selectedNodeId: {
    type: String,
    default: null,
  },
  assistantNameProp: {
    type: String,
    default: 'Assistant',
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

  assistantName.value = props.assistantNameProp + ' agent';
  console.log('assistantNameProp:', props.assistantNameProp);

  // this.$nextTick(() => {
  //   if (chatList.value) {
  //     this.$q.scrollToElement(chatList.value, 'bottom');
  //   }
  // });
});

// watchEffect(() => {
//     const nodeChatData = lucidFlow.getNodeChatData(props.selectedNodeId);
//     messages.value = JSON.parse(nodeChatData) || [];
// });

const reversedMessages = computed(() => {
  if (!messages.value) return [];

  return [...messages.value].reverse();
});

async function sendMessage() {
  if (!userInput.value) return;

  try {
    pushImmediateRequest(userInput.value); // Push user message
    pushImmediateResponse('', true); // Show thinking indicator

    const response = await chatService.sendMessage(
      userInput.value,
      props.selectedNodeId
    );

    messages.value.pop(); // Remove thinking indicator
    await pushDelayedResponse(response.result); // Push assistant message

    await updateChatHistory(); // Save history (adjust logic as needed)
  } catch (error) {
    // ... [error handling]
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
