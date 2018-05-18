/**
 * String identifier for nodes (e.g., a generated UUID)
 */

export type NodeIdentifier = string;

/**
 * Action can be either reversible or irreversible
 */
export type Action = IrreversibleAction | ReversibleAction;

/**
 * ActionMetadata
 */
export type ActionMetadata = {
  /**
   * List of tags
   */
  tags?: string[];

  /**
   * The intent of the user to trigger this action
   */
  userIntent?: string;

  /**
   * Enable custom properties
   */
  [key: string]: any;
};

/**
 * NodeMetadata
 */
export type NodeMetadata = {
  /**
   * Username
   */
  createdBy: string;

  /**
   * UNIX timestamp
   */
  createdOn: number;

  /**
   * Enable custom properties
   */
  [key: string]: any;
};

/**
 * Artifacts that are attached to a node
 */
export type Artifacts = {
  /**
   * Enable custom properties
   */
  [key: string]: any;
};

/**
 * Generic node
 */
export type ProvenanceNode = {
  /**
   * Node identifier
   */
  id: NodeIdentifier;

  /**
   * Label
   */
  label: string;

  /**
   * Node metadata
   */
  metadata: NodeMetadata;

  /**
   * Children
   */
  children: StateNode[];

  /**
   * Artifacts
   */
  artifacts: Artifacts;
};

/**
 * Root node
 */
export type RootNode = ProvenanceNode;

/**
 * State node extending the ProvenanceNode
 */
export type StateNode = ProvenanceNode & {
  /**
   * Action
   */
  action: Action;

  /**
   * Action result
   */
  actionResult: any;

  /**
   * Parent node of this node
   */
  parent: ProvenanceNode;
};

/**
 * Irreversible action that can only be applied, but cannot be reverted
 */
export type IrreversibleAction = {
  /**
   * Metadata (optional)
   */
  metadata?: ActionMetadata;

  /**
   * Function name to a registered function that is executed when applying an action
   */
  do: string;

  /**
   * Multiple arguments that are passed to the registered do function.
   * The arguments should be immutable!
   */
  doArguments: any[]; // should be immutable
};

/**
 * Reversible action that can be applied and reverted
 */
export type ReversibleAction = {
  /**
   * Metadata (optional)
   */
  metadata?: ActionMetadata;

  /**
   * Function name to a registered function that is executed when applying an action
   */
  do: string;

  /**
   * Multiple arguments that are passed to the registered do function.
   * The arguments should be immutable!
   */
  doArguments: any[];

  /**
   * Function name to a registered function that is executed when reverting an action
   */
  undo: string;

  /**
   * Multiple arguments that are passed to the registered do function.
   * The arguments should be immutable!
   */
  undoArguments: any[];
};

/**
 * Action function that can be registered and will be executed when applying an Action
 */
export type ActionFunction = (...args: any[]) => Promise<any>;

/**
 * Bundle of an ActionFunction with a reference to the `this` context
 */
export type ActionFunctionWithThis = {
  /**
   * Action function
   */
  func: ActionFunction;

  /**
   * Value to use as this (i.e the reference Object) when executing callback
   */
  thisArg: any;
};

/**
 * Metadata about the application
 */
export type Application = {
  /**
   * Application name
   */
  name: string;

  /**
   * Application version
   */
  version: string;
};

export type Handler = (event?: any) => void;

/**
 * Provenance graph stores the nodes, the current pointer and is bound to a specific application
 */
export interface IProvenanceGraph {
  /**
   * Application metadata
   */
  application: Application;

  /**
   * Pointer to the currently active node
   */
  current: ProvenanceNode;

  root: RootNode;

  /**
   * Add a new node to the provenance graph
   * @param node ProvenanceNode to add
   */
  addNode(node: ProvenanceNode): void;

  /**
   * Find a node by a given identifier and return the node if found
   * @param id ProvenanceNode identifier
   */
  getNode(id: NodeIdentifier): ProvenanceNode;

  emitNodeChangedEvent(node: ProvenanceNode): void;
  on(type: string, handler: Handler): void;
  off(type: string, handler: Handler): void;
}

/**
 * Action function registry stores all available functions that can be applied
 */
export interface IActionFunctionRegistry {
  /**
   * Add a new function to the registry
   * @param name The name of the new function to register
   * @param func Function that get called with the doArguments or undoArguments
   * @param thisArg Value to use as this (i.e the reference Object) when executing callback
   */
  register(name: string, func: ActionFunction, thisArg?: any): void;

  /**
   * Find a registered function by name and return the function if found
   * @param name Name of the registered function
   */
  getFunctionByName(name: string): ActionFunctionWithThis;
}

/**
 * The provenance tracker takes a action function registry.
 * New actions are executed and if successful stored as new StateNode in the graph.
 */
export interface IProvenanceTracker {
  /**
   * Action function registry
   */
  registry: IActionFunctionRegistry;

  /**
   * 1. Calls the action.do function with action.doArguments
   * 2. Append action to graph via a StateEdge and StateNode
   * 3. Makes the created StateNode the current state node
   *
   * @param action
   * @param skipFirstDoFunctionCall If set to true, the do-function will not be called this time,
   *        it will only be called when traversing.
   */
  applyAction(action: Action, skipFirstDoFunctionCall: boolean): Promise<StateNode>;
}

/**
 * The traverser changes the current node in the provenance graph
 * and executes the undo/redo function while moving through the graph structure.
 */
export interface IProvenanceGraphTraverser {
  graph: IProvenanceGraph;

  /**
   * Finds shortest path between current node and node with request identifer.
   * Calls the do/undo functions of actions on the path.
   *
   * @param id
   */
  toStateNode(id: NodeIdentifier): Promise<ProvenanceNode>;
}
