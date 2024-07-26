<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title>Lucid Brainstorm</q-toolbar-title>

        <div>Quasar v{{ $q.version }}</div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <SidebarComponent
        @agent-drag-start="onAgentDragStart"
        @input-drag-start="onInputDragStart"
      />
    </q-drawer>

    <q-drawer v-model="inspectorOpen" side="right" show-if-above bordered>
      <AgentInspectorPanel
        v-if="selectedNodeId"
        :selectedNodeId="selectedNodeId"
      />
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import SidebarComponent from 'components/SidebarComponent.vue';
import AgentInspectorPanel from 'components/AgentInspectorPanel.vue'; // Import AgentInspectorPanel
import { emitter, NodeSelectedEvent } from 'src/eventBus';

interface Agent {
  id: number;
  name?: string;
  icon: string;
  color: string;
}

interface DraggedItem {
  type: 'agent' | 'input';
  data: Agent | 'file' | 'prompt';
}

defineOptions({
  name: 'MainLayout',
});

const leftDrawerOpen = ref(false);
const inspectorOpen = ref(false); // Control Inspector Drawer
const draggedItem = ref<DraggedItem | null>(null);
const nodeSelectStarted = ref(false);
function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

const onAgentDragStart = (agent: Agent) => {
  draggedItem.value = { type: 'agent', data: agent };
};

const onInputDragStart = (type: 'file' | 'prompt') => {
  draggedItem.value = { type: 'input', data: type };
};
const selectedNodeId = ref<string | undefined>(undefined);

// Function to handle node selection (in MainLayout)
const handleNodeSelected = (event: NodeSelectedEvent) => {
  nodeSelectStarted.value = true;
  //use an slight timeout to set back to false
  setTimeout(() => {
    nodeSelectStarted.value = false;
  }, 200);
  inspectorOpen.value = true; // Show the inspector drawer
  selectedNodeId.value = event.nodeId + '';
  console.log('Node selected in MainLayout:', event.nodeId);
};

// Function to handle node deselection (in MainLayout)
const handleNodeDeselected = () => {
  if (nodeSelectStarted.value) return;
  console.log('Node deselected in MainLayout');
  inspectorOpen.value = false; // Hide the inspector drawer
  selectedNodeId.value = undefined;
};

onMounted(() => {
  inspectorOpen.value = false;

  emitter.on('node:selected', handleNodeSelected);
  emitter.on('node:deselected', handleNodeDeselected);
  inspectorOpen.value = false;
});

onUnmounted(() => {
  emitter.off('node:selected', handleNodeSelected);
  emitter.off('node:deselected', handleNodeDeselected);
});
</script>

<style>
/* import the necessary styles for Vue Flow to work */
@import '@vue-flow/core/dist/style.css';

/* import the default theme, this is optional but generally recommended */
@import '@vue-flow/core/dist/theme-default.css';
</style>
