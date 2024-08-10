<template>
  <q-fab
    square
    padding="xs"
    v-model="isExpanded"
    color="grey-8"
    icon="keyboard_arrow_right"
    direction="right"
    class="node-inspector-fab"
  >
    <div v-if="isExpanded" class="node-inspector">
      <q-item>
        <q-item-section v-if="subtype != 'input'">
          <q-icon name="mdi-temperature-celsius" />
          <q-item-label>Temperature: {{ temperature }}</q-item-label>
        </q-item-section>
      </q-item>
      <q-item>
        <q-item-section>
          <q-icon name="mdi-counter" />
          <q-item-label>Token Count: {{ tokenCount }}</q-item-label>
        </q-item-section>
      </q-item>
    </div>
  </q-fab>
</template>

<script setup lang="ts">
import { emitter } from '../eventBus';
import { ref, defineProps, watch } from 'vue';

const isExpanded = ref(false);

interface NodeInspectorProps {
  temperature: number;
  tokenCount: number;
  nodeId: string;
  nodeType: string;
  subtype: string;
}

watch(isExpanded, (expanded) => {
  emitter.emit('node:selected', {
    nodeId: props.nodeId,
    nodeType: '', // Emit nodeType along with nodeId
  });
});
const props = defineProps<NodeInspectorProps>();
</script>

<style scoped>
.node-inspector {
  background-color: white;
  border-left: 1px solid #ddd;
  margin-left: -0.7em;
  height: 10em;
  width: 15em;
}

.node-inspector-fab {
  top: 50%;
  right: 0;
  transform: translateY(-50%);
  height: 100%;
  width: 1em;
}
</style>
