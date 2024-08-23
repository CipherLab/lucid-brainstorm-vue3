<template>
  <div class="q-pa-sm row items-center">
    <q-input
      v-model="webUrl"
      label="Web URL"
      outlined
      dense
      class="col-grow text-white"
      @input="debouncedUpdateChatHistory"
      @blur="debouncedUpdateChatHistory"
    />

    <div class="q-gutter-sm">
      <q-btn
        label="Get Data"
        @click="getDataFromUrl"
        :disable="!webUrl || webUrl.length <= 0"
        color="primary"
        unelevated
        dense
      />

      <q-btn
        icon="watch_later"
        :color="watcher ? 'green-5' : 'grey-7'"
        @click="toggleWatcher"
        :disable="!webUrl || webUrl.length <= 0"
        dense
        unelevated
        v-tooltip.bottom="{
          content: 'Enable Live Updates',
          delay: 500,
        }"
      >
        <q-tooltip anchor="bottom middle" :offset="[0, 10]" v-if="watcher">
          Watcher Active
        </q-tooltip>
        <q-tooltip anchor="bottom middle" :offset="[0, 10]" v-else>
          Watcher Inactive
        </q-tooltip>
      </q-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, inject, computed, watchEffect } from 'vue';
import { useQuasar } from 'quasar';
import { LucidFlowComposable } from '../composables/useLucidFlow';
import { debounce } from 'lodash';
import { WebDataFetcher } from '../services/webDataFetcher';

const props = defineProps({
  selectedNodeId: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(['webpage-data-updated', 'watcher-toggled']);

const webUrl = ref('');
const watcher = ref(false);
const $q = useQuasar();
const lucidFlow = inject<LucidFlowComposable>('lucidFlow')!;
const dataFetcher = new WebDataFetcher();

if (!lucidFlow) {
  $q.notify({
    message: 'LucidFlow composable not provided',
    color: 'negative',
    position: 'top',
  });
  throw new Error('lucidFlow composable not provided');
}

// Watch for changes to selectedNodeId
watchEffect(async () => {
  if (props.selectedNodeId) {
    const chatData = await lucidFlow.getNodeChatData(props.selectedNodeId);
    if (chatData && chatData.length > 0) {
      webUrl.value = chatData[0]?.webUrl || '';
      watcher.value = chatData[0]?.watcher || false;
    } else {
      webUrl.value = '';
      watcher.value = false;
    }
  } else {
    webUrl.value = '';
    watcher.value = false;
  }
});

const getDataFromUrl = async () => {
  if (webUrl.value) {
    try {
      const data = await dataFetcher.fetchData(webUrl.value);
      emit('webpage-data-updated', data);
      updateChatHistory();
    } catch (error) {
      $q.notify({
        message: error.message,
        color: 'negative',
        position: 'top',
      });
    }
  }
};

const toggleWatcher = async () => {
  watcher.value = !watcher.value;
  emit('watcher-toggled', watcher.value);
  await updateChatHistory();
};

const debouncedUpdateChatHistory = debounce(updateChatHistory, 500);

async function updateChatHistory() {
  let messages = [];

  if (!messages || messages.length === 0) {
    messages = [
      {
        id: Date.now() + '',
        sender: 'user',
        webUrl: webUrl.value,
        watcher: watcher.value,
        createdAt: Date.now(),
        error: false,
        typing: false,
        selected: true,
        isEnabledByNode: {},
      },
    ];
  }
  await lucidFlow.updateNodeChatData(props.selectedNodeId, messages);
}
</script>

<style scoped>
.input-textarea {
  width: 100%;
  min-height: 15em;
}
</style>
