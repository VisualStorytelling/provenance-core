export type NodeIdentifier = string;
export type Action = IrreversibleAction | ReversibleAction;

export type ActionMetadata = {
  tags?: string[];
  userIntent?: string;
  [key: string]: any;
};

export type NodeMetadata = {
  createdBy: string;
  createdOn: number;
  [key: string]: any;
};

export type Artifacts = {
  [key: string]: any;
};

export type Node = {
  id: NodeIdentifier;
  label: string;
  metadata: NodeMetadata;
  children: StateNode[];
  artifacts: Artifacts;
};

export type RootNode = Node;

export type StateNode = Node & {
  action: Action;
  actionResult: any;
  parent: Node;
};

export type IrreversibleAction = {
  metadata?: ActionMetadata;
  do: string;
  doArguments: any[]; // should be immutable
};

export type ReversibleAction = {
  metadata?: ActionMetadata;
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
  current: Node;
  addNode(node: Node): void;
  getNode(id: NodeIdentifier): Node;
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
  toStateNode(id: NodeIdentifier): Promise<Node>;
}
