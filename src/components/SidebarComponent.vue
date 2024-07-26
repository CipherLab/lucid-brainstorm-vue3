<template>
  <q-drawer
    side="left"
    v-model="drawerOpen"
    bordered
    :width="250"
    :breakpoint="1024"
  >
    <q-list padding>
      <q-item-label header>Agents</q-item-label>
      <q-item
        v-for="agent in availableAgents"
        :key="agent.id"
        draggable="true"
        @dragstart="onAgentDragStart(agent, $event)"
      >
        <q-item-section avatar>
          <q-avatar :color="agent.color">
            <q-icon :name="agent.icon" />
          </q-avatar>
        </q-item-section>
        <q-item-section>{{ agent.name }}</q-item-section>
      </q-item>
    </q-list>

    <q-separator />

    <q-list padding>
      <q-item-label header>Inputs</q-item-label>
      <q-item
        v-for="input in availableInputs"
        :key="input.type"
        draggable="true"
        @dragstart="onInputDragStart(input, $event)"
      >
        <q-item-section avatar>
          <q-avatar :color="input.color">
            <q-icon :name="input.icon" />
          </q-avatar>
        </q-item-section>
        <q-item-section>{{ input.name }}</q-item-section>
      </q-item>
    </q-list>
  </q-drawer>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';

const drawerOpen = ref(true);
const availableAgents = reactive([
  {
    id: 1,
    name: 'Logical',
    icon: 'psychology',
    color: 'blue',
    hasOutput: true,
    hasInput: true,
    type: 'agent',
  },
  {
    id: 2,
    name: 'Creative',
    icon: 'tips_and_updates',
    color: 'green',
    hasOutput: true,
    hasInput: true,
    type: 'agent',
  },
  {
    id: 3,
    name: 'Wise',
    icon: 'self_improvement',
    color: 'purple',
    hasOutput: true,
    hasInput: true,
    type: 'agent',
  },
]);
const availableInputs = reactive([
  {
    id: 100,
    name: 'File',
    subtype: 'file',
    icon: 'attach_file',
    color: 'lightgray',
    hasOutput: true,
    hasInput: false,
    type: 'input',
  },
  {
    id: 101,
    name: 'Prompt',
    subtype: 'prompt',
    icon: 'chat',
    color: 'lightgreen',
    hasOutput: true,
    hasInput: false,
    type: 'input',
  },
  {
    id: 102,
    name: 'Webpage',
    subtype: 'webpage',
    icon: 'web',
    color: 'lightblue',
    hasOutput: true,
    hasInput: false,
    type: 'input',
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
