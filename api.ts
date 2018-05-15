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
    applyActionToCurrentStateNode(action: Action): Promise<StateNode>;
    registerFunction(name: FunctionName, func: Function): void;
    traverseToStateNode(id: NodeIdentifier): StateNode;
}
