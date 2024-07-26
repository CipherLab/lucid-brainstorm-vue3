<template>
  <BaseNode
    :id="props.id"
    :type="props.type"
    :position="props.position"
    :data="props.data"
    :selected="props.selected"
    :connectable="true"
    :dimensions="props.dimensions"
    :icon="props.data.agent.icon"
    :label="props.data.label"
    :backgroundColor="props.data.agent.color"
    :hasInput="props.data.agent.hasInput"
    :hasOutput="props.data.agent.hasOutput"
    :onRemoveNode="props.data.onRemoveNode"
  >
    <component :is="specificInputComponent" v-bind="props.data"></component>
  </BaseNode>
</template>

<script setup lang="ts">
import { defineProps, computed, resolveComponent } from 'vue'; // Import resolveComponent
import BaseNode from './BaseNode.vue'; // Import the BaseNode component
import { Dimensions, HandleConnectable, NodeProps } from '@vue-flow/core';

const props = defineProps<NodeProps>();

// Use resolveComponent to dynamically resolve the component
const specificInputComponent = computed(() => {
  console.log('Current subtype:', props.data.subtype); // Debugging log

  switch (props.data.subtype) {
    case 'file':
      return resolveComponent('FileInputNode');
    case 'prompt':
      return resolveComponent('PromptInputNode');
    case 'webpage':
      return resolveComponent('WebpageInputNode');
    default:
      return null; // Or a default component if needed
  }
});
</script>
