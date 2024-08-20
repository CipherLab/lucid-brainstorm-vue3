<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar class="toolbar-bg">
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />
        <q-toolbar-title>Gemini Flow</q-toolbar-title>
        <div>v{{ version }}</div>
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
    <q-dialog v-model="prompt" persistent>
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Your Gemini API key</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input dense v-model="apikey" autofocus @keyup.enter="saveApiKey" />
        </q-card-section>

        <q-card-actions align="right" class="text-primary">
          <q-btn
            @click="saveApiKey"
            :disabled="apikey.length <= 0"
            flat
            label="Save"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-page-container class="full-container">
      <q-banner
        v-if="showUpdateBanner"
        inline-actions
        class="bg-primary text-white"
      >
        <span v-for="message in limitedMessages" :key="message"
          >{{ message }}<br
        /></span>
        <template v-slot:action>
          <q-btn flat label="OK" @click="showUpdateBanner = false" />
        </template>
      </q-banner>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import SidebarComponent from '../components/SidebarComponent.vue';
import AgentInspectorPanel from '../components/AgentInspectorPanel.vue';
import InputInspectorPanel from '../components/InputInspectorPanel.vue';
import { emitter, NodeSelectedEvent } from '../eventBus';
import { useQuasar } from 'quasar';

const $q = useQuasar();
$q.dark.set(true);

const version = ref('1.0.5');
const updateMessages: Record<string, string> = {
  '1.0.1': 'Welcome to Gemini Flow!',
  '1.0.2': 'Welcome to Gemini Flow!',
  '1.0.3': 'Showing this message now! Adding better markdown support (wip)!',
  '1.0.4':
    'Fixed up the reactive-ness of the chat view. If the api key is invalid, you will be prompted to enter a new one.',
  '1.0.5': 'Missing webp for chat message send button.',
  '1.0.6': 'Fixing version history messages.',
  // Add more messages for future versions
};

const showUpdateBanner = ref<boolean>(false);
const limitedMessages = ref<string[]>([]);
onMounted(() => {
  const lastShownVersion = localStorage.getItem('lastShownVersion') || '';
  const currentVersion = version.value;
  const versions = Object.keys(updateMessages).sort();

  for (const v of versions) {
    if (v > lastShownVersion && v <= currentVersion) {
      limitedMessages.value.push(`${v}: ${updateMessages[v]}`);
    }
  }
  if (limitedMessages.value.length > 3) {
    limitedMessages.value = limitedMessages.value.slice(3);
  }

  if (limitedMessages.value.length <= 0) {
    showUpdateBanner.value = false;
  } else {
    showUpdateBanner.value = true;
  }
  localStorage.setItem('lastShownVersion', currentVersion);
});
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
const prompt = ref(false);
const apikey = ref('');
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

const saveApiKey = () => {
  if (!apikey.value || apikey.value.trim() == '') return;
  console.log('API Key:', apikey.value);
  prompt.value = false;

  sessionStorage.setItem('apikey', apikey.value);
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
  emitter.on('node:api-key-invalid', () => {
    sessionStorage.removeItem('apikey');
    prompt.value = true;
  });
  inspectorOpen.value = false;
  const apiKey = sessionStorage.getItem('apikey');

  if (!apiKey || apiKey === '') {
    prompt.value = true;
  }
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

.full-container {
  height: 100vh;
  overflow: hidden;
  padding: 0px;
}
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

.toolbar-bg {
  background: linear-gradient(
    74deg,
    #0943a2 0,
    #502d7a 3%,
    #85212a 6.67%,
    #85212a 8%,
    #502d7a 11.67%,
    #0943a2 14.67%,
    #502d7a 16.67%,
    #85212a 18.67%,
    black 25%,
    black 100%
  );
}
</style>
