import {
  StateNode,
  Action,
  IProvenanceTracker,
  IActionFunctionRegistry,
  IProvenanceGraph,
  ActionFunctionWithThis,
  ProvenanceNode
} from './api';
import { generateUUID, generateTimestamp } from './utils';

/**
 * Provenance Graph Tracker implementation
 *
 * @param graph The provenance graph to track (this will serve as storage construct)
 * @param current Optional parameter to set current node for importing a provenance graph that is non-empty
 *
 */
export class ProvenanceTracker implements IProvenanceTracker {
  registry: IActionFunctionRegistry;

  private graph: IProvenanceGraph;
  private username: string;

  constructor(
    registry: IActionFunctionRegistry,
    graph: IProvenanceGraph,
    username: string = 'Unknown'
  ) {
    this.registry = registry;
    this.graph = graph;
    this.username = username;
  }

  /**
   * Calls the action.do function with action.doArguments
   *
   * @param action
   * @param skipFirstDoFunctionCall If set to true, the do-function will not be called this time,
   *        it will only be called when traversing.
   */
  async applyAction(action: Action, skipFirstDoFunctionCall: boolean = false): Promise<StateNode> {
    const createNewStateNode = (parentNode: ProvenanceNode, actionResult: any): StateNode => ({
      id: generateUUID(),
      label: action.do,
      metadata: {
        createdBy: this.username,
        createdOn: generateTimestamp()
      },
      action,
      actionResult,
      parent: parentNode,
      children: [],
      artifacts: {}
    });

    let newNode: StateNode;

    // Save the current node because the next block could be asynchronous
    const currentNode = this.graph.current;

    if (skipFirstDoFunctionCall) {
      newNode = createNewStateNode(this.graph.current, null);
    } else {
      // Get the registered function from the action out of the registry
      const functionNameToExecute: string = action.do;
      const funcWithThis: ActionFunctionWithThis = this.registry.getFunctionByName(
        functionNameToExecute
      );
      const actionResult = await funcWithThis.func.apply(funcWithThis.thisArg, action.doArguments);

      newNode = createNewStateNode(currentNode, actionResult);
    }

    // When the node is created, we need to update the graph.
    currentNode.children.push(newNode);

    this.graph.addNode(newNode);
    this.graph.current = newNode;

    return newNode;
  }
}
