<template>
  <div class="q-pa-sm">
    <q-file v-model="files" label="Pick files" outlined use-chips multiple />
    <q-btn
      label="Load File"
      @click="loadFile"
      :disable="!files || files.length <= 0"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const files = ref<FileList | null>(null);

const emit = defineEmits(['file-loaded']);

const loadFile = () => {
  if (files.value && files.value?.length > 0) {
    let fileData = '';
    for (let i = 0; i < files.value.length; i++) {
      const file = files.value[i];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          fileData += e.target?.result as string;
          emit('file-loaded', fileData);
        };
        reader.readAsText(file);
      }
    }
  }
};
</script>
