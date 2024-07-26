<template>
  <div class="webpage-input-node">
    <q-input v-model="webpageUrl" label="Enter URL" />
    <!-- ... UI for fetching and displaying webpage content ... -->
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const webpageUrl = ref('');

// ... logic for fetching and handling webpage data ...
</script>
