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
export interface MyNodeProps extends Node<NodeProps<any, object, string>> {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    id: string;
    type: string;
    selected: boolean;
    connectable: boolean;
    hasOutput: boolean;
    hasInput: boolean;
    icon: string;
    label: string;
    temperature: number;
    systemInstructions: string;
    tokenCount: number;
    subType: string;
    position: { x: number; y: number };
    dimensions: { width: number; height: number };
    dragging: boolean;
    resizing: boolean;
    // Add the missing properties as per the error message
    zIndex: number; // Assuming zIndex is a number
    data: any; // Placeholder, replace 'any' with the correct type based on your application's needs
    events: any; // Placeholder, replace 'any' with the correct type based on your application's needs
    // Previously mentioned placeholders for additional properties
    a: any; // Replace 'any' with the correct type
    b: any; // Replace 'any' with the correct type
    c: any; // Replace 'any' with the correct type
  };
  backgroundColor: string;
  selected: boolean;
  dimensions: { width: number; height: number };

  onRemoveNode: (id: string) => void;
}
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
