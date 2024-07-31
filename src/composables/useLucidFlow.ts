// src/composables/useLucidFlow.ts
import { ref, reactive } from 'vue';
import {
  useVueFlow,
  Node,
  Edge,
  NodeProps,
  applyNodeChanges,
  applyEdgeChanges,
  NodeRemoveChange,
} from '@vue-flow/core'; // Import applyNodeChanges

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

  // Update addNode:
  const addNode = (node: Node) => {
    console.log('Adding node', node);
    vueFlow.addNodes(node);
    saveSession();
  };
  const addEdge = (edge: Edge) => {
    console.log('Adding edge', edge);
    vueFlow.addEdges(edge);
    saveSession();
  };

  const getNodes = () => {
    return vueFlow.nodes.value;
  };
  const getEdges = () => {
    return vueFlow.edges.value;
  };
  // Update removeNode:
  const removeNode = (nodeId: string) => {
    //removeEdges(nodeId); // Remove edges connected to the node
    const changes: NodeRemoveChange[] = [{ type: 'remove', id: nodeId }];
    applyNodeChanges(changes);
    const edgesToRemove = vueFlow.edges.value.filter(
      (edge) => edge.source === nodeId || edge.target === nodeId
    );
    edgesToRemove.forEach((edge) => removeEdges(edge.id));
    saveSession();
  };

  const findNodeProps = (nodeId: string) => {
    const node = vueFlow.nodes.value.find((node) => node.id === nodeId) as
      | NodeProps
      | undefined;

    return node;
  };

  const getNodeCount = () => {
    if (vueFlow.nodes.value) {
      return vueFlow.nodes.value.length;
    }
    return 0;
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
