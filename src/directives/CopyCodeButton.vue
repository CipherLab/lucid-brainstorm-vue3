<template>
  <div style="position: relative">
    <slot />
    <q-btn
      class="copy-code-button"
      icon="content_copy"
      dense
      flat
      size="sm"
      @click="copyCode"
    >
      Copy
    </q-btn>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useQuasar } from 'quasar';
import { emitter } from '../eventBus'; // Adjust path if needed

export default defineComponent({
  name: 'CopyCodeButton',
  setup() {
    const $q = useQuasar();

    const copyCode = () => {
      const code = this.$el.querySelector('code')?.textContent?.trim() || '';
      navigator.clipboard
        .writeText(code)
        .then(() => {
          emitter.emit('node:code-copied', { data: {} });
          $q.notify({
            message: 'Code copied!',
            color: 'positive',
          });
        })
        .catch((err) => {
          emitter.emit('node:error', { data: err });
          $q.notify({
            message: 'Failed to copy code!',
            color: 'negative',
          });
        });
    };

    return { copyCode };
  },
});
</script>

<style scoped>
/* Add any custom styles for the button here */
.copy-code-button {
  position: absolute;
  top: 0;
  right: 0;
}
</style>
