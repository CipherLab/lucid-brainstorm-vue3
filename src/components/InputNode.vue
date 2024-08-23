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
    :subtype="props.data.agent.subtype"
    :inputData="props.data.agent.inputData"
    :tokenCount="props.data.agent.tokenCount"
    :webUrl="props.data.agent.webUrl"
    :watcher="props.data.agent.watcher"
  >
  </BaseNode>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'; // Import resolveComponent
import BaseNode from './BaseNode.vue'; // Import the BaseNode component
import { NodeProps } from '@vue-flow/core';

const props = defineProps<NodeProps>();

// Use resolveComponent to dynamically resolve the component
</script>
