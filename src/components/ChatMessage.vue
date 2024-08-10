<template>
  <div
    class="chat-message"
    :class="{ 'user-message': isUser, 'agent-message': !isUser }"
  >
    <q-item-label v-if="showWorking">
      <q-spinner-dots size="1.5em" color="grey-7" />
    </q-item-label>
    <q-item-label v-else-if="!showWorking && showError">
      <q-icon name="error" color="red" />
    </q-item-label>
    <q-item-label v-else>
      <div v-html="renderedMessage"></div>
    </q-item-label>
    <q-item-label caption class="text-grey-8 text-right">
      {{ formattedTime }}
    </q-item-label>
  </div>
</template>

<script setup lang="ts">
import { defineProps, computed, onMounted, onUnmounted, ref } from 'vue';
import moment from 'moment';
import markdownIt from 'markdown-it';
import { BaseNodeEvent, emitter } from '../eventBus';

const props = defineProps({
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
});

const md = markdownIt({ breaks: true }); // breaks: true ensures that line breaks are preserved

const showWorking = ref<boolean>(false);
const showError = ref<boolean>(false);
const isUser = computed(() => props.sender === 'user');
const formattedTime = computed(() => moment(props.createdAt).fromNow());

const renderedMessage = computed(() => md.render(props.message));

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
  showWorking.value = true;
  showError.value = false;
};
const handleReceived = (event: BaseNodeEvent) => {
  showWorking.value = false;
  showError.value = false;
};
const handleFailed = (event: BaseNodeEvent) => {
  showWorking.value = false;
  showError.value = true;
};
</script>

<style scoped>
.chat-message {
  padding: 10px;
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
</style>
