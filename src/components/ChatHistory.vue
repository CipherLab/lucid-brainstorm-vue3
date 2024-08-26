<template>
  <q-list bordered separator class="rounded-borders chat-list">
    <q-expansion-item
      v-model="state.expandedStates[index]"
      dense
      v-for="(nodeId, index) in connectedNodeIds"
      :key="index"
      :label="getAccordionLabel(nodeId)"
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
      <ChatViewer
        :parentNodeId="selectedNodeId"
        :selectedNodeId="nodeId"
        :isPrimaryChat="isPrimary"
        :sendMessageData="props.sendMessageData"
      />
    </q-expansion-item>
  </q-list>
</template>

<script setup lang="ts">
import ChatViewer from './ChatViewer.vue';
import { inject, ref, onMounted, watchEffect, reactive } from 'vue';
import { LucidFlowComposable } from '../composables/useLucidFlow';
import { emitter, NodeToggledEvent } from '../eventBus';
const expanded = ref(true);
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
  sendMessageData: {
    type: Function,
    required: true,
  },
});

const connectedNodeIds = ref<string[]>([]);

const state = reactive({
  expandedStates: [] as boolean[],
});

// Function to update the accordion states, ensuring the last is open
const updateAccordionStates = () => {
  console.log('updateAccordionStates', props.isPrimary);
  state.expandedStates.splice(
    0, // Start at the beginning
    state.expandedStates.length, // Replace the entire array
    ...connectedNodeIds.value.map((_, index) => {
      if (props.isPrimary) return true;
      return false; // Last item open by default
    })
  );
};
function isChatEnabled(nodeId: string): boolean {
  const chatData = lucidFlow.getNodeChatData(nodeId);
  if (!chatData) return true;
  // Check if the message is enabled for the given nodeId
  return chatData.every(
    (message) => message.isEnabledByNode[props.selectedNodeId] ?? true
  );
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
      message.isEnabledByNode[props.selectedNodeId] = newEnabledState;
    });
    console.log('toggleChatEnabled', newEnabledState);
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
    updateAccordionStates();
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
  // Close all other accordions
  if (props.isPrimary) {
    console.log('handleAccordionToggle', state.expandedStates);
    state.expandedStates.splice(index, 1, true);
    return;
  }

  // state.expandedStates.forEach((_, i) => {
  //   if (i === index) return;
  //   state.expandedStates[i] = false;
  // });

  console.log('handleAccordionToggle', state.expandedStates[index]);

  const newExpandedState = !state.expandedStates[index];
  state.expandedStates.splice(index, 1, newExpandedState);

  console.log('handleAccordionToggle', state.expandedStates[index]);

  emitter.emit('node:accordion-toggled', {
    nodeId: connectedNodeIds.value[index],
    totalConnections: connectedNodeIds.value.length,
  });
  return;
};
</script>

<style scoped>
.custom-header {
  display: flex;
  flex-direction: row;
  align-items: center; /* Vertical alignment */
  width: 100%;
  background: #0e0e0e;
  position: sticky !important;
  top: 0; /* Add this line to make the header sticky */
  z-index: 1; /* Optional: Ensure the header stays on top */
}

.custom-label {
  flex-grow: 1; /* Allow the label to take up available space */
}

.chat-list {
  border-radius: 1px;
  background-color: #2d2d2d;
}
</style>
