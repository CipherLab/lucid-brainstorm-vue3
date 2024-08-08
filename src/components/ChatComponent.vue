<template>
  <div style="height: 100%">
    <q-layout
      view="lHh lpr lFf"
      container
      class="rounded-borders overflow-hidden"
    >
      <q-tabs align="justify" v-model="activeTab" dense narrow-indicator>
        <q-tab name="primary" label="Selected Chat History" />
        <q-tab name="contextual" label="Connected Chat History" />
      </q-tabs>

      <q-tab-panels
        transition-prev="jump-up"
        transition-next="jump-down"
        class="text-white text-center tab-panels"
        v-model="activeTab"
        animated
      >
        <q-tab-panel name="primary">
          <ChatHistory :selectedNodeId="selectedNodeId" :isPrimary="true" />
        </q-tab-panel>
        <q-tab-panel name="contextual">
          <ChatHistory :selectedNodeId="selectedNodeId" :isPrimary="false" />
        </q-tab-panel>
      </q-tab-panels>

      <q-footer bordered class="bg-grey-9 text-primary chat-box">
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
  watch,
} from 'vue';
import moment from 'moment';
import { useRoute } from 'vue-router';
import { LucidFlowComposable } from '../composables/useLucidFlow';
import draggable from 'vuedraggable';
import ChatHistory from './ChatHistory.vue';
import { ChatService, Message } from '../models/chatInterfaces';
import { emitter } from '../eventBus';
//import { QMarkdown } from '@quasar/quasar-ui-qmarzkdown';

defineComponent(draggable);

const messages = ref<Message[]>([]);
const userInput = ref('');
const assistantName = ref('Assistant');
const chatService = inject<ChatService>('chatService')!;
const lucidFlow = inject<LucidFlowComposable>('lucidFlow')!;
const activeTab = ref('primary');
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
    console.log('1chatService.sendMessage:', tempVal);
    pushImmediateRequest(tempVal); // Push user message
    await updateChatHistory(); // Save history (this will update the node data)
    console.log('2chatService.sendMessage:', tempVal);
    // Get the Gemini response:
    try {
      emitter.emit('node:message-requested', { nodeId: props.selectedNodeId });

      const response = await chatService.sendMessage(
        tempVal,
        props.selectedNodeId
      );

      console.log('chat response:', response);

      // Extract relevant data and create a Message object:
      const newMessage: Message = {
        id: Date.now().toString(), // Use a suitable ID generator if needed
        sender: assistantName.value,
        message: response.result, // Access the correct property
        createdAt: Date.now(),
        error: false,
        typing: false, // Set typing to false as the message has been received
        selected: false,
        isEnabled: true,
      };

      // Update the chat history in lucidFlow
      messages.value.push(newMessage);
    } catch (error) {
      emitter.emit('node:message-failed', { nodeId: props.selectedNodeId });
    } finally {
      emitter.emit('node:message-received', { nodeId: props.selectedNodeId });
    }
    await updateChatHistory();
  } catch (error) {
    // ... [error handling - potentially re-add the user input]
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
//watch not watcheffect for activetab
watch(
  () => activeTab.value,
  (newValue) => {
    console.log('activeTab:', newValue);
    emitter.emit('node:q-tab-toggled', { nodeId: props.selectedNodeId });
  }
);

async function updateChatHistory() {
  console.log('updateChatHistory', messages.value);
  lucidFlow.updateNodeChatData(props.selectedNodeId, messages.value);
}
</script>

<style scoped>
.chat-box {
  background-color: #2b2929;
  padding: 6px;
  border-top: 1px solid #383636;
}
.message-send-button {
  height: 24px;
  width: 24px;
}
.tab-panels {
  display: flex;
  flex: 1;
}
</style>
