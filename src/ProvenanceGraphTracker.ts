import {
  ProvenanceEnabledFunction,
  StateNode,
  Action,
  IProvenanceGraphTracker,
  IActionFunctionRegistry,
  IProvenanceGraph,
  StateEdge
} from './api';
import { generateUUID } from './utils';

async function executeFunctions(
  functionsToDo: ProvenanceEnabledFunction[],
  argumentsToDo: any[]
): Promise<StateNode> {
  let result;
  for (let i = 0; i < functionsToDo.length; i++) {
    result = await functionsToDo[i].apply(null, argumentsToDo[i]);
  }
  return result;
}

/**
 * Provenance Graph Tracker implementation
 *
 * @param graph The provenance graph to track (this will serve as storage construct)
 * @param current Optional parameter to set current node for importing a provenance graph that is non-empty
 *
 */
export class ProvenanceGraphTracker implements IProvenanceGraphTracker {
  private functionRegistry: IActionFunctionRegistry;
  private graph: IProvenanceGraph;

  constructor(
    functionRegistry: IActionFunctionRegistry,
    graph: IProvenanceGraph
  ) {
    this.functionRegistry = functionRegistry;
    this.graph = graph;
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
    const functionNameToExecute = action.do;
    const funct = this.functionRegistry.getFunctionByName(
      functionNameToExecute
    );

    const promisedResult = funct.apply(null, action.doArguments);

    // When the function promise resolves, we need to update the graph.
    promisedResult.then((actionResult: any) => {
      const newNode: StateNode = {
        id: generateUUID(),
        label: action.do + ' : ' + JSON.stringify(action.doArguments),
        actionResult,
        parent: null,
        children: [],
        artifacts: {}
      };

      const stateEdge: StateEdge = {
        previous: currentNode,
        action: action,
        next: newNode
      };
      newNode.parent = stateEdge;
      currentNode.children.push(stateEdge);

      this.graph.addStateNode(newNode);
      this.graph.current = newNode;

      return newNode;
    });

    return promisedResult;
  }
}
