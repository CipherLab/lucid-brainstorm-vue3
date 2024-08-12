<template>
  <q-list padding class="my-bg-grey-1">
    <q-item-label header>Agents</q-item-label>
    <q-expansion-item
      class="my-bg-grey-1"
      v-for="agent in allAgents"
      :key="agent.id"
      expand-separator
      :icon="agent.icon"
      :label="agent.name"
      :style="{ '--agent-color': agent.color }"
      draggable="true"
      @dragstart="onAgentDragStart(agent, $event)"
    >
      <q-card>
        <q-card-section v-if="agent.subtype == 'custom'">
          <q-btn
            flat
            dense
            round
            icon="delete"
            @click="deleteCustomAgent(agent.id)"
          />
        </q-card-section>
        <q-card-section>
          <q-input
            v-model="agent.systemInstructions"
            label="System Instructions"
            filled
            autogrow
          />
        </q-card-section>
      </q-card>
    </q-expansion-item>

    <q-item clickable @click="showAddAgentDialog = true">
      <q-item-section avatar>
        <q-icon name="add" />
      </q-item-section>
      <q-item-section> Add New Agent </q-item-section>
    </q-item>
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

  <AddAgentDialog
    v-model:show="showAddAgentDialog"
    @create="handleAgentCreate"
    @cancel="showAddAgentDialog = false"
  />
</template>

<script setup lang="ts">
import { computed, inject, onMounted, reactive, ref } from 'vue';
import { ChatService } from '../models/chatInterfaces';
import { useQuasar } from 'quasar';
import AddAgentDialog from './AddNewAgent.vue';
const chatService = inject<ChatService>('chatService')!;
import { emitter, GenericEvent } from '../eventBus';

const $q = useQuasar();
if (!chatService) {
  console.error('Chat service not found');
  $q.notify({
    type: 'negative',
    message: 'Chat service not found',
  });
  throw new Error('Chat service not found');
}
const showAddAgentDialog = ref(false);
const allAgents = computed(() => [...availableAgents, ...customAgents.value]);
const customAgents = ref<any[]>([]);

const loadCustomAgents = (): any[] => {
  const storedAgents = localStorage.getItem('customAgents');
  return storedAgents ? JSON.parse(storedAgents) : [];
};
const deleteCustomAgent = (id: number) => {
  console.log('Delete agent:', id);
  // 1. Remove from the reactive array:
  for (let i = 0; i < customAgents.value.length; i++) {
    if (customAgents.value[i].id === id) {
      customAgents.value.splice(i, 1);
      break;
    }
  }
  // 2. Update local storage
  saveCustomAgents();
};
const handleAgentCreate = (agentData: GenericEvent) => {
  // Save the new agent to local storage
  console.log('Create agent:', agentData);
  customAgents.value.push(agentData);
  saveCustomAgents();

  showAddAgentDialog.value = false; // Close the dialog
};
// Load custom agents from local storage

// Save custom agents to local storage
const saveCustomAgents = () => {
  localStorage.setItem('customAgents', JSON.stringify(customAgents.value));
};

// Load custom agents on component mount
onMounted(() => {
  customAgents.value = loadCustomAgents();
  emitter.on('node:agent-created', pushNewAgent);
});
async function pushNewAgent(event: GenericEvent) {
  console.log('Push new agent:', event);
  if (event && event.data) {
    const newAgent = JSON.parse(event.data);
    customAgents.value.push(newAgent);
  }
  saveCustomAgents();

  showAddAgentDialog.value = false; // Close the dialog
}
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
.message-send-button {
  height: 24px;
  width: 24px;
}
</style>
