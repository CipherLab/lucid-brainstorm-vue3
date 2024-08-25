<template>
  <!-- You can use the `BaseEdge` component to create your own custom edge more easily -->
  <BaseEdge :id="id" :style="style" :path="path[0]" :marker-end="markerEnd" />

  <!-- Use the `EdgeLabelRenderer` to escape the SVG world of edges and render your own custom label in a `<div>` ctx -->
  <EdgeLabelRenderer>
    <div>
      <div
        :style="{
          pointerEvents: 'all',
          position: 'absolute',
          transform: `translate(-50%, -50%) translate(${path[1]}px,${path[2]}px)`,
        }"
        class="nodrag nopan"
      >
        <button
          v-if="shouldShowDelete || enableDeleteEdgeButton"
          class="edgebutton"
          @click="removeEdge(id)"
        >
          ×
        </button>
        <button v-else class="edgebuttonhover" @click="initialEdgeButtonClick">
          ×
        </button>
      </div>
    </div>
  </EdgeLabelRenderer>
</template>

<script setup lang="ts">
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  Position,
} from '@vue-flow/core';
import { computed, ref, onMounted, onUnmounted } from 'vue';
const nodesTotal = ref(0);

import { emitter } from '../eventBus';
const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  sourceX: {
    type: Number,
    required: true,
  },
  sourceY: {
    type: Number,
    required: true,
  },
  targetX: {
    type: Number,
    required: true,
  },
  targetY: {
    type: Number,
    required: true,
  },
  sourcePosition: {
    type: String,
    required: true,
  },
  targetPosition: {
    type: String,
    required: true,
  },
  markerEnd: {
    type: String,
    required: false,
  },
  style: {
    type: Object,
    required: false,
  },
  removeEdge: {
    type: Function,
    required: true,
  },
  selectedEdgeId: {
    type: String,
    required: true,
  },
});
onMounted(async () => {
  emitter.on('node:deselected', () => {
    //console.log('node:deselected');
    enableDeleteEdgeButton.value = false;
  });
});
onUnmounted(async () => {
  emitter.off('node:deselected');
});
const path = computed(() =>
  getBezierPath({
    ...props,
    sourcePosition: props.sourcePosition as Position,
    targetPosition: props.targetPosition as Position,
  })
);
const removeEdge = (id: string) => {
  props.removeEdge(id);
  enableDeleteEdgeButton.value = false;
};
const shouldShowDelete = computed(() => {
  //console.log('props.selectedEdgeId', props.selectedEdgeId);
  //console.log('props.id', props.id);
  return props.id === props.selectedEdgeId;
});
const enableDeleteEdgeButton = ref(false);
const initialEdgeButtonClick = () => {
  setTimeout(() => {
    enableDeleteEdgeButton.value = true;
  }, 10);
};
</script>
<style scoped>
.edge-label {
  position: absolute;
  pointer-events: all;
}

.edgebutton {
  border-radius: 999px;
  cursor: pointer;
  cursor: pointer;
  font-size: 1em;
  color: rgb(255, 255, 255);
  background-color: #611313;
  border: none;
}
.edgebuttonhover {
  cursor: pointer;
  border-radius: 999px;
  font-size: 1em;
  color: rgba(255, 255, 255, 0.548);
  background-color: #85858425;
  border: none;
}
.edgebutton:hover {
  transform: scale(1.1);
  transition: all ease 0.5s;
  box-shadow: 0 0 0 0px #ffffffd7, 0 0 0 1px #ffffff;
}
</style>
