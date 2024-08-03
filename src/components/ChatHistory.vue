<template>
  <q-list bordered separator class="rounded-borders">
    <q-expansion-item
      v-for="(chat, index) in chatData"
      :key="index"
      :label="getAccordionLabel(chat)"
    >
      <q-list bordered separator class="rounded-borders" dense>
        <q-item
          v-for="(message, msgIndex) in chat.messages"
          :key="msgIndex"
          tag="label"
          v-ripple
        >
          <q-item-section avatar>
            <q-icon :name="getMessageIcon(message.sender)" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ message.message }}</q-item-label>
            <q-item-label caption class="text-grey-8">
              {{ formattedTime(message.createdAt) }}
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-btn
              v-if="chat.isLocal"
              size="12px"
              flat
              dense
              round
              icon="delete"
              @click.stop="deleteMessage(index, msgIndex)"
            />
            <q-btn
              v-else
              size="12px"
              flat
              dense
              round
              icon="visibility_off"
              @click.stop="toggleMessageVisibility(index, msgIndex)"
            />
          </q-item-section>
        </q-item>
      </q-list>
    </q-expansion-item>
  </q-list>
</template>

<script setup lang="ts">
import { computed, defineProps, ref, inject, onMounted, watch } from 'vue';
import moment from 'moment';
import { LucidFlowComposable } from '../composables/useLucidFlow';

interface Message {
  sender: string;
  message: string;
  createdAt: number;
  isVisible: boolean; // Add isVisible property
}

interface ChatData {
  nodeId: string;
  isLocal: boolean;
  messages: Message[];
}

const props = defineProps<{
  selectedNodeId: string;
}>();

const lucidFlow = inject<LucidFlowComposable>('lucidFlow')!;
if (!lucidFlow) {
  throw new Error('LucidFlow composable not injected!');
}

const chatData = ref<ChatData[]>([]);
const formattedTime = computed(() => {
  return (createdAt: number) => moment(createdAt).fromNow();
});

const getAccordionLabel = (chat: ChatData) => {
  if (chat.isLocal) {
    return 'Local Chat';
  } else {
    return `Chat from Node ${chat.nodeId}`;
  }
};

const getMessageIcon = (sender: string) => {
  return sender === 'user' ? 'person' : 'psychology';
};
// Inside ChatHistory.vue script:
const allMessagesVisible = ref(true); // Start with all messages visible
const nodeId = ref(props.selectedNodeId);

const filteredMessages = computed(() => {
  return chatData.value.flatMap((chat) => {
    if (chat.isLocal || allMessagesVisible.value) {
      return chat.messages;
    } else {
      return chat.messages.filter((message) => message.isVisible);
    }
  });
});
const deleteMessage = (chatIndex: number, msgIndex: number) => {
  chatData.value[chatIndex].messages.splice(msgIndex, 1);
  // Emit an event to update the chat history in the Vue Flow node
  if (chatData.value[chatIndex].isLocal) {
    updateLocalChatHistory();
  }
};

// Function to toggle message visibility
const toggleMessageVisibility = (chatIndex: number, msgIndex: number) => {
  chatData.value[chatIndex].messages[msgIndex].isVisible =
    !chatData.value[chatIndex].messages[msgIndex].isVisible;
  if (chatData.value[chatIndex].isLocal) {
    updateLocalChatHistory(); // Update the actual chat history
  }
};

// Watch for changes in the selectedNodeId
watch(
  () => props.selectedNodeId,
  () => {
    loadChatHistory();
  }
);

async function loadChatHistory() {
  const localChat = lucidFlow.getNodeChatData(props.selectedNodeId) || [];
  chatData.value = [
    {
      nodeId: props.selectedNodeId,
      isLocal: true,
      messages: localChat.map((message: any) => ({
        ...message,
        isVisible: true, // Initially all local messages are visible
      })),
    },
  ];

  const connectedNodes = lucidFlow.getConnectedNodes(props.selectedNodeId);

  for (const nodeId of connectedNodes) {
    const messages = lucidFlow.getNodeChatData(nodeId) || [];
    chatData.value.push({
      nodeId: nodeId,
      isLocal: false,
      messages: messages.map((message: any) => ({
        ...message,
        isVisible: true, // Initially all connected messages are visible
      })),
    });
  }
}

const updateLocalChatHistory = () => {
  const visibleMessages = chatData.value[0].messages.filter(
    (message) => message.isVisible
  );
  lucidFlow.updateNodeChatData(props.selectedNodeId, visibleMessages);
};

onMounted(() => {
  loadChatHistory();
});
</script>
