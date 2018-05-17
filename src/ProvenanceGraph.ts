import {
  IProvenanceGraph,
  Application,
  StateNode,
  NodeIdentifier,
  Node,
  RootNode
} from './api';
import { generateUUID } from './utils';

/**
 * Provenance Graph implementation
 *
 * @param version The version of the software to track the provenance of
 *
 */
export class ProvenanceGraph implements IProvenanceGraph {
  public application: Application;
  private _current: Node;
  private nodes: { [key: string]: Node } = {};

  constructor(application: Application) {
    this.application = application;

    this._current = {
      id: generateUUID(),
      label: 'Root',
      parent: null,
      children: [],
      artifacts: {}
    } as RootNode;
    this.addNode(this._current);
  }

  addNode(node: Node): void {
    if (this.nodes[node.id]) {
      throw new Error('Node already added');
    }
    this.nodes[node.id] = node;
  }

  getNode(id: NodeIdentifier): Node {
    const result = this.nodes[id];
    if (!result) {
      throw new Error('Node id not found');
    }
    return this.nodes[id];
  }

  get current(): Node {
    return this._current;
  }

  set current(node: Node) {
    if (!this.nodes[node.id]) {
      throw new Error('Node id not found');
    }
    this._current = node;
  }
}
