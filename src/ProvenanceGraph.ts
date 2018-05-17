import { IProvenanceGraph, Application, StateNode, NodeIdentifier } from './api';
import { generateUUID } from './utils';

/**
 * Provenance Graph implementation
 *
 * @param version The version of the software to track the provenance of
 *
 */
export class ProvenanceGraph implements IProvenanceGraph {
  public application: Application;
  private _current: StateNode;
  private nodes: { [key: string]: StateNode } = {};

  constructor(application: Application) {
    this.application = application;

    this._current = {
      id: generateUUID(),
      label: 'Root',
      parent: null,
      children: [],
      artifacts: {}
    };
    this.addStateNode(this._current);
  }

  addStateNode(node: StateNode): void {
    if (this.nodes[node.id]) {
      throw new Error('Node already added');
    }
    this.nodes[node.id] = node;
  }

  getStateNode(id: NodeIdentifier): StateNode {
    const result = this.nodes[id];
    if (!result) {
      throw new Error('Node id not found');
    }
    return this.nodes[id];
  }

  get current() {
    return this._current;
  }

  set current(node: StateNode) {
    this._current = node;
  }
}
