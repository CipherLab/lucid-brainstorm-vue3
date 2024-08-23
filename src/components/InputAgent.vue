<template>
  <div class="q-pa-md">
    <q-input
      class="text-light"
      v-model="textInputData"
      :label="hintText"
      filled
      type="textarea"
      @input="updateChatHistory"
      @blur="updateChatHistory"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, inject, computed, watchEffect } from 'vue';
import { useQuasar } from 'quasar';
import { LucidFlowComposable } from '../composables/useLucidFlow';
import { debounce } from 'lodash';

const props = defineProps({
  selectedNodeId: {
    type: String,
    default: null,
  },
});

const textInputData = ref('');
const $q = useQuasar();
const lucidFlow = inject<LucidFlowComposable>('lucidFlow')!;

if (!lucidFlow) {
  $q.notify({
    message: 'LucidFlow composable not provided',
    color: 'negative',
    position: 'top',
  });
  throw new Error('lucidFlow composable not provided');
}

const hintText = computed(() => {
  if (textInputData.value) {
    return 'Data is loaded';
  } else {
    return 'Enter something';
  }
});

// Watch for changes to selectedNodeId
watchEffect(async () => {
  if (props.selectedNodeId) {
    const chatData = await lucidFlow.getNodeChatData(props.selectedNodeId);
    if (chatData && chatData.length > 0) {
      textInputData.value = chatData[0]?.message || '';
    } else {
      textInputData.value = '';
    }
  } else {
    textInputData.value = '';
  }
});

// Debounce the updateChatHistory function
const debouncedUpdateChatHistory = debounce(updateChatHistory, 500);

async function updateChatHistory() {
  let messages = [];

  if (!messages || messages.length === 0) {
    messages = [
      {
        id: Date.now() + '',
        sender: 'user',
        message: textInputData.value,
        createdAt: Date.now(),
        error: false,
        typing: false,
        selected: true,
        isEnabledByNode: {},
      },
    ];
  } else {
    messages[0] = {
      ...messages[0],
      message: textInputData.value,
    };
  }

  await lucidFlow.updateNodeChatData(props.selectedNodeId, messages);
}
</script>
