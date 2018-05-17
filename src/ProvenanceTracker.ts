import {
  StateNode,
  Action,
  IProvenanceTracker,
  IActionFunctionRegistry,
  IProvenanceGraph,
  ActionFunctionWithThis
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
   *
   */
  applyAction(action: Action): Promise<StateNode> {
    // Save the current node because this is is asynchronous
    const currentNode = this.graph.current;

    // Get the registered function from the action out of the registry
    const functionNameToExecute: string = action.do;
    const funcWithThis: ActionFunctionWithThis = this.registry.getFunctionByName(
      functionNameToExecute
    );

    const promisedResult = funcWithThis.func.apply(funcWithThis.thisArg, action.doArguments);

    // When the function promise resolves, we need to update the graph.
    return promisedResult.then((actionResult: any) => {
      const newNode: StateNode = {
        id: generateUUID(),
        label: action.do + ' : ' + JSON.stringify(action.doArguments),
        metadata: {
          createdBy: this.username,
          createdOn: generateTimestamp()
        },
        action,
        actionResult,
        parent: currentNode,
        children: [],
        artifacts: {}
      };

      currentNode.children.push(newNode);

      this.graph.addNode(newNode);
      this.graph.current = newNode;

      return newNode;
    });
  }
}
