import {
  IProvenanceGraph,
  Application,
  StateNode,
  NodeIdentifier,
  ProvenanceNode,
  RootNode,
  Handler
} from './api';
import { generateUUID, generateTimestamp } from './utils';
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
  private nodes: { [key: string]: ProvenanceNode } = {};

  constructor(application: Application, username: string = 'Unknown') {
    this._mitt = mitt();
    this.application = application;

    this.root = {
      id: generateUUID(),
      label: 'Root',
      metadata: {
        createdBy: username,
        createdOn: generateTimestamp()
      },
      children: [],
      artifacts: {}
    } as RootNode;
    this.addNode(this.root);
    this._current = this.root;
  }

  serialize(): any {}

  addNode(node: ProvenanceNode): void {
    if (this.nodes[node.id]) {
      throw new Error('Node already added');
    }
    this.nodes[node.id] = node;
    this._mitt.emit('nodeAdded', node);
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
    this._mitt.emit('currentChanged', node);
  }

  emitNodeChangedEvent(node: ProvenanceNode) {
    /* istanbul ignore if */
    if (!this.nodes[node.id]) {
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
