<template>
  <q-list bordered separator class="rounded-borders overflow-hidden">
    <q-expansion-item
      dense
      v-for="(nodeId, index) in connectedNodeIds"
      :key="index"
      :label="getAccordionLabel(nodeId)"
      v-model="expandedStates[index]"
      @click="handleAccordionToggle(index)"
      :disable="isPrimary"
    >
      <ChatsView :selectedNodeId="nodeId" />
    </q-expansion-item>
  </q-list>
</template>
<script setup lang="ts">
import { inject, ref, onMounted, watchEffect } from 'vue';
import { LucidFlowComposable } from '../composables/useLucidFlow';
import ChatsView from './ChatsView.vue';
import { emitter, NodeToggledEvent } from '../eventBus';
import { is } from 'quasar';
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
  isPrimary: {
    type: Boolean,
    default: false,
  },
});
const connectedNodeIds = ref<string[]>([]);
const expandedStates = ref<boolean[]>([]);
// Function to update the accordion states, ensuring the last is open
const updateAccordionStates = () => {
  expandedStates.value = connectedNodeIds.value.map((_, index) => {
    return index === 0; // Last item open by default
  });
};

onMounted(() => {
  // const toggledEvent: NodeToggledEvent = {
  //   nodeId: connectedNodeIds.value[connectedNodeIds.value.length - 1],
  //   totalConnections: connectedNodeIds.value.length,
  // };
  // emitter.emit('node:accordion-toggled', toggledEvent);
});

// Update expandedStates whenever connectedNodeIds changes
watchEffect(() => {
  if (props.selectedNodeId) {
    if (props.isPrimary) {
      connectedNodeIds.value = [props.selectedNodeId];
    } else {
      connectedNodeIds.value = lucidFlow.getConnectedNodes(
        props.selectedNodeId
      );
    }

    updateAccordionStates(); // Update accordion states when nodes change
  }
});

const getAccordionLabel = (nodeId: string) => {
  const nodeProps = lucidFlow.findNodeProps(nodeId);
  if (!nodeProps) {
    return 'Unknown';
  }
  if (nodeId === props.selectedNodeId) {
    return `${nodeProps.data.agent.name} (Current)`;
  }
  return nodeProps ? nodeProps.data.agent.name : 'Unknown';
};

const handleAccordionToggle = (index: number) => {
  // Ensure only the last item and one other can be expanded
  const thisItemsState = expandedStates.value[index];
  for (let i = 0; i < connectedNodeIds.value.length - 1; i++) {
    expandedStates[i] = false;
  }
  expandedStates[index] = !thisItemsState;

  const toggledEvent: NodeToggledEvent = {
    nodeId: connectedNodeIds.value[index],
    totalConnections: connectedNodeIds.value.length,
  };
  emitter.emit('node:accordion-toggled', toggledEvent);
  return;
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
