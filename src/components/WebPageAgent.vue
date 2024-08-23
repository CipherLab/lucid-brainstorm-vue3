<template>
  <div class="full-width">
    <div class="row items-center q-gutter-sm">
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

      <q-input
        v-model="webUrl"
        label="Web URL"
        outlined
        dense
        class="col-grow text-white"
        @input="props.updateChatHistoryData"
        @blur="onTextBlur"
        style="flex: 1"
      />

      <q-btn
        label="Get Data"
        @click="getDataFromUrl"
        :disable="!webUrl || webUrl.length <= 0"
        color="primary"
        unelevated
        dense
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
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

const $q = useQuasar();

const dataFetcher = new WebDataFetcher();
const watcher = computed(() => props.selectedNode?.data.agent.watcher);
const getDataFromUrl = async () => {
  if (webUrl.value) {
    try {
      const data = await dataFetcher.fetchData(webUrl.value);
      props.updateChatHistoryData(data);
    } catch (error: any) {
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
const onTextBlur = () => {
  if (selectedNode.value) {
    props.updateChatHistoryData();
  }
};
</script>

<style scoped>
.input-textarea {
  width: 100%;
  min-height: 15em;
}
</style>
