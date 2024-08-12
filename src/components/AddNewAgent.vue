<template>
  <q-dialog v-model="showAddAgentDialog" class="q-pa-sm">
    <q-card style="width: 500px; max-width: 80vw">
      <q-card-section>
        <div class="text-h6">Add New Agent</div>
      </q-card-section>
      <q-card-section class="q-pa-sm">
        <div class="q-pa-sm">
          <q-input v-model="newAgent.name" label="Name" filled />
        </div>
        <div class="q-pa-sm">
          <q-input
            v-model="newAgent.systemInstructions"
            label="System Instructions"
            filled
            type="textarea"
            autogrow
          >
            <template v-slot:append>
              <q-btn round dense flat @click="generateSystemInstructions">
                <img
                  src="/src/assets/geminilogo.webp"
                  alt="Send"
                  class="message-send-button"
                />
              </q-btn>
            </template>
          </q-input>
        </div>
        <div class="q-pa-sm">
          <q-color v-model="newAgent.color" label="Select Color" />
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="primary" @click="cancel" />
        <q-btn flat label="Create" color="primary" @click="createAgent" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, inject, computed } from 'vue';
import { ChatService } from '../models/chatInterfaces';
import { emitter, GenericEvent } from '../eventBus';

const props = defineProps<{
  show: boolean;
}>();

// Emit events for Create and Cancel
const emit = defineEmits(['create', 'cancel', 'update:show']);

const chatService = inject<ChatService>('chatService')!;
if (!chatService) {
  throw new Error('Chat service not found');
}

// Make showAddAgentDialog a computed property based on the 'show' prop
const showAddAgentDialog = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value),
});

// Data for the new agent
const newAgent = reactive({
  id: 0,
  systemInstructions: '',
  name: '',
  icon: 'psychology',
  color: '#145ea8',
  hasOutput: true,
  hasInput: true,
  type: 'agent',
  temperature: 1,
  subtype: 'custom',
});

const cancel = () => {
  emit('cancel');
};

const createAgent = () => {
  newAgent.id = Date.now(); // Generate unique ID
  console.log('Create agent:', newAgent);
  emitter.emit('node:agent-created', { data: JSON.stringify(newAgent) }); // Emit the new agent data
  Object.assign(newAgent, {
    // Reset the newAgent data
    id: 0,
    systemInstructions: '',
    name: '',
    icon: 'psychology',
    color: '#145ea8',
  });
};

async function generateSystemInstructions() {
  try {
    const instructions = await chatService.sendMessage(
      '', // Or a dummy node ID if needed
      `Generate system instructions for an AI LLM agent named "${newAgent.name}". Stay within 150 words or less.`
    );
    newAgent.systemInstructions = instructions.result;
  } catch (error) {
    console.error('Error generating instructions:', error);
  }
}
</script>

<style scoped>
.message-send-button {
  height: 24px;
  width: 24px;
}
</style>
