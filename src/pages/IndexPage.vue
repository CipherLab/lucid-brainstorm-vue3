<template>
  <div class="col q-pa-md full-height">
    <BrainStormCanvas :draggedItem="draggedItem" />
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';
import { DraggedItem } from 'src/models';
import BrainStormCanvas from 'components/BrainStormCanvas.vue';
defineProps<{
  draggedItem: DraggedItem | null;
}>();
</script>
<style></style>
