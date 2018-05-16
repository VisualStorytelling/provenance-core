
export type FunctionName = string;
export type Artifacts = { [key: string]: any };
export type NodeIdentifier = Number;
export type Action = IIrreversibleAction | IReversableAction;

export type Metadata = {
    createdBy: string;
    createdOn: string;
    tags: string[];
    userIntent: string;
    [key: string]: any;
};

export interface IStateNode {
    id: NodeIdentifier;
    parent: IStateEdge;
    children: IStateEdge[];
    artifacts: Artifacts;
}

export interface IStateEdge {
    previous: IStateNode;
    next: IStateNode;
    action: Action;
}

export interface IIrreversibleAction {
    metadata: Metadata;
    do: FunctionName;
    doArguments: any[];  // should be immutable
}

export interface IReversableAction {
    metadata: Metadata;
    do: FunctionName;
    doArguments: any[];  // should be immutable
    undo: FunctionName;
    undoArguments: any[]; // should be immutable
}


export interface IProvenanceGraph {
    version: string;
    addEdge(edge: IStateEdge): void;
    getStateNode(id: NodeIdentifier): IStateNode;
}

export interface IProvenanceGraphTracker {
    current: IStateNode;

    registerFunction(name: FunctionName, func: Function): void;

    /**
     * Calls the action.do function with action.doArguments
     *
     * @param action
     *
     */
    applyActionToCurrentStateNode(action: Action): Promise<IStateNode>;
    /**
     * Finds shortest path between current node and node with request identifer.
     * Calls the do/undo functions of actions on the path.
     *
     * @param id
     */
    traverseToStateNode(id: NodeIdentifier): IStateNode;

}