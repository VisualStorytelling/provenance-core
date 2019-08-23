import {
  StateNode,
  Action,
  IProvenanceTracker,
  IActionFunctionRegistry,
  IProvenanceGraph,
  ActionFunctionWithThis,
  ProvenanceNode,
  RootNode,
  IScreenShotProvider
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

  /**
   * When acceptActions is false, the Tracker will ignore calls to applyAction
   */
  public acceptActions = true;

  private graph: IProvenanceGraph;
  private username: string;

  private _screenShotProvider: IScreenShotProvider | null = null;
  private _autoScreenShot = false;

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
   * Calls the action.do function with action.doArguments. This will also create a new StateNode
   * in the graph corresponding to the action taken. Optionally, the label set in action.metadata.label
   * will be taken as the label for this node.
   *
   * @param action
   * @param skipFirstDoFunctionCall If set to true, the do-function will not be called this time,
   *        it will only be called when traversing.
   */
  async applyAction(action: Action, skipFirstDoFunctionCall: boolean = false): Promise<StateNode> {
    if (!this.acceptActions) {
      return Promise.resolve(this.graph.current as StateNode);
    }

    let label = '';
    if (action.metadata && action.metadata.label) {
      label = action.metadata.label;
    } else {
      label = action.do;
    }

    const createNewStateNode = (parentNode: ProvenanceNode, actionResult: any): StateNode => ({
      id: generateUUID(),
      label: label,
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

    if (this.autoScreenShot && this.screenShotProvider) {
      try {
        newNode.metadata.screenShot = this.screenShotProvider();
      } catch (e) {
        console.warn('Error while getting screenshot', e);
      }
    }

    // When the node is created, we need to update the graph.
    currentNode.children.push(newNode);

    this.graph.addNode(newNode);
    this.graph.current = newNode;

    return newNode;
  }

  get screenShotProvider() {
    return this._screenShotProvider;
  }

  set screenShotProvider(provider: IScreenShotProvider | null) {
    this._screenShotProvider = provider;
  }

  get autoScreenShot(): boolean {
    return this._autoScreenShot;
  }

  set autoScreenShot(value: boolean) {
    this._autoScreenShot = value;
    if (value && !this._screenShotProvider) {
      console.warn('Setting autoScreenShot to true, but no screenShotProvider is set');
    }
  }
}
