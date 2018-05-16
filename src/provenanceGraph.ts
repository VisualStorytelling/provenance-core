import * as API from './api';
import { generateUUID } from './utils';

/**
 * Provenance Graph implementation
 *
 * @param version The version of the software to track the provenance of
 *
 */
class ProvenanceGraph implements API.IProvenanceGraph {
  public application: API.Application;
  private current: API.StateNode;
  private nodes: { [key: string]: API.StateNode };

  constructor(application: API.Application, current?: API.StateNode) {
    this.application = application;

    // If we didn't provide a current node, we are starting a new graph, so make a new root node
    if (current) {
      this.current = current;
    } else {
      this.current = {
        id: generateUUID(),
        label: 'Root',
        parent: null,
        children: [],
        artifacts: {}
      };
      this.addStateNode(this.current);
    }

    this.nodes = {};
  }

  addStateNode(node: API.StateNode): void {
    if (this.nodes[node.id]) {
      throw new Error('Node already added');
    }
    this.nodes[node.id] = node;
  }

  getStateNode(id: API.NodeIdentifier): API.StateNode {
    const result = this.nodes[id];
    if (!result) {
      throw new Error('Node id not found');
    }
    return this.nodes[id];
  }

  getCurrentStateNode(): API.StateNode {
    return this.current;
  }
}

/**
 * Provenance Graph Tracker implementation
 *
 * @param graph The provenance graph to track (this will serve as storage construct)
 * @param current Optional parameter to set current node for importing a provenance graph that is non-empty
 *
 */
class ProvenanceGraphTracker implements API.IProvenanceGraphTracker {
  private graph: ProvenanceGraph;
  private functionRegistry: { [key: string]: API.ProvenanceEnabledFunction };

  constructor(graph: ProvenanceGraph) {
    this.graph = graph;

    this.functionRegistry = {};
  }

  static findPathToTargetNode(
    currentNode: API.StateNode,
    targetNode: API.StateNode,
    track: API.StateNode[]
  ): boolean {
    if (currentNode === null) {
      return false;
    } else if (currentNode === targetNode) {
      track.push(currentNode);
      return true;
    } else {
      // Map the StateNodes in the children StateEdges
      const nodesToCheck = currentNode.children.map(child => child.next);
      // Add the parent node to that same list
      if (currentNode.parent !== null) {
        nodesToCheck.push(currentNode.parent.previous);
      }

      for (let node of nodesToCheck) {
        // If the node to check is in the track already, skip it.
        if (
          track.length > 0 &&
          track[track.length - 1] !== node &&
          ProvenanceGraphTracker.findPathToTargetNode(node, targetNode, track)
        ) {
          track.push(currentNode);
          return true;
        }
      }
      return false;
    }
  }

  static isNextNodeInTrackUp(
    currentNode: API.StateNode,
    nextNode: API.StateNode
  ): boolean {
    if (currentNode.parent && currentNode.parent.previous === nextNode) {
      return true;
    } else if (nextNode.parent && nextNode.parent.previous !== currentNode) {
      // This is a guard against the illegitimate use of this function for unconnected nodes
      throw new Error(
        'Unconnected nodes, you probably should not be using this function'
      );
    } else {
      return false;
    }
  }

  /**
   * Register a new function into the provenance tracker (to be able to call it later)
   *
   * @param name The name of the new function to register
   * @param func The ProvenanceEnabledFunction to register
   *
   */
  registerFunction(name: string, func: API.ProvenanceEnabledFunction) {
    if (this.functionRegistry[name]) {
      throw new Error('Function already registred');
    }
    this.functionRegistry[name] = func;
  }

  /**
   * Calls the action.do function with action.doArguments
   *
   * @param action
   *
   */
  applyActionToCurrentStateNode(action: API.Action): Promise<API.StateNode> {
    // Save the current node because this is is asynchronous
    const currentNode = this.graph.getCurrentStateNode();

    // Get the registered function from the action out of the registry
    const functionNameToExecute = action.do;
    if (!this.functionRegistry[functionNameToExecute]) {
      throw new Error('Function not found in registry');
    }
    const promisedResult = this.functionRegistry[functionNameToExecute].apply(
      null,
      action.doArguments
    );

    // When the function promise resolves, we need to update the graph.
    promisedResult.then((actionResult: any) => {
      const newNode: API.StateNode = {
        id: generateUUID(),
        label: action.do + ' : ' + JSON.stringify(action.doArguments),
        actionResult,
        parent: null,
        children: [],
        artifacts: {}
      };

      const stateEdge: API.StateEdge = {
        previous: currentNode,
        action: action,
        next: newNode
      };
      newNode.parent = stateEdge;
      currentNode.children.push(stateEdge);

      this.graph.addStateNode(newNode);

      return newNode;
    });

    return promisedResult;
  }

  /**
   * Finds shortest path between current node and node with request identifer.
   * Calls the do/undo functions of actions on the path.
   *
   * @param id
   */
  traverseToStateNode(id: API.NodeIdentifier): Promise<API.StateNode> {
    const currentNode = this.graph.getCurrentStateNode();
    const targetNode = this.graph.getStateNode(id);

    const trackToTarget: API.StateNode[] = [];

    const success = ProvenanceGraphTracker.findPathToTargetNode(
      currentNode,
      targetNode,
      trackToTarget
    );

    if (!success) {
      throw new Error('No path to target node found in graph');
    }

    const functionsToDo: API.ProvenanceEnabledFunction[] = [];
    const argumentsToDo: any[] = [];

    for (let i = 0; i < trackToTarget.length - 1; i++) {
      const thisNode = trackToTarget[i];
      const nextNode = trackToTarget[i + 1];
      const up = ProvenanceGraphTracker.isNextNodeInTrackUp(thisNode, nextNode);

      if (up) {
        if (!thisNode.parent) {
          throw new Error('Going up from root? unreachable error ... i hope');
        }
        if (!API.isReversibleAction(thisNode.parent.action)) {
          throw new Error('trying to undo an Irreversible action');
        }
        functionsToDo.push(this.functionRegistry[thisNode.parent.action.undo]);
        argumentsToDo.push(thisNode.parent.action.undoArguments);
      } else {
        if (!nextNode.parent) {
          throw new Error(
            'Going down to the root? unreachable error ... i hope'
          );
        }
        functionsToDo.push(this.functionRegistry[nextNode.parent.action.do]);
        argumentsToDo.push(nextNode.parent.action.doArguments);
      }
    }

    return Promise.resolve(this.graph.getCurrentStateNode());
  }
}
