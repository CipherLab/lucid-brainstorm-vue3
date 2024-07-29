<template>
  <q-list padding class="my-bg-grey-1">
    <q-item-label header>Agents</q-item-label>
    <q-expansion-item
      class="my-bg-grey-1"
      v-for="agent in availableAgents"
      :key="agent.id"
      expand-separator
      :icon="agent.icon"
      :label="agent.name"
      :style="{ '--agent-color': agent.color }"
      draggable="true"
      @dragstart="onAgentDragStart(agent, $event)"
    >
      <q-card>
        <q-card-section>
          <!-- Add agent details here -->
          <q-input
            v-model="agent.systemInstructions"
            label="System Instructions"
            filled
            autogrow
          />
        </q-card-section>
      </q-card>
    </q-expansion-item>
  </q-list>

  <q-separator />

  <q-list class="my-bg-grey-1" padding>
    <q-item-label header>Inputs</q-item-label>
    <q-expansion-item
      v-for="input in availableInputs"
      :key="input.id"
      expand-separator
      :icon="input.icon"
      :label="input.name"
      draggable="true"
      @dragstart="onInputDragStart(input, $event)"
    >
      <q-card>
        <q-card-section>
          <span class="label">{{ input.systemInstructions }}</span>
        </q-card-section>
      </q-card>
    </q-expansion-item>
  </q-list>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';

const drawerOpen = ref(true);
const availableAgents = reactive([
  {
    id: 1,
    systemInstructions: 'This is a logical agent best for logical tasks',
    name: 'Logical',
    icon: 'psychology',
    color: '#145ea8',
    hasOutput: true,
    hasInput: true,
    type: 'agent',
    temperature: 0,
  },
  {
    id: 2,
    systemInstructions: 'This is a creative agent best for creative tasks',
    name: 'Creative',
    icon: 'tips_and_updates',
    color: 'green',
    hasOutput: true,
    hasInput: true,
    type: 'agent',
    temperature: 2,
  },
  {
    id: 3,
    name: 'Wise',
    systemInstructions: 'This is a wise agent best for wise tasks',
    icon: 'self_improvement',
    color: 'purple',
    hasOutput: true,
    hasInput: true,
    type: 'agent',
    temperature: 1,
  },
]);
const availableInputs = reactive([
  {
    id: 100,
    systemInstructions: 'This is a file input',
    name: 'File',
    subtype: 'file',
    icon: 'attach_file',
    color: 'lightgray',
    hasOutput: true,
    hasInput: false,
    type: 'input',
    inputData: '',
  },
  {
    id: 101,
    systemInstructions: 'This is a prompt input',
    name: 'Prompt',
    subtype: 'prompt',
    icon: 'chat',
    color: 'lightgreen',
    hasOutput: true,
    hasInput: false,
    type: 'input',
    inputData: '',
  },
  {
    id: 102,
    systemInstructions: 'This is a webpage input',
    name: 'Webpage',
    subtype: 'webpage',
    icon: 'web',
    color: 'lightblue',
    hasOutput: true,
    hasInput: false,
    type: 'input',
    inputData: '',
  },
]);
const onAgentDragStart = (agent: any, event: DragEvent) => {
  if (!event.dataTransfer) return;
  event.dataTransfer.setData('text/plain', JSON.stringify(agent)); // Pass the whole agent object
};

const onInputDragStart = (input: any, event: DragEvent) => {
  if (!event.dataTransfer) return;
  event.dataTransfer.setData('text/plain', JSON.stringify(input));
};
</script>

<style scoped>
.my-bg-grey-1 {
  background-color: #151516 !important;
}

:deep(.q-expansion-item__label) {
  color: var(--agent-color);
}

:deep(.q-expansion-item__icon) {
  color: var(--agent-color);
}
</style>
