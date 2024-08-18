<template>
  <q-card flat bordered class="code-block-card">
    <q-card-section class="code-block-section">
      <pre class="code-block"><code v-html="highlightedCode"></code></pre>
    </q-card-section>

    <q-card-actions class="code-block-actions">
      <v-clipboard :copy="code" @success="onCopySuccess">
        <q-btn
          dense
          flat
          icon="content_copy"
          label="Copy"
          color="grey-7"
          class="copy-button"
        />
      </v-clipboard>
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { ref, defineProps, computed } from 'vue';
import VueClipboard from 'vue-clipboard2';
import hljs from 'highlight.js/lib/core'; // Import highlight.js core
import javascript from 'highlight.js/lib/languages/javascript'; // Import JavaScript language
hljs.registerLanguage('javascript', javascript); // Register the language

const props = defineProps({
  code: {
    type: String,
    required: true,
  },
});

const onCopySuccess = () => {
  console.log('Code copied successfully!');
};

// Highlight the code (make sure it's in the correct language)
const highlightedCode = computed(() => {
  return hljs.highlightAuto(props.code).value; // Highlight automatically
});
</script>

<style scoped>
.code-block-card {
  width: 100%;
  background-color: #2b2424; /* Use a similar background color */
  border-color: #5e93d52a; /* Use a similar border color */
  margin-bottom: 10px;
}

.code-block-section {
  width: 100%;
}

.code-block {
  width: 100%;
  font-family: 'Courier New', Courier, monospace;
  white-space: pre;
}

.code-block-actions {
  justify-content: flex-end;
}

.copy-button {
  border-radius: 20px; /* Rounded corners for the button */
}
</style>
