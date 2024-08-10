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
      <template #header>
        <div class="custom-header">
          <q-btn
            v-if="!isPrimary"
            flat
            dense
            round
            :icon="isChatEnabled(nodeId) ? 'visibility' : 'visibility_off'"
            @click.stop="toggleChatEnabled(nodeId)"
          />

          <div class="custom-label text-center">
            {{ getAccordionLabel(nodeId) }}
          </div>
        </div>
      </template>
      <ChatViewer :selectedNodeId="nodeId" :isPrimaryChat="isPrimary" />
    </q-expansion-item>
  </q-list>
</template>

<script setup lang="ts">
import ChatViewer from './ChatViewer.vue';
import { inject, ref, onMounted, watchEffect } from 'vue';
import { LucidFlowComposable } from '../composables/useLucidFlow';
import { emitter, NodeToggledEvent } from '../eventBus';

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

function isChatEnabled(nodeId: string): boolean {
  const chatData = lucidFlow.getNodeChatData(nodeId);
  if (!chatData) return true;
  // Check if the message is enabled for the given nodeId
  return chatData.every((message) => message.isEnabledByNode[nodeId] ?? true);
}
function toggleChatEnabled(nodeId: string) {
  const chatData = lucidFlow.getNodeChatData(nodeId);
  if (chatData) {
    const newEnabledState = !isChatEnabled(nodeId);
    chatData.forEach((message) => {
      // Update isEnabledByNode for the specific node ONLY
      if (!message.isEnabledByNode) {
        message.isEnabledByNode = {};
      }
      message.isEnabledByNode[nodeId] = newEnabledState;
    });
    lucidFlow.updateNodeChatData(nodeId, chatData);
  }
}
onMounted(() => {
  // Additional setup if needed
});

// Update expandedStates whenever connectedNodeIds changes
watchEffect(() => {
  if (props.selectedNodeId) {
    if (props.isPrimary) {
      connectedNodeIds.value = [props.selectedNodeId];
    } else {
      connectedNodeIds.value = lucidFlow.getConnectedNodes(
        props.selectedNodeId,
        false
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
  return nodeProps
    ? `${nodeProps.data.agent.name} - ${nodeProps.data.label}`
    : 'Unknown';
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
.custom-header {
  display: flex;
  align-items: center; /* Vertical alignment */
  justify-content: space-between; /* Horizontal spacing */
  width: 100%;
}

.custom-label {
  flex-grow: 1; /* Allow the label to take up available space */
}
</style>
