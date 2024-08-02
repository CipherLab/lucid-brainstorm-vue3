<template>
  <div
    class="chat-message"
    :class="{ 'user-message': isUser, 'agent-message': !isUser }"
  >
    <q-item-label v-if="typing">
      <q-spinner-dots size="1.5em" color="grey-7" />
    </q-item-label>
    <q-item-label v-else>
      {{ message }}
    </q-item-label>
    <q-item-label caption class="text-grey-8 text-right">
      {{ formattedTime }}
    </q-item-label>
  </div>
</template>

<script setup lang="ts">
import { defineProps, computed } from 'vue';
import moment from 'moment';

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
  typing: {
    type: Boolean,
    default: false,
  },
  assistantName: {
    type: String,
    default: 'Assistant',
  },
});

const isUser = computed(() => props.sender === 'user');
const formattedTime = computed(() => moment(props.createdAt).fromNow());
</script>

<style scoped>
.chat-message {
  padding: 10px;
  border: 1px solid #2b2929;
  margin-bottom: 5px;
}

.user-message {
  background-color: #302d2d;
}
.agent-message {
  background-color: #222020;
}
</style>
