<template>
  <q-list bordered separator class="rounded-borders">
    <q-expansion-item
      v-for="(nodeId, index) in connectedNodeIds"
      :key="index"
      :label="getAccordionLabel(nodeId)"
      :expanded="index === openAccordionIndex"
      @toggle="handleAccordionToggle(index)"
    >
      <ChatsView :selectedNodeId="nodeId" />
    </q-expansion-item>
  </q-list>
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
} from 'vue';
import moment from 'moment';
import { useRoute } from 'vue-router';
import { LucidFlowComposable } from '../composables/useLucidFlow';
import ChatService from '../services/chatService';
import draggable from 'vuedraggable';
import ChatsView from './ChatsView.vue';
import { Message } from '../models/chatInterfaces';
//import { QMarkdown } from '@quasar/quasar-ui-qmarzkdown';
const lucidFlow = inject<LucidFlowComposable>('lucidFlow')!;

if (!lucidFlow) {
  console.error('useLucidFlow composable not found!');
  throw new Error('useLucidFlow composable not found!'); // Or handle the error appropriately
}
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
  isLocal: {
    type: Boolean,
    default: false,
  },
});
const openAccordionIndex = ref<number>(0); // Default to the first item
const connectedNodeIds = ref<string[]>([]);
onMounted(async () => {
  //get connected nodes node nodeids and get history if agent
  connectedNodeIds.value = [
    props.selectedNodeId,
    ...lucidFlow.getConnectedNodes(props.selectedNodeId),
  ];
});
const getAccordionLabel = (nodeId: string) => {
  const nodeProps = lucidFlow.findNodeProps(nodeId);
  if (!nodeProps) {
    return 'Unknown';
  }
  return nodeProps.data.agent.name;
};
const handleAccordionToggle = (index: number) => {
  if (openAccordionIndex.value === index) {
    // Prevent closing the first accordion item
    if (index === 0) return;
    openAccordionIndex.value = -1; // Close all
  } else {
    openAccordionIndex.value = index;
  }
};
</script>

<style scoped>
.sticky-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: black;
}
.thinking-indicator {
  text-align: center;
}
.message-send-button {
  height: 24px;
  width: 24px;
}
.scroll-wrapper {
  height: 65vh;

  width: 100%;
  flex: 1; /* Allows the wrapper to take up the remaining space */
  overflow: hidden; /* Prevents system scrollbar from appearing */
  border: 1px solid #383636;
}
</style>
