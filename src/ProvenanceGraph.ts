import {
  IProvenanceGraph,
  Application,
  StateNode,
  NodeIdentifier,
  ProvenanceNode,
  RootNode
} from './api';
import { generateUUID, generateTimestamp } from './utils';

/**
 * Provenance Graph implementation
 *
 * @param version The version of the software to track the provenance of
 *
 */
export class ProvenanceGraph implements IProvenanceGraph {
  public application: Application;
  private _current: ProvenanceNode;
  private nodes: { [key: string]: ProvenanceNode } = {};

  constructor(application: Application, username: string = 'Unknown') {
    this.application = application;

    this._current = {
      id: generateUUID(),
      label: 'Root',
      metadata: {
        createdBy: username,
        createdOn: generateTimestamp()
      },
      children: [],
      artifacts: {}
    } as RootNode;
    this.addNode(this._current);
  }

  addNode(node: ProvenanceNode): void {
    if (this.nodes[node.id]) {
      throw new Error('Node already added');
    }
    this.nodes[node.id] = node;
  }

  getNode(id: NodeIdentifier): ProvenanceNode {
    const result = this.nodes[id];
    if (!result) {
      throw new Error('Node id not found');
    }
    return this.nodes[id];
  }

  get current(): ProvenanceNode {
    return this._current;
  }

  set current(node: ProvenanceNode) {
    if (!this.nodes[node.id]) {
      throw new Error('Node id not found');
    }
    this._current = node;
  }
}
