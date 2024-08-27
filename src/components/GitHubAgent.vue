<template>
  <div class="github-agent full-width">
    <q-input
      v-model="webUrl"
      label="GitHub Repository URL"
      outlined
      dense
      class="col-grow text-white"
      @input="props.updateChatHistoryUrl"
      @blur="onTextBlur"
      style="flex: 1"
    >
      <template v-slot:append>
        <q-btn
          icon="refresh"
          @click="loadRepository"
          :disable="!webUrl || webUrl.length <= 0"
          color="primary"
          unelevated
          dense
        />
      </template>
    </q-input>

    <q-tree
      v-if="fileTree.length > 0"
      :nodes="fileTree"
      node-key="path"
      label-key="name"
      v-model:ticked="selectedFilePaths"
      tick-strategy="leaf"
      class="file-tree q-mt-sm"
    >
      <template v-slot:default-header="prop">
        <div class="row items-center">
          <q-icon
            :name="prop.node.type === 'tree' ? 'folder' : 'insert_drive_file'"
          />
          <span class="q-ml-sm">{{ prop.node.name }}</span>
        </div>
      </template>
    </q-tree>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'; // Import nextTick
import { useQuasar } from 'quasar';
import { Octokit } from 'octokit';

const props = defineProps({
  selectedNode: {
    type: Object,
    required: true,
  },
  updateChatHistoryUrl: {
    type: Function,
    required: true,
  },
  updateChatHistoryData: {
    type: Function,
    required: true,
  },
  updateChatHistoryGithubSelection: {
    type: Function,
    required: true,
  },
  toggleWatcherState: {
    type: Function,
    required: true,
  },
});

const $q = useQuasar();
const octokit = ref(new Octokit());
const fileTree = ref([]);
const selectedFilePaths = ref([]);
const webUrl = ref('');
const selectedNode = computed(() => props.selectedNode);

// Updated githubSelection computed property
const githubSelection = computed({
  get() {
    return selectedNode.value.data.agent.githubSelection || [];
  },
  set(newSelection) {
    if (selectedNode.value) {
      selectedNode.value.data.agent.githubSelection = newSelection;
      props.updateChatHistoryGithubSelection(newSelection);
    }
  },
});
const isValidRepoUrl = computed(() => {
  return webUrl.value.match(/https:\/\/github.com\/[^\/]+\/[^\/]+/);
});

const loadRepository = async () => {
  if (!isValidRepoUrl.value) return;

  try {
    const urlParts = webUrl.value.split('/');
    const owner = urlParts[3];
    const repo = urlParts[4];

    fileTree.value = await fetchTreeRecursively(owner, repo, '');

    // Use nextTick to ensure the QTree is rendered before setting ticked values
    await nextTick();
    selectedFilePaths.value = githubSelection.value;
  } catch (error) {
    if (
      error.response &&
      error.response.status === 403 &&
      error.response.data.message.includes('API rate limit exceeded')
    ) {
      $q.notify({
        message: `API rate limit exceeded. Please authenticate your requests to get a higher rate limit. More info: ${error.response.data.documentation_url}`,
        color: 'negative',
        position: 'top',
      });
    } else {
      $q.notify({
        message: `Error loading repository: ${error.message}`,
        color: 'negative',
        position: 'top',
      });
    }
  }
};

const fetchTreeRecursively = async (owner, repo, path) => {
  const response = await octokit.value.rest.repos.getContent({
    owner,
    repo,
    path, // Pass the current path for recursive calls
  });

  let tree = processTreeData(response.data);

  // Recursively fetch subdirectories
  const subdirPromises = tree
    .filter((item) => item.type === 'dir')
    .map((item) => fetchTreeRecursively(owner, repo, item.path));

  const subdirResults = await Promise.all(subdirPromises);
  tree = tree.map((item) => {
    if (item.type === 'dir') {
      const subdirIndex = subdirResults.findIndex((subdir) =>
        subdir[0].path.startsWith(item.path)
      );
      if (subdirIndex !== -1) {
        item.children = subdirResults[subdirIndex];
      }
    }
    return item;
  });

  return tree;
};

const processTreeData = (treeData) => {
  return treeData.map((item) => {
    return {
      name: item.name || item.path.split('/').pop(),
      path: item.path,
      type: item.type,
      children: [], // Initialize children as an empty array, will be populated recursively
    };
  });
};

const onTextBlur = () => {
  if (selectedNode.value) {
    props.updateChatHistoryUrl(webUrl.value);
  }
};

// Watch selectedFilePaths and update the githubSelection computed property
watch(selectedFilePaths, (newPaths) => {
  githubSelection.value = newPaths;
});

onMounted(() => {
  if (selectedNode.value) {
    webUrl.value = selectedNode.value.data.agent.webUrl || '';
    // No need to load the repository here if paths are already selected
    // as loadRepository is called when webUrl changes
  }
});

watch(webUrl, (newUrl) => {
  if (newUrl && isValidRepoUrl.value) {
    loadRepository();
  } else {
    fileTree.value = [];
    // Don't reset selectedFilePaths here, preserve selections
  }
});
</script>
