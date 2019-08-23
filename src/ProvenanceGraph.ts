import {
  Application,
  Handler,
  IProvenanceGraph,
  NodeIdentifier,
  ProvenanceNode,
  RootNode,
  SerializedProvenanceGraph,
  SerializedProvenanceNode,
  SerializedStateNode,
  IScreenShotProvider,
  IScreenShot
} from './api';
import { generateTimestamp, generateUUID, isStateNode } from './utils';
import mitt from './mitt';

/**
 * Provenance Graph implementation
 *
 * @param version The version of the software to track the provenance of
 *
 */
export class ProvenanceGraph implements IProvenanceGraph {
  public application: Application;
  public readonly root: RootNode;
  private _current: ProvenanceNode;
  private _mitt: any;
  private _nodes: { [key: string]: ProvenanceNode } = {};

  constructor(application: Application, userid: string = 'Unknown', rootNode?: RootNode) {
    this._mitt = mitt();
    this.application = application;

    if (rootNode) {
      this.root = rootNode;
    } else {
      this.root = {
        id: generateUUID(),
        label: 'Root',
        metadata: {
          createdBy: userid,
          createdOn: generateTimestamp()
        },
        children: [],
        artifacts: {}
      } as RootNode;
    }
    this.addNode(this.root);
    this._current = this.root;
  }

  addNode(node: ProvenanceNode): void {
    if (this._nodes[node.id]) {
      throw new Error('Node already added');
    }
    this._nodes[node.id] = node;
    this._mitt.emit('nodeAdded', node);
  }

  getNode(id: NodeIdentifier): ProvenanceNode {
    const result = this._nodes[id];
    if (!result) {
      throw new Error('Node id not found');
    }
    return this._nodes[id];
  }

  get current(): ProvenanceNode {
    return this._current;
  }

  set current(node: ProvenanceNode) {
    if (!this._nodes[node.id]) {
      throw new Error('Node id not found');
    }
    this._current = node;
    this._mitt.emit('currentChanged', node);
  }

  get nodes() {
    return this._nodes;
  }

  emitNodeChangedEvent(node: ProvenanceNode) {
    /* istanbul ignore if */
    if (!this._nodes[node.id]) {
      throw new Error('Node id not found');
    }
    this._mitt.emit('nodeChanged', node);
  }

  on(type: string, handler: Handler) {
    this._mitt.on(type, handler);
  }

  off(type: string, handler: Handler) {
    this._mitt.off(type, handler);
  }
}

/* Beware that deeply nested properties in serializedProvenanceGraph is mutated in the process */
export function restoreProvenanceGraph(
  serializedProvenanceGraph: SerializedProvenanceGraph
): ProvenanceGraph {
  const nodes: { [key: string]: any } = {};

  // restore nodes as key value
  for (const node of serializedProvenanceGraph.nodes) {
    nodes[node.id] = { ...node };
  }

  // restore parent/children relations
  for (const nodeId of Object.keys(nodes)) {
    const node = nodes[nodeId];
    node.children = node.children.map((id: string) => nodes[id]);
    if ('parent' in node) {
      node.parent = nodes[node.parent];
    }
  }

  const graph = new ProvenanceGraph(serializedProvenanceGraph.application);
  (graph as any)._nodes = nodes;
  (graph as any)._current = nodes[serializedProvenanceGraph.current];
  (graph as any).root = nodes[serializedProvenanceGraph.root];

  return graph;
}

export function serializeProvenanceGraph(graph: ProvenanceGraph): SerializedProvenanceGraph {
  const nodes = Object.keys(graph.nodes).map(nodeId => {
    const node = graph.getNode(nodeId);
    const serializedNode: SerializedProvenanceNode = { ...node } as any;
    if (isStateNode(node)) {
      (serializedNode as SerializedStateNode).parent = node.parent.id;
    }
    serializedNode.children = node.children.map(child => child.id);
    return serializedNode;
  });

  return {
    nodes,
    root: graph.root.id,
    application: graph.application,
    current: graph.current.id
  };
}
