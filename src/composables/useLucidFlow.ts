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
import { Message } from '../models/chatInterfaces';
import { forEach, get } from 'lodash';

export interface LucidFlowComposable {
  getNodes: () => Node[];
  getEdges: () => Edge[];
  findNodeProps: (nodeId: string) => NodeProps | undefined;
  getNodeCount: () => number;
  addNode: (node: Node) => void;
  removeNode: (nodeId: string) => void;
  addEdge: (edge: Edge) => void;
  updateNodePosition: (nodeId: string, x: number, y: number) => void;
  getNodeChatData: (nodeId: string) => Message[] | null;
  toggleEdgeAnimation: (nodeId: string, boolState: boolean) => void;

  updateNodeChatData: (nodeId: string, newData: any) => void;
  getConnectedNodes: (nodeId: string, includeSelf: boolean) => string[];
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
    //console.log('Adding node', node);
    vueFlow.addNodes(node);
    saveSession();
  };
  const addEdge = (edge: Edge) => {
    //console.log('Adding edge', edge);
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

  const updateNodeChatData = (
    nodeId: string,
    newChatData: Message[] | null
  ) => {
    // Accept an array of Messages
    const nodeToUpdate = vueFlow.nodes.value.find((node) => node.id === nodeId);
    if (nodeToUpdate) {
      nodeToUpdate.data.chatData = newChatData; // Update the entire chatData array
    } else {
      console.error('Node not found');
    }
    saveSession();
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
  const toggleEdgeAnimation = (nodeId: string, boolState: boolean) => {
    const edges = getEdges().filter(
      (edge) => edge.source === nodeId || edge.target === nodeId
    );
    console.log('Toggling edge animation', boolState);
    forEach(edges, (edge) => {
      edge.animated = boolState;
    });
    console.log('saveSession-start');
    saveSession();
    console.log('saveSession-done');
  };
  // Saving the Session:
  function saveSession() {
    const flowData = vueFlow.toObject();

    // Optionally, you can prettify the JSON to make it more readable (though it increases size):
    const prettyFlowData = JSON.stringify(flowData, null, 2);

    localStorage.setItem(flowKey, prettyFlowData);
  }

  // Loading the Session:
  function loadSession() {
    const savedFlow = localStorage.getItem(flowKey);
    if (savedFlow) {
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
    toggleEdgeAnimation,

    updateNodeChatData,
    getConnectedNodes,
    saveSession,
    loadSession,
  };
}
