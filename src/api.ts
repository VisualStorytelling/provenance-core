type FunctionName = string

interface Artifacts {
  [key: string]: any
}

type NodeIdentifier = Number

interface RootNode {
  id: NodeIdentifier
  children: StateEdge[]
  artifacts: Artifacts
}

interface StateNode extends RootNode {
  parent: StateEdge
}

interface StateEdge {
  previous: StateNode
  next: StateNode
  action: Action
}

interface Metadata {
  createdBy?: string
  createdOn: string
  tags: string[]
  userIntent?: string
  [key: string]: any
}

interface IrreversibleAction {
  metadata: Metadata
  do: FunctionName
  doArguments: any[] // should be immutable
}

interface ReversableAction {
  metadata: Metadata
  do: FunctionName
  doArguments: any[] // should be immutable
  undo: FunctionName
  undoArguments: any[] // should be immutable
}

type Action = IrreversibleAction | ReversableAction

interface ProvenanceGraph {
  version: string
  addEdge(edge: StateEdge)
  getStateNode(id: NodeIdentifier): StateNode
}

interface ProvenanceGraphTracker {
  current: StateNode

  /**
     * 
     * @param name 
     * @param func Function that get called with the doArguments or undoArguments
     *
     */
  registerFunction(name: FunctionName, func: (...any) => Promise<any>): void

  /**
     * Calls the action.do function with action.doArguments
     *
     * @param action
     *
     */
  applyActionToCurrentStateNode(action: Action): Promise<StateNode>

  /**
     * Finds shortest path between current node and node with request identifer.
     * Calls the do/undo functions of actions on the path.
     *
     * @param id
     */
  traverseToStateNode(id: NodeIdentifier): Promise<StateNode>
}
