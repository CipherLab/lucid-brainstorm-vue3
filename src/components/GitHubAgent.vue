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
          icon="download"
          :loading="isLoading"
          @click="loadRepository(true)"
          :disable="!webUrl || webUrl.length <= 0 || isLoading"
          color="primary"
          unelevated
          dense
        />
        <q-btn
          icon="clear"
          :loading="isLoading"
          @click="clearLoadedDataAndCache"
          :disable="!webUrl || webUrl.length <= 0 || isLoading"
          color="critical"
          unelevated
          dense
        />
      </template>
    </q-input>
    <div>
      <span class="q-mr-sm">Options</span>
      <br />
      <q-radio
        v-model="gitHubAgentMode"
        val="url"
        label="Interact with the data via the url only. (Gemini can access the data directly from the repository)"
      />
      <q-radio
        v-model="gitHubAgentMode"
        val="download"
        label="Download the files from the repository and include the content directly in the chat history. (Coming soon!)"
      />
    </div>

    <div v-if="fileTree.length > 0" class="file-tree-container q-mt-sm">
      <q-tree
        :nodes="fileTree"
        node-key="path"
        label-key="name"
        v-model:ticked="selectedFilePaths"
        tick-strategy="leaf"
        class="file-tree"
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
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  watch,
  onMounted,
  nextTick,
  inject,
  watchEffect,
} from 'vue';
import { useQuasar } from 'quasar';
import { StorageService, StoreName } from '../services/StorageService';
import { Octokit } from '@octokit/core';
const gitHubAgentMode = ref('url');
const cacheKey = computed(
  () => `${selectedNode.value.data.agent.id}${webUrl.value}`
);

const props = defineProps({
  selectedNode: {
    type: Object,
    required: true,
  },
  updateChatHistoryUrl: {
    type: Function,
    required: true,
  },
  updateChatHistoryDataArray: {
    type: Function,
    required: true,
  },
  updateChatHistoryGithubSelection: {
    type: Function,
    required: true,
  },
  updateGitHubAgentMode: {
    type: Function,
    required: true,
  },
  toggleWatcherState: {
    type: Function,
    required: true,
  },
});
const githubStore = inject<StorageService<StoreName.githubTree>>(
  `${StoreName.githubTree}Service`
);
const hasMounted = ref(false);

const isLoading = ref(false);

if (!githubStore) {
  throw new Error('Could not inject githubStore!');
}

const $q = useQuasar();

const octokit = ref(new Octokit());

const fileTree = ref([]);
const selectedFilePaths = ref<Array<any>>([]);
const webUrl = ref('');
const selectedNode = computed(() => props.selectedNode);

watchEffect(() => {
  if (gitHubAgentMode.value && hasMounted.value) {
    props.updateGitHubAgentMode(gitHubAgentMode.value);
  }
});
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

const clearLoadedDataAndCache = async () => {
  await githubStore.delete(cacheKey.value);
  fileTree.value = [];
  selectedFilePaths.value = [];
  webUrl.value = '';
};

const loadRepository = async (clearCache: boolean) => {
  if (clearCache) {
    await githubStore.delete(cacheKey.value);
  }
  if (!isValidRepoUrl.value) return;

  try {
    isLoading.value = true;

    let cachedTree = await githubStore.load(cacheKey.value);

    if (cachedTree) {
      console.log('Loading from cache:', cacheKey.value);
      fileTree.value = JSON.parse(cachedTree);
    } else {
      console.log('Fetching from GitHub:', webUrl.value);
      const urlParts = webUrl.value.split('/');
      const owner = urlParts[3];
      const repo = urlParts[4];

      fileTree.value = await fetchTreeRecursively(owner, repo, '');

      await githubStore.save(cacheKey.value, JSON.stringify(fileTree.value));
    }

    await nextTick();
    selectedFilePaths.value = [...githubSelection.value];
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
  } finally {
    isLoading.value = false;
  }
};

const fetchTreeRecursively = async (owner, repo, path) => {
  const response = await octokit.value.request(
    'GET /repos/{owner}/{repo}/contents/{path}',
    {
      owner,
      repo,
      path, // Pass the current path for recursive calls
    }
  );

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
  updateChatHistoryWithFilePaths(newPaths);
});

onMounted(() => {
  if (selectedNode.value) {
    webUrl.value = selectedNode.value.data.agent.webUrl || '';
    gitHubAgentMode.value =
      selectedNode.value.data.agent.gitHubAgentMode || 'url';
    console.log('gitHubAgentMode:', selectedNode.value.data.agent);
    // gitHubAgentMode.value =
    //   selectedNode.value.data.agent.gitHubAgentMode || 'url';
  }
  hasMounted.value = true;
});

watch(webUrl, async (newUrl) => {
  if (newUrl && isValidRepoUrl.value && hasMounted.value) {
    await loadRepository(false);
  } else {
    fileTree.value = [];
  }
});

// Function to generate the URL for each file
const generateFileUrl = (path) => {
  const urlParts = webUrl.value.split('/');
  const owner = urlParts[3];
  const repo = urlParts[4];
  return `https://github.com/${owner}/${repo}/blob/main/${path}`;
};

// Function to update chat history with file paths
const updateChatHistoryWithFilePaths = (paths: string[]) => {
  //use generateFileUrl, map to array
  const tempPaths = paths.map((path) => generateFileUrl(path));
  props.updateChatHistoryDataArray(tempPaths);
};
</script>

<style scoped>
/* ... (your existing styles) ... */

.file-tree-container {
  /* Set a max height for the container */
  max-height: 70vh;

  /* Enable scrolling within the container */
  overflow-y: auto;
}
</style>
