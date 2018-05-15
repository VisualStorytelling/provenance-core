type FunctionName = string;

type Artifacts = { [key: string]: any };

type NodeIdentifier = Number;

interface StateNode {
    id: NodeIdentifier;
    parent: StateEdge;
    children: StateEdge[];
    artifacts: Artifacts;
}

interface StateEdge {
    previous: StateNode;
    next: StateNode;
    action: IrreversibleAction;
}

type Metadata = {
    createdBy: string;
    createdOn: string;
    tags: string[];
    userIntent: string;
    [key: string]: any;
};

interface IrreversibleAction {
    metadata: Metadata;
    do: FunctionName;
    doArguments: any[];  // should be immutable
}

interface ReversableAction {
    metadata: Metadata;
    do: FunctionName;
    doArguments: any[];  // should be immutable
    undo: FunctionName;
    undoArguments: any[]; // should be immutable
}

type Action = IrreversibleAction | ReversableAction;

interface ProvenanceGraph {
    version: string;
    addEdge(edge: StateEdge);
    getStateNode(id: NodeIdentifier): StateNode;
}

interface ProvenanceGraphTracker {
    current: StateNode;

    registerFunction(name: FunctionName, func: Function): void;

    /**
     * Calls the action.do function with action.doArguments
     *
     * @param action
     *
     */
    applyActionToCurrentStateNode(action: Action): Promise<StateNode>;
    /**
     * Finds shortest path between current node and node with request identifer.
     * Calls the do/undo functions of actions on the path.
     *
     * @param id
     */
    traverseToStateNode(id: NodeIdentifier): StateNode;
}
