// src/composables/useLucidFlow.ts
import { ref, reactive } from 'vue';
import { useVueFlow, Node, Edge, NodeProps } from '@vue-flow/core';

export interface LucidFlowComposable {
  getNodes: () => Node[];
  getEdges: () => Edge[];
  findNodeProps: (nodeId: string) => NodeProps | undefined;
  getNodeCount: () => number;
  addNode: (node: Node) => void;
  removeNode: (nodeId: string) => void;
  addEdge: (edge: Edge) => void;
  updateNodePosition: (nodeId: string, x: number, y: number) => void;
  getNodeChatData: (nodeId: string) => any;
  updateNodeChatData: (nodeId: string, newData: any) => void;
  saveSession: () => void;
  loadSession: () => void;
}
const flowKey = 'lucid-flow-session'; // Your storage key
//const nodes = ref<Node[]>([]); // Ref for nodes
export default function useLucidFlow(): LucidFlowComposable {
  // Call useVueFlow only ONCE:
  const vueFlow = useVueFlow();
  const { removeNodes } = vueFlow;

  // Update addNode:
  const addNode = (node: Node) => {
    console.log('Adding node', node);
    vueFlow.addNodes(node); // Directly add to vueFlow
    console.log('Nodes:', vueFlow.nodes.value);
  };

  const getNodes = () => {
    return vueFlow.nodes.value;
  };
  const getEdges = () => {
    return vueFlow.edges.value;
  };
  // Update removeNode:
  const removeNode = (nodeId: string) => {
    removeNodes(nodeId); // Directly remove from vueFlow
  };

  const findNodeProps = (nodeId: string) => {
    const node = vueFlow.nodes.value.find((node) => node.id === nodeId) as
      | NodeProps
      | undefined;
    return undefined;
  };

  const getNodeCount = () => {
    if (vueFlow.nodes.value) {
      return vueFlow.nodes.value.length;
    }
    return 0;
  };

  const addEdge = (edge: Edge) => {
    console.log('Adding edge', edge);
    vueFlow.addEdges(edge);
  };

  const updateNodePosition = (nodeId: string, x: number, y: number) => {
    const nodeToUpdate = vueFlow.nodes.value.find((node) => node.id === nodeId); // Access from vueFlow.nodes.value
    if (nodeToUpdate) {
      nodeToUpdate.position = { x, y };
    }
  };

  const getNodeChatData = (nodeId: string) => {
    const node = vueFlow.nodes.value.find((node) => node.id === nodeId); // Access from vueFlow.nodes.value
    return node ? node.data.chatData : null;
  };

  const updateNodeChatData = (nodeId: string, newData: any) => {
    const nodeToUpdate = vueFlow.nodes.value.find((node) => node.id === nodeId); // Access from vueFlow.nodes.value
    if (nodeToUpdate) {
      // Assuming newData is the message to add to chat history
      nodeToUpdate.data.chatData = [
        ...(nodeToUpdate.data.chatData || []),
        newData,
      ];
    }
  };

  // Saving the Session:
  function saveSession() {
    console.log('Saving session');
    localStorage.setItem(flowKey, JSON.stringify(vueFlow.toObject()));
  }

  // Loading the Session (UPDATED):
  function loadSession() {
    const savedFlow = localStorage.getItem(flowKey);
    if (savedFlow) {
      // 1. Restore the internal state:
      vueFlow.fromObject(JSON.parse(savedFlow));
    }
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
    updateNodeChatData,
    saveSession,
    loadSession,
  };
}
