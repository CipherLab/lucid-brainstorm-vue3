<template>
  <q-card class="col column no-wrap my-qcard">
    <q-tabs align="justify" v-model="activeTab" dense narrow-indicator>
      <q-tab name="primary" label="Selected Chat History" />
      <q-tab name="contextual" label="Connected Chat History" />
    </q-tabs>

    <q-tab-panels
      transition-prev="jump-up"
      transition-next="jump-down"
      class="col column no-wrap items-stretch my-qtabpanels"
      v-model="activeTab"
      animated
      ref="chatHistory"
    >
      <q-tab-panel
        name="primary"
        class="col column no-wrap full-height my-qtabpanel"
      >
        <q-scroll-area class="col column no-wrap" ref="scrollAreaRef">
          <ChatHistory :selectedNodeId="selectedNodeId" :isPrimary="true" />
        </q-scroll-area>
        <q-input
          class="chat-box"
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
                src="../assets/geminilogo.webp"
                alt="Send"
                class="message-send-button"
              />
            </q-btn>
          </template>
        </q-input>
      </q-tab-panel>

      <q-tab-panel
        name="contextual"
        class="col column no-wrap full-height my-qtabpanel"
      >
        <q-scroll-area class="col column no-wrap" ref="scrollAreaRef">
          <ChatHistory :selectedNodeId="selectedNodeId" :isPrimary="false" />
        </q-scroll-area>
      </q-tab-panel>
    </q-tab-panels>
  </q-card>
</template>

<script setup lang="ts">
import {
  inject,
  ref,
  onUnmounted,
  onMounted,
  watchEffect,
  defineComponent,
  watch,
  nextTick,
} from 'vue';
import { LucidFlowComposable } from '../composables/useLucidFlow';
import draggable from 'vuedraggable';
import ChatHistory from './ChatHistory.vue';
import { ChatService, Message } from '../models/chatInterfaces';
import { emitter, NodeTabbedEvent, GenericEvent } from '../eventBus';
import { useQuasar } from 'quasar';
//import { QMarkdown } from '@quasar/quasar-ui-qmarzkdown';
const $q = useQuasar();

defineComponent(draggable);
const messages = ref<Message[]>([]);
const userInput = ref('');
const assistantName = ref('Assistant');
const chatService = inject<ChatService>('chatService')!;
const lucidFlow = inject<LucidFlowComposable>('lucidFlow')!;
const activeTab = ref('primary');
const scrollAreaRef = ref<any>(null);
const chatHistory = ref<HTMLDivElement | null>(null); // Ref for the chat history div

onMounted(() => {
  scrollToBottom();
  emitter.on('node:accordion-toggled', handleTabScrollToBottom);
});

onUnmounted(() => {
  emitter.off('node:accordion-toggled', handleTabScrollToBottom);
});
const handleTabScrollToBottom = (event: NodeTabbedEvent) => {
  console.log('1TAB scroll to bottom');
  if (event.nodeId === props.selectedNodeId) {
    console.log('2TAB scroll to bottom');
    nextTick(scrollToBottom);
  }
};
const scrollToBottom = () => {
  console.log('Scrolling to bottom');
  if (chatHistory.value && scrollAreaRef.value) {
    scrollAreaRef.value.setScrollPosition('vertical', 110000000000, 300);
  }
};
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
    //console.log('1chatService.sendMessage:', tempVal);
    pushImmediateRequest(tempVal); // Push user message

    await updateChatHistory(); // Save history (this will update the node data)
    scrollToBottom();
    //console.log('2chatService.sendMessage:', tempVal);
    // Get the Gemini response:
    const messageId = Date.now() + '';
    let messageResult = '';
    try {
      messages.value.push({
        id: messageId,
        sender: 'model',
        message: '',
        createdAt: Date.now(),
        error: false,
        typing: true,
        selected: false,
        isEnabledByNode: { [props.selectedNodeId]: true }, // Initialize for current node
      });

      await updateChatHistory();

      //update the specific last message with the new response

      emitter.emit('node:message-requested', { nodeId: messageId });

      try {
        const response = await chatService.sendMessage(
          props.selectedNodeId,
          tempVal
        );
        // Extract relevant data and create a Message object:
        messageResult = response.result;
      } catch (error) {
        let errorMessage = 'Error sending message';
        let isApiKeyError = false;
        // Check for specific error conditions
        console.log('error.message:', error.message);
        if (error.message.includes('API key expired')) {
          errorMessage = 'API key expired. Please renew the API key.';
          isApiKeyError = true;
        } else if (error.message.includes('API_KEY_INVALID')) {
          errorMessage = 'Invalid API key. Please check your API key.';
          isApiKeyError = true;
        } else if (error.message.includes('Error fetching from')) {
          errorMessage =
            'Error fetching data from the API. Please try again later.';
        }

        if (isApiKeyError) {
          emitter.emit('node:api-key-invalid', {
            data: '',
          });
        }

        $q.notify({
          message: errorMessage,
          color: 'negative',
          position: 'top',
        });
      }

      const messageToUpdate = messages.value.find(
        (msg) => msg.id === messageId
      );
      if (messageToUpdate) {
        messageToUpdate.message = messageResult;
        messageToUpdate.typing = false;
        await updateChatHistory();
      }
    } catch (error) {
      emitter.emit('node:message-failed', { nodeId: messageId });
    } finally {
      emitter.emit('node:message-received', {
        nodeId: messageId,
        message: messageResult,
      });

      scrollToBottom();
    }
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
    id: Date.now() + '',
    sender,
    message: null,
    createdAt: Date.now(),
    error: false,
    typing: true,
    selected: false,
    isEnabledByNode: { [props.selectedNodeId]: true },
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
  await pushDelayedMessage(msg, 'model', 1500);
}

function pushImmediateRequest(msg: string): void {
  messages.value.push({
    id: Date.now() + '',
    sender: 'user',
    message: msg ?? '',
    createdAt: Date.now(),
    error: false,
    typing: false,
    selected: false,
    isEnabledByNode: { [props.selectedNodeId]: true }, // Initialize for current node
  });
}

//watch not watcheffect for activetab
watch(
  () => activeTab.value,
  () => {
    if (activeTab.value === 'primary') {
      nextTick(scrollToBottom);
    }
    emitter.emit('node:q-tab-toggled', { nodeId: props.selectedNodeId });
  }
);

async function updateChatHistory() {
  //console.log('updateChatHistory', messages.value);
  lucidFlow.updateNodeChatData(props.selectedNodeId, messages.value);
}
</script>

<style scoped>
.chat-box {
  padding-top: 8px;
  border-top: 1px solid #383636;
  position: relative;
}
.q-scroll-area {
  flex-grow: 1; /* Allow the scroll area to take up the available space */
  /* ... other styles ... */
}
.message-send-button {
  height: 24px;
  width: 24px;
}

.tab-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
  width: 100%;
}
.my-qcard {
  height: 100%;
  width: 100%;
  border: 1px solid #2b2929;
  border-radius: 0px;
}
.my-qtabpanels {
  width: 100%;
  border: 1px solid #2b2929;
  border-radius: 0px;
  padding: 0px !important;
}
.my-qtabpanel {
  display: flex; /* Enable Flexbox */
  flex-direction: column; /* Stack children vertically */
  height: 100%;
  width: 100%;
  border: 1px solid #2b2929;
  border-radius: 0px;
}
</style>
