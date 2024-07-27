import { Dimensions, HandleConnectable, NodeProps } from '@vue-flow/core';
import { Node } from '@vue-flow/core';
export interface DraggedItem {
  type: 'agent' | 'input';
  data:
    | {
        id: number;
        name?: string;
        icon: string;
        color: string;
      }
    | 'file'
    | 'prompt'; // Adjust the type as needed
}

// export interface NodeData {
//   label: string;
//   agent?: {
//     id: number;
//     name: string;
//     icon: string;
//     color: string;
//   };
// }

// Define the type for the nodeProps
export interface Todo {
  id: number;
  content: string;
}

export interface Meta {
  totalCount: number;
}

export type MittEvents = {
  data: any;
  end: void;
  error: any;
  connect: void;
  close: boolean;
  nodeSelected: { nodeId: string };
};
