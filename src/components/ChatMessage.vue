<template>
  <q-item
    class="chat-message"
    :class="{ 'user-message': isUser, 'agent-message': !isUser }"
  >
    <q-item-section>
      <q-item-label class="message-content" style="width: 100%">
        <q-spinner-dots v-if="showWorking" size="1.5em" color="grey-7" />
        <q-icon
          v-else-if="!showWorking && showError"
          name="error"
          color="red"
        />
        <template v-else>
          <div v-copy-code>
            <q-markdown :src="props.message"></q-markdown>
          </div>
        </template>
      </q-item-label>
      <q-item-label caption class="text-grey-8 text-right">
        {{ formattedTime }}
      </q-item-label>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
import { defineProps, computed, onMounted, onUnmounted, ref } from 'vue';
import moment from 'moment';
import { useQuasar } from 'quasar';
import { BaseNodeEvent, emitter, MessageReceivedEvent } from '../eventBus';
import { QMarkdown } from '@quasar/quasar-ui-qmarkdown';
const $q = useQuasar();
const props = defineProps({
  nodeId: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  sender: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Number,
    required: true,
  },
  assistantName: {
    type: String,
    default: 'Assistant',
  },
  agentIcon: {
    type: String,
    default: 'psychology', // Default icon, you can customize
  },
});

const showWorking = ref(false);
const showError = ref(false);
const isUser = computed(() => props.sender === 'user');
const formattedTime = computed(() => moment(props.createdAt).fromNow());
const messageProp = ref(props.message);

onMounted(() => {
  emitter.on('node:message-requested', handleRequested);
  emitter.on('node:message-received', handleReceived);
  emitter.on('node:message-failed', handleFailed);
});

onUnmounted(() => {
  emitter.off('node:message-requested', handleRequested);
  emitter.off('node:message-received', handleReceived);
  emitter.off('node:message-failed', handleFailed);
});

const handleRequested = (event: BaseNodeEvent) => {
  if (event.nodeId === props.nodeId) {
    showWorking.value = true;
    showError.value = false;
  }
};
const handleReceived = (event: MessageReceivedEvent) => {
  if (event.nodeId === props.nodeId) {
    showWorking.value = false;
    showError.value = false;
    messageProp.value = event.message;
  }
};
const handleFailed = (event: BaseNodeEvent) => {
  if (event.nodeId === props.nodeId) {
    showWorking.value = false;
    showError.value = true;
  }
};
</script>

<style scoped>
.chat-message {
  width: 100%; /* Occupy full width */
  border: 1px solid #2b2929;
  margin-bottom: 5px;
}

.user-message {
  background-color: #302d2d;
  border-color: #5e93d552;
}
.agent-message {
  background-color: #2b2424;
  border-color: #5e93d52a;
}
.message-part {
  word-break: break-word;
  overflow-wrap: break-word;
}
.copy-code-button {
  float: right;
  position: absolute; /* Position within the <pre> */
  top: 5px;
  right: 5px;
  padding: 4px 8px;
  font-size: 12px;
  border: none;
  border-radius: 4px;
  background-color: #eee; /* Or your preferred style */
  cursor: pointer;
}
</style>
