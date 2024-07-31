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

    <q-drawer
      side="left"
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      :width="leftDrawerWidth"
      class="custom-drawer"
    >
      <div class="resizable-drawer-content">
        <SidebarComponent
          @agent-drag-start="onAgentDragStart"
          @input-drag-start="onInputDragStart"
        />
      </div>
      <div
        class="resize-handle left-handle"
        v-touch-pan.horizontal.prevent.mouse.preserveCursor="handleLeftPan"
      ></div>
    </q-drawer>

    <!-- Right Drawer (Similar logic, adjust handleRightPan) -->
    <q-drawer
      side="right"
      v-model="inspectorOpen"
      show-if-above
      bordered
      :width="rightDrawerWidth"
      class="custom-drawer"
    >
      <div class="resizable-drawer-content">
        <AgentInspectorPanel
          v-if="selectedNodeId && selectedType === 'agent'"
          :selectedNodeId="selectedNodeId"
        />
        <InputInspectorPanel
          v-if="selectedNodeId && selectedType === 'input'"
          :selectedNodeId="selectedNodeId"
        />
      </div>
      <div
        class="resize-handle right-handle"
        v-touch-pan.horizontal.prevent.mouse.preserveCursor="handleRightPan"
      ></div>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import SidebarComponent from 'components/SidebarComponent.vue';
import AgentInspectorPanel from 'components/AgentInspectorPanel.vue';
import InputInspectorPanel from 'components/InputInspectorPanel.vue';
import { emitter, NodeSelectedEvent } from 'src/eventBus';
import { useQuasar } from 'quasar';

const $q = useQuasar();
$q.dark.set(true);

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
const inspectorOpen = ref(false);
const draggedItem = ref<DraggedItem | null>(null);
const nodeSelectStarted = ref(false);

// Drawer Widths
const leftDrawerWidth = ref(250);
const rightDrawerWidth = ref(500);

// Drawer Toggle
function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

// Drag Start Handlers
const onAgentDragStart = (agent: Agent) => {
  draggedItem.value = { type: 'agent', data: agent };
};

const onInputDragStart = (type: 'file' | 'prompt') => {
  draggedItem.value = { type: 'input', data: type };
};

// Node Selection
const selectedNodeId = ref<string | undefined>(undefined);
const selectedType = ref<string | undefined>(undefined);

const handleNodeSelected = (event: NodeSelectedEvent) => {
  nodeSelectStarted.value = true;
  setTimeout(() => {
    nodeSelectStarted.value = false;
  }, 200);
  inspectorOpen.value = true;
  selectedNodeId.value = event.nodeId + '';
  selectedType.value = event.nodeType;
};

const handleNodeDeselected = () => {
  if (nodeSelectStarted.value) return;
  inspectorOpen.value = false;
  selectedNodeId.value = undefined;
};

// Resizing Handlers
const handleLeftPan = (event) => {
  leftDrawerWidth.value = Math.max(200, leftDrawerWidth.value + event.delta.x);
};

const handleRightPan = (event) => {
  rightDrawerWidth.value = Math.max(
    200,
    rightDrawerWidth.value - event.delta.x
  );
};

// Mounting and Unmounting
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
/* Import Vue Flow Styles */
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';

.my-label {
  font-size: 14px;
  color: #757575;
}

.custom-drawer {
  position: relative;
}

.resizable-drawer-content {
  width: 100%;
  height: 100%;
}

.resize-handle {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 8px;
  cursor: col-resize;
  z-index: 10;
}

/* Corrected positions: */
.left-handle {
  right: 0; /* Left drawer handle on the RIGHT edge */
}

.right-handle {
  left: 0; /* Right drawer handle on the LEFT edge */
}
.vue-flow__node {
  visibility: visible !important;
}
</style>
