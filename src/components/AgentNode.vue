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
    :temperature="props.data.agent.temperature"
    :tokenCount="props.data.agent.temperature"
    :systemInstructions="props.data.agent.systemInstructions"
  >
  </BaseNode>
</template>

<script setup lang="ts">
import { defineProps, computed, resolveComponent, ref } from 'vue'; // Import resolveComponent
import BaseNode from './BaseNode.vue'; // Import the BaseNode component
import { Dimensions, HandleConnectable, NodeProps } from '@vue-flow/core';
import { sys } from 'typescript';

const props = defineProps<NodeProps>();
</script>
<style scoped>
@import '@mdi/font/css/materialdesignicons.min.css';
</style>
