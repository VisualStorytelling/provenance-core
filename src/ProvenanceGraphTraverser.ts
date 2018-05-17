import {
  IProvenanceGraphTraverser,
  Node,
  StateNode,
  IActionFunctionRegistry,
  IProvenanceGraph,
  NodeIdentifier,
  ActionFunctionWithThis
} from './api';
import { isReversibleAction, isStateNode } from './utils';

function isNextNodeInTrackUp(currentNode: Node, nextNode: Node): boolean {
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
  currentNode: Node,
  targetNode: Node,
  track: Node[],
  comingFromNode: Node = currentNode
): boolean {
  if (currentNode && currentNode === targetNode) {
    track.unshift(currentNode);
    return true;
  } else if (currentNode) {
    // Map the StateNodes in the children StateEdges
    const nodesToCheck: Node[] = currentNode.children;

    // Add the parent node to that same list
    /* istanbul ignore else */
    if (isStateNode(currentNode)) {
      nodesToCheck.push(currentNode.parent);
    }

    for (let node of nodesToCheck) {
      // If the node to check is in the track already, skip it.
      if (node === comingFromNode) continue;
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

async function executeFunctions(
  functionsToDo: ActionFunctionWithThis[],
  argumentsToDo: any[]
): Promise<StateNode> {
  let result;
  for (let i = 0; i < functionsToDo.length; i++) {
    let funcWithThis = functionsToDo[i];
    result = await funcWithThis.func.apply(funcWithThis.thisArg, argumentsToDo[i]);
  }
  return result;
}

export class ProvenanceGraphTraverser implements IProvenanceGraphTraverser {
  private registry: IActionFunctionRegistry;
  private graph: IProvenanceGraph;

  constructor(registry: IActionFunctionRegistry, graph: IProvenanceGraph) {
    this.registry = registry;
    this.graph = graph;
  }

  /**
   * Finds shortest path between current node and node with request identifer.
   * Calls the do/undo functions of actions on the path.
   *
   * @param id Node identifier
   */
  toStateNode(id: NodeIdentifier): Promise<Node> {
    try {
      const currentNode = this.graph.current;
      const targetNode = this.graph.getNode(id);

      if (currentNode === targetNode) {
        return Promise.resolve(currentNode);
      }

      const trackToTarget: Node[] = [];

      const success = findPathToTargetNode(currentNode, targetNode, trackToTarget);

      /* istanbul ignore if */
      if (!success) {
        throw new Error('No path to target node found in graph');
      }

      const functionsToDo: ActionFunctionWithThis[] = [];
      const argumentsToDo: any[] = [];

      for (let i = 0; i < trackToTarget.length - 1; i++) {
        const thisNode = trackToTarget[i];
        const nextNode = trackToTarget[i + 1];
        const up = isNextNodeInTrackUp(thisNode, nextNode);

        if (up) {
          /* istanbul ignore else */
          if (isStateNode(thisNode)) {
            if (!isReversibleAction(thisNode.action)) {
              throw new Error('trying to undo an Irreversible action');
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
      const result = executeFunctions(functionsToDo, argumentsToDo);
      result.then(() => (this.graph.current = targetNode));
      return result;
    } catch (e) {
      return Promise.reject(e);
    }
  }
}
