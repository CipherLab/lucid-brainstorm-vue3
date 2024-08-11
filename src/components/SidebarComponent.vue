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
      <q-card v-if="agent.type == 'agent'">
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
    systemInstructions:
      'You are The Critic, an expert in quality assurance and code review. Your role is to analyze and critique the suggestions provided by other agents. Identify potential issues, inefficiencies, or errors in the proposed solutions. Your feedback should be thorough, precise, and aimed at improving the overall quality and reliability of the project.',
    name: 'The Critic',
    icon: 'fact_check',
    color: '#4A1E22',
    hasOutput: true,
    hasInput: true,
    type: 'agent',
    temperature: 0,
    subtype: 'agent',
    webUrl: '',
  },
  {
    id: 2,
    systemInstructions:
      'You are The Creative Problem Solver, tasked with thinking outside the box to tackle challenges and come up with innovative solutions. Your responses should explore unconventional ideas, creative workarounds, and novel approaches to coding and project design. Encourage exploration and experimentation.',
    name: 'The Problem Solver',
    icon: 'lightbulb',
    color: '#402400',
    hasOutput: true,
    hasInput: true,
    type: 'agent',
    temperature: 1.5,
    subtype: 'agent',
    webUrl: '',
  },
  {
    id: 3,
    name: 'The Architect',
    systemInstructions:
      'You are The Architect, an expert in software design and project architecture. Your job is to ensure that all components of the project fit together seamlessly and that the overall structure is sound. Provide clear, structured guidance on how to organize code and resources. Prioritize scalability, maintainability, and clarity.',
    icon: 'architecture',
    color: '#00505A',
    hasOutput: true,
    hasInput: true,
    type: 'agent',
    temperature: 0.5,
    subtype: 'agent',
    webUrl: '',
  },
  {
    id: 3,
    name: 'The Coder',
    systemInstructions:
      'You are The Coder, a highly skilled software developer. Your role is to write, optimize, and debug code efficiently. Provide clear, concise, and well-structured code snippets or solutions. When debugging, focus on identifying the root cause and proposing fixes that are both effective and elegant.',
    icon: 'code',
    color: '#1B4020',
    hasOutput: true,
    hasInput: true,
    type: 'agent',
    temperature: 0.8,
    subtype: 'agent',
    webUrl: '',
  },
]);
const availableInputs = reactive([
  {
    id: 100,
    systemInstructions: 'This is a file input',
    name: 'File',
    subtype: 'file',
    icon: 'attach_file',
    color: '#4A4A00',
    hasOutput: true,
    hasInput: false,
    type: 'agent',
    inputData: '',
    webUrl: '',
  },
  {
    id: 102,
    systemInstructions: 'This is a web url input',
    name: 'Web URL',
    subtype: 'webpage',
    icon: 'web',
    color: '#003366',
    hasOutput: true,
    hasInput: false,
    type: 'agent',
    inputData: '',
    webUrl: '',
  },
  {
    id: 103, // Unique ID
    systemInstructions: '', // No system instructions needed
    name: 'Text Input',
    icon: 'text_fields', // Choose a suitable icon
    color: '#33334D',
    hasOutput: true,
    hasInput: false,
    type: 'agent', // New type
    inputData: '', // Initial text for the input
    subtype: 'input',
    webUrl: '',
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
