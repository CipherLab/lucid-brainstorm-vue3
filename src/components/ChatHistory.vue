<template>
  <q-list bordered separator class="rounded-borders overflow-hidden">
    <q-expansion-item
      v-for="(nodeId, index) in connectedNodeIds"
      :key="index"
      :label="getAccordionLabel(nodeId)"
      :expanded="index === openAccordionIndex"
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
const openAccordionIndex = ref<number>(-1); // Default to the first item
const connectedNodeIds = ref<string[]>([]);
onMounted(() => {
  const lastIndex = connectedNodeIds.value.length - 1;
  if (openAccordionIndex.value < 0) openAccordionIndex.value = lastIndex;
});

watchEffect(() => {
  console.log('accordion watchEffect:', openAccordionIndex.value);
  const lastIndex = connectedNodeIds.value.length - 1;
  if (openAccordionIndex.value < 0) openAccordionIndex.value = lastIndex;
  //openAccordionIndex.value = 0; // Reset the open accordion index
  if (props.selectedNodeId) {
    connectedNodeIds.value = [
      ...lucidFlow.getConnectedNodes(props.selectedNodeId),
      props.selectedNodeId,
    ];
  }
});
const getAccordionLabel = (nodeId: string) => {
  const nodeProps = lucidFlow.findNodeProps(nodeId);
  if (!nodeProps) {
    return 'Unknown';
  }
  return nodeProps.data.agent.name;
};
const handleAccordionToggle = (index: number) => {
  const lastIndex = connectedNodeIds.value.length - 1;

  console.log(`Accordion ${index} - ${openAccordionIndex.value} clicked`);
  if (openAccordionIndex.value === index) {
    // If the clicked accordion is already open, check if it's the first one
    if (index === lastIndex) {
      // If it's the last one, keep it open (don't allow closing)
      console.log('Cannot close the first accordion');
      return;
    } else {
      console.log('Close the accordion');
      // If it's not the last one, close it
      openAccordionIndex.value = lastIndex; //
    }
  } else {
    // If a different accordion is clicked, open it
    openAccordionIndex.value = index;
  }
  //current open node
  const currentNodeId = connectedNodeIds.value[openAccordionIndex.value];

  // Assuming NodeSelectedEvent has a structure like { id: string }
  const currentNode: NodeToggledEvent = { nodeId: currentNodeId };
  console.log('emitting node:accordion-toggled', currentNode);
  emitter.emit('node:accordion-toggled', currentNode);
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
