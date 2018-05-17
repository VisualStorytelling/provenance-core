export type NodeIdentifier = string;
export type Action = IrreversibleAction | ReversibleAction;

export type Metadata = {
  createdBy: string;
  createdOn: string;
  tags: string[];
  userIntent: string;
  [key: string]: any;
};

export type Artifacts = {
  [key: string]: any;
};

export type StateNode = {
  id: NodeIdentifier;
  label: string;
  actionResult?: any;
  parent: StateEdge | null;
  children: StateEdge[];
  artifacts: Artifacts;
};

export type StateEdge = {
  previous: StateNode;
  next: StateNode;
  action: Action;
};

export type IrreversibleAction = {
  metadata: Metadata;
  do: string;
  doArguments: any[]; // should be immutable
};

export type ReversibleAction = {
  metadata: Metadata;
  do: string;
  doArguments: any[]; // should be immutable
  undo: string;
  undoArguments: any[]; // should be immutable
};

export type ActionFunction = (...args: any[]) => Promise<any>;
export type ActionFunctionWithThis = {
  func: ActionFunction;
  thisArg: any;
};

export type Application = {
  name: string;
  version: string;
};

export interface IProvenanceGraph {
  application: Application;
  current: StateNode;
  addStateNode(node: StateNode): void;
  getStateNode(id: NodeIdentifier): StateNode;
}

export interface IActionFunctionRegistry {
  /**
   *
   * @param name
   * @param func Function that get called with the doArguments or undoArguments
   *
   */
  register(name: string, func: ActionFunction, thisArg?: any): void;
  getFunctionByName(name: string): ActionFunctionWithThis;
}

export interface IProvenanceTracker {

  registry: IActionFunctionRegistry;

  /**
   * 1. Calls the action.do function with action.doArguments
   * 2. Append action to graph via a StateEdge and StateNode
   * 3. Makes the created StateNode the current state node
   *
   * @param action
   *
   */
  applyAction(action: Action): Promise<StateNode>;
}

export interface IProvenanceGraphTraverser {
  /**
   * Finds shortest path between current node and node with request identifer.
   * Calls the do/undo functions of actions on the path.
   *
   * @param id
   */
  toStateNode(id: NodeIdentifier): Promise<StateNode>;
}
