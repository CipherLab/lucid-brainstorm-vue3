<template>
  <div class="q-pa-sm row items-center">
    <q-input
      v-model="webUrl"
      label="Web URL"
      outlined
      dense
      class="col-grow text-white"
      @input="props.updateChatHistoryData"
      @blur="props.updateChatHistoryData"
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
import { debounce } from 'lodash';
import { WebDataFetcher } from '../services/webDataFetcher';
import { emitter } from '../eventBus';

const props = defineProps({
  selectedNode: {
    type: Object,
    default: null,
  },
  updateChatHistoryData: {
    type: Function,
    required: true,
  },
  toggleWatcherState: {
    type: Function,
    required: true,
  },
  webUrlProp: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['webpage-data-updated', 'watcher-toggled']);

const $q = useQuasar();

const dataFetcher = new WebDataFetcher();

const getDataFromUrl = async () => {
  if (webUrl.value) {
    try {
      const data = await dataFetcher.fetchData(webUrl.value);
      props.updateChatHistoryData(data);
    } catch (error) {
      $q.notify({
        message: error.message,
        color: 'negative',
        position: 'top',
      });
    }
  }
};
const webUrl = ref(props.webUrlProp);
const selectedNode = computed(() => props.selectedNode);
const toggleWatcher = async () => {
  if (selectedNode.value) {
    props.toggleWatcherState();

    emitter.emit('node:watcher-toggled', {
      nodeId: selectedNode.value.id,
      boolState: selectedNode.value.data.agent.watcher,
    });
  }
};
</script>

<style scoped>
.input-textarea {
  width: 100%;
  min-height: 15em;
}
</style>
