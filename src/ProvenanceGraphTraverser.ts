import {
  IProvenanceGraphTraverser,
  ProvenanceNode,
  StateNode,
  IActionFunctionRegistry,
  IProvenanceGraph,
  NodeIdentifier,
  ActionFunctionWithThis,
  IProvenanceTracker,
  Handler
} from './api';
import { isReversibleAction, isStateNode } from './utils';
import mitt from './mitt';

function isNextNodeInTrackUp(currentNode: ProvenanceNode, nextNode: ProvenanceNode): boolean {
  if (isStateNode(currentNode) && currentNode.parent === nextNode) {
    return true;
  } else if (isStateNode(nextNode) && nextNode.parent !== currentNode) {
    // This is a guard against the illegitimate use of this function for unconnected nodes
    /* istanbul ignore next */
    throw new Error('Unconnected nodes, you probably should not be using this function');
  } else {
    return false;
  }
}

function findPathToTargetNode(
  currentNode: ProvenanceNode,
  targetNode: ProvenanceNode,
  track: ProvenanceNode[],
  comingFromNode: ProvenanceNode = currentNode
): boolean {
  if (currentNode && currentNode === targetNode) {
    track.unshift(currentNode);
    return true;
  } else if (currentNode) {
    // Map the StateNodes in the children StateEdges
    const nodesToCheck: ProvenanceNode[] = [...currentNode.children];

    // Add the parent node to that same list
    /* istanbul ignore else */
    if (isStateNode(currentNode)) {
      nodesToCheck.push(currentNode.parent);
    }

    for (const node of nodesToCheck) {
      // If the node to check is in the track already, skip it.
      if (node === comingFromNode) {
        continue;
      }
      /* istanbul ignore else */
      if (findPathToTargetNode(node, targetNode, track, currentNode)) {
        track.unshift(currentNode);
        return true;
      }
    }
  }
  /* istanbul ignore next */
  return false;
}

class IrreversibleError extends Error {
  invalidTraversal = true;
}

export class ProvenanceGraphTraverser implements IProvenanceGraphTraverser {
  public graph: IProvenanceGraph;
  public tracker: IProvenanceTracker | null;
  /**
   * trackingWhenTraversing === false disables tracking when traversing to prevent feedback.
   * When applying an action, the object we're tracking might trigger its event listeners. This
   * means that more Nodes are added to the ProvenanceGraph when traversing, which is most likely
   * unwanted behaviour.
   *
   * It will enable/disable immediately before/after calling the action. So if the event is emitted
   * asynchronously after the action, it will not work.
   */
  public trackingWhenTraversing = false;
  private registry: IActionFunctionRegistry;
  private _mitt: any;

  constructor(
    registry: IActionFunctionRegistry,
    graph: IProvenanceGraph,
    tracker: IProvenanceTracker | null = null
  ) {
    this.registry = registry;
    this.graph = graph;
    this.tracker = tracker;
    this._mitt = mitt();
  }

  async executeFunctions(
    functionsToDo: ActionFunctionWithThis[],
    argumentsToDo: any[],
    transitionTimes: number[]
  ): Promise<StateNode> {
    let result;
    for (let i = 0; i < functionsToDo.length; i++) {
      const funcWithThis = functionsToDo[i];
      let promise: any;
      if (this.tracker && this.tracker.acceptActions && !this.trackingWhenTraversing) {
        this.tracker.acceptActions = false;
        promise = funcWithThis.func.apply(funcWithThis.thisArg, argumentsToDo[i]);
        this.tracker.acceptActions = true;
      } else {
        promise = funcWithThis.func.apply(funcWithThis.thisArg, argumentsToDo[i]);
      }
      result = await promise;
    }
    return result;
  }

  /**
   * Finds shortest path between current node and node with request identifer.
   * Calls the do/undo functions of actions on the path.
   *
   * @param id Node identifier
   */
  async toStateNode(
    id: NodeIdentifier,
    transtionTime?: number
  ): Promise<ProvenanceNode | undefined> {
    const currentNode = this.graph.current;
    const targetNode = this.graph.getNode(id);

    if (currentNode === targetNode) {
      return Promise.resolve(currentNode);
    }

    const trackToTarget: ProvenanceNode[] = [];

    const success = findPathToTargetNode(currentNode, targetNode, trackToTarget);

    /* istanbul ignore if */
    if (!success) {
      throw new Error('No path to target node found in graph');
    }

    let functionsToDo: ActionFunctionWithThis[], argumentsToDo: any[];
    const transitionTimes: number[] = [];
    try {
      const arg = this.getFunctionsAndArgsFromTrack(trackToTarget);
      functionsToDo = arg.functionsToDo;
      argumentsToDo = arg.argumentsToDo;
      functionsToDo.forEach((func: any) => {
        transitionTimes.push(transtionTime || 0);
      });
    } catch (error) {
      if (error.invalidTraversal) {
        this._mitt.emit('invalidTraversal', targetNode);
        return undefined;
      } else {
        /* istanbul ignore next */
        throw error; // should never happen
      }
    }
    const result = await this.executeFunctions(functionsToDo, argumentsToDo, transitionTimes);
    this.graph.current = targetNode;
    return result;
  }

  private getFunctionsAndArgsFromTrack(
    track: ProvenanceNode[]
  ): {
    functionsToDo: ActionFunctionWithThis[];
    argumentsToDo: any[];
  } {
    const functionsToDo: ActionFunctionWithThis[] = [];
    const argumentsToDo: any[] = [];

    for (let i = 0; i < track.length - 1; i++) {
      const thisNode = track[i];
      const nextNode = track[i + 1];
      const up = isNextNodeInTrackUp(thisNode, nextNode);

      if (up) {
        /* istanbul ignore else */
        if (isStateNode(thisNode)) {
          if (!isReversibleAction(thisNode.action)) {
            throw new IrreversibleError('trying to undo an Irreversible action');
          }
          const undoFunc = this.registry.getFunctionByName(thisNode.action.undo);
          functionsToDo.push(undoFunc);
          argumentsToDo.push(thisNode.action.undoArguments);
        } else {
          /* istanbul ignore next */
          throw new Error('Going up from root? unreachable error ... i hope');
        }
      } else {
        /* istanbul ignore else */
        if (isStateNode(nextNode)) {
          const doFunc = this.registry.getFunctionByName(nextNode.action.do);
          functionsToDo.push(doFunc);
          argumentsToDo.push(nextNode.action.doArguments);
        } else {
          /* istanbul ignore next */
          throw new Error('Going down to the root? unreachable error ... i hope');
        }
      }
    }

    return { functionsToDo, argumentsToDo };
  }

  on(type: string, handler: Handler) {
    this._mitt.on(type, handler);
  }

  off(type: string, handler: Handler) {
    this._mitt.off(type, handler);
  }
}
