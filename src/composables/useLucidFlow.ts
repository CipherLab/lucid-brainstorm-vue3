// src/composables/useLucidFlow.ts
import { ref, reactive } from 'vue';
import { useVueFlow, Node, Edge } from '@vue-flow/core';
interface LucidFlowState {
  nodes: Node[];
  edges: Edge[];
  nodesTotal: number;
}
export interface LucidFlowComposable {
  nodes: Node[];
  edges: Edge[];
  nodesTotal: number;
  addNode: (node: Node) => void;
  removeNode: (nodeId: string) => void;
  addEdge: (edge: Edge) => void;
  updateNodePosition: (nodeId: string, x: number, y: number) => void;
}

export default function useLucidFlow(): LucidFlowComposable {
  const {
    removeNodes,
    addNodes: vfAddNodes,
    addEdges: vfAddEdges,
  } = useVueFlow();

  // Reactive state with type
  const state = reactive<LucidFlowState>({
    nodes: Array<Node>(),
    edges: [],
    nodesTotal: 0,
  });

  const addNode = (node: Node) => {
    state.nodes.push(node);
    vfAddNodes([node]);
    state.nodesTotal++;
  };

  const removeNode = (nodeId: string) => {
    state.nodes = state.nodes.filter((node) => node.id !== nodeId);
    removeNodes(nodeId);
    state.nodesTotal--;
  };

  const addEdge = (edge: Edge) => {
    state.edges.push(edge);
    vfAddEdges([edge]);
  };

  // Expose functions for node/edge manipulation
  const updateNodePosition = (nodeId: string, x: number, y: number) => {
    const nodeToUpdate = state.nodes.find((node) => node.id === nodeId);
    if (nodeToUpdate) {
      nodeToUpdate.position = { x, y }; // Directly mutate the node object
    }
  };
  return {
    ...state, // Spread the reactive state properties
    addNode,
    removeNode,
    addEdge,
    updateNodePosition,
  };
}
