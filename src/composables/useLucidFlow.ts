// src/composables/useLucidFlow.ts
import { ref, reactive, Ref, watchEffect } from 'vue';
import {
  useVueFlow,
  Node,
  Edge,
  NodeProps,
  applyNodeChanges,
  applyEdgeChanges,
  NodeRemoveChange,
} from '@vue-flow/core';
import { Message } from '../models/chatInterfaces';
import { debounce, flow, forEach, get } from 'lodash';
import { IndexedDBStorageService } from '../services/indexedDBStorageService';
import { StorageService } from '../services/StorageService';
export interface LucidFlowComposable {
  getNodes: () => Node[];
  getEdges: () => Edge[];
  findNodeProps: (nodeId: string) => NodeProps | undefined;
  getNodeCount: () => number;
  addNode: (node: Node) => Promise<void>;
  removeNode: (nodeId: string) => Promise<void>;
  addEdge: (edge: Edge) => Promise<void>;
  updateNodePosition: (nodeId: string, x: number, y: number) => Promise<void>;
  getNodeChatData: (nodeId: string) => Message[] | null;
  toggleEdgeAnimation: (nodeId: string, boolState: boolean) => Promise<void>;
  updateNodeChatData: (nodeId: string, newData: any) => Promise<void>;
  getConnectedNodes: (nodeId: string, includeSelf: boolean) => string[];
  saveSession: () => Promise<void>;
  loadSession: () => Promise<void>;
  useNodeProperty<T>(
    connectedNodeIds: Ref<string[]>,
    getProperty: (nodeId: string) => Promise<T>
  ): Promise<{
    propertyValues: Ref<Record<string, T>>;
    getPropertyValue: (nodeId: string) => T;
  }>;
}

const flowKey = 'lucid-flow-session';

export default function useLucidFlow(): LucidFlowComposable {
  const storageService: StorageService = new IndexedDBStorageService();

  const vueFlow = useVueFlow();
  const {
    onConnect,
    addEdges,
    onNodesChange,
    onEdgesChange,
    applyNodeChanges,
    applyEdgeChanges,
    removeNodes,
    removeEdges,
  } = vueFlow;

  const addNode = async (node: Node): Promise<void> => {
    vueFlow.addNodes(node);
    await saveSession(); // Wait for saveSession to complete
  };

  const addEdge = async (edge: Edge): Promise<void> => {
    vueFlow.addEdges(edge);
    await saveSession(); // Wait for saveSession to complete
  };

  const getNodes = () => {
    return vueFlow.nodes.value;
  };

  const getEdges = () => {
    return vueFlow.edges.value;
  };

  const removeNode = async (nodeId: string): Promise<void> => {
    const changes: NodeRemoveChange[] = [{ type: 'remove', id: nodeId }];
    applyNodeChanges(changes);
    const edgesToRemove = vueFlow.edges.value.filter(
      (edge) => edge.source === nodeId || edge.target === nodeId
    );
    edgesToRemove.forEach((edge) => removeEdges(edge.id));
    await saveSession(); // Wait for saveSession to complete
  };

  const findNodeProps = (nodeId: string) => {
    const node = vueFlow.nodes.value.find((node) => node.id === nodeId) as
      | NodeProps
      | undefined;
    return node;
  };

  const getNodeCount = () => {
    return vueFlow.nodes.value ? vueFlow.nodes.value.length : 0;
  };

  const updateNodePosition = async (
    nodeId: string,
    x: number,
    y: number
  ): Promise<void> => {
    const nodeToUpdate = vueFlow.nodes.value.find((node) => node.id === nodeId);
    if (nodeToUpdate) {
      nodeToUpdate.position = { x, y };
      await debounceSave();

      // setTimeout(() => {
      //   loadSession();
      // }, 1000);
    }
  };
  const debounceSave = debounce(async () => {
    console.log('Saving session...');
    await saveSession();
  }, 100);
  const getNodeChatData = (nodeId: string) => {
    const node = vueFlow.nodes.value.find((node) => node.id === nodeId);
    return node ? node.data.chatData : null;
  };

  const updateNodeChatData = async (
    nodeId: string,
    newChatData: Message[] | null
  ): Promise<void> => {
    const nodeToUpdate = vueFlow.nodes.value.find((node) => node.id === nodeId);
    if (nodeToUpdate) {
      nodeToUpdate.data.chatData = newChatData;
    } else {
      console.error('Node not found');
    }
    await saveSession(); // Wait for saveSession to complete
  };

  const getConnectedNodes = (nodeId: string, includeSelf = false): string[] => {
    const connectedNodeIds: string[] = includeSelf ? [nodeId] : [];
    gatherConnectedNodesRecursively(nodeId, connectedNodeIds);
    return connectedNodeIds;
  };

  const gatherConnectedNodesRecursively = (
    nodeId: string,
    connectedNodeIds: string[]
  ): void => {
    vueFlow.edges.value.forEach((edge: Edge) => {
      if (edge.target === nodeId && !connectedNodeIds.includes(edge.source)) {
        connectedNodeIds.push(edge.source);
        gatherConnectedNodesRecursively(edge.source, connectedNodeIds);
      }
    });
  };

  const toggleEdgeAnimation = async (
    nodeId: string,
    boolState: boolean
  ): Promise<void> => {
    const edges = getEdges().filter(
      (edge) => edge.source === nodeId || edge.target === nodeId
    );
    forEach(edges, (edge) => {
      edge.animated = boolState;
    });
    await saveSession(); // Wait for saveSession to complete
  };

  async function saveSession(): Promise<void> {
    const flowData = await vueFlow.toObject();
    await storageService.save(flowKey, flowData);
  }

  async function loadSession(): Promise<void> {
    const flowData = await storageService.load(flowKey);
    if (flowData) {
      await vueFlow.fromObject(flowData);
    }
  }

  // Generic function to handle async data loading and caching for node properties
  async function useNodeProperty<T>(
    connectedNodeIds: Ref<string[]>,
    getProperty: (nodeId: string) => Promise<T>
  ): Promise<{
    propertyValues: Ref<Record<string, T>>;
    getPropertyValue: (nodeId: string) => T;
  }> {
    const propertyValues = ref<Record<string, T>>({});

    const updatePropertyValues = async () => {
      for (const nodeId of connectedNodeIds.value) {
        propertyValues.value[nodeId] = await getProperty(nodeId);
      }
    };

    const getPropertyValue = (nodeId: string): T => {
      return propertyValues.value[nodeId];
    };

    // Initial update
    await updatePropertyValues();

    // Watch for changes in connectedNodeIds to update the values
    watchEffect(async () => {
      await updatePropertyValues();
    });

    return { propertyValues, getPropertyValue };
  }
  return {
    getNodes,
    getEdges,
    findNodeProps,
    getNodeCount,
    addNode,
    removeNode,
    addEdge,
    updateNodePosition,
    getNodeChatData,
    toggleEdgeAnimation,
    updateNodeChatData,
    getConnectedNodes,
    saveSession,
    loadSession,
    useNodeProperty,
  };
}
