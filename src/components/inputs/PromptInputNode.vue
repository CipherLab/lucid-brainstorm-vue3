<template>
  <div class="prompt-input-node">
    <q-input
      v-model="promptText"
      label="Enter Prompt"
      @keydown.enter="submitPrompt"
      :autofocus="true"
    />

    <q-btn
      label="Submit"
      @click="submitPrompt"
      :disable="!promptText"
      class="q-mt-sm"
    />

    <div v-if="response" class="q-mt-md response-area">
      <p><strong>Response:</strong></p>
      <pre>{{ response }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios'; // Or your preferred HTTP client

const promptText = ref('');
const response = ref('');

const submitPrompt = async () => {
  try {
    const result = await axios.post('/api/generate', {
      prompt: promptText.value,
    });
    response.value = result.data.response; // Assuming your API returns a 'response' field
  } catch (error) {
    console.error('Error submitting prompt:', error);
    // Handle errors (display error message, etc.)
  }
};
</script>

<style scoped>
.prompt-input-node {
  /* ... your styles ... */
}

.response-area {
  /* Style the response area (e.g., add a border, background color, etc.) */
}
</style>
