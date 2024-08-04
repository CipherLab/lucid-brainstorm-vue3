<template>
  <q-list bordered separator class="rounded-borders overflow-hidden">
    <q-expansion-item
      v-for="(nodeId, index) in connectedNodeIds"
      :key="index"
      :label="getAccordionLabel(nodeId)"
      v-model="expandedStates[index]"
      @click="handleAccordionToggle(index)"
      :disable="index === connectedNodeIds.length - 1"
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
import { emit } from 'process';
import { emitter, NodeSelectedEvent, NodeToggledEvent } from '../eventBus';
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
const connectedNodeIds = ref<string[]>([]);
const expandedStates = ref<boolean[]>([]);
// Function to update the accordion states, ensuring the last is open
const updateAccordionStates = () => {
  expandedStates.value = connectedNodeIds.value.map((_, index) => {
    return index === connectedNodeIds.value.length - 1; // Last item open by default
  });
};

onMounted(() => {
  updateAccordionStates();
});

// Update expandedStates whenever connectedNodeIds changes
watchEffect(() => {
  if (props.selectedNodeId) {
    connectedNodeIds.value = [
      ...lucidFlow.getConnectedNodes(props.selectedNodeId),
      props.selectedNodeId,
    ];
    updateAccordionStates(); // Update accordion states when nodes change
  }
});

const getAccordionLabel = (nodeId: string) => {
  const nodeProps = lucidFlow.findNodeProps(nodeId);
  return nodeProps ? nodeProps.data.agent.name : 'Unknown';
};

const handleAccordionToggle = (index: number) => {
  // Ensure only the last item and one other can be expanded
  expandedStates.value = expandedStates.value.map((state, i) => {
    return i === index || i === connectedNodeIds.value.length - 1;
  });
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
