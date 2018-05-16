declare module "API" {
    export type FunctionName = string;
    export type Artifacts = { [key: string]: any };
    export type NodeIdentifier = Number;
    export type Action = IrreversibleAction | ReversableAction;

    export interface StateNode {
        id: NodeIdentifier;
        parent: StateEdge;
        children: StateEdge[];
        artifacts: Artifacts;
    }

    export interface StateEdge {
        previous: StateNode;
        next: StateNode;
        action: Action;
    }

    type Metadata = {
        createdBy: string;
        createdOn: string;
        tags: string[];
        userIntent: string;
        [key: string]: any;
    };

    export interface IrreversibleAction {
        metadata: Metadata;
        do: FunctionName;
        doArguments: any[];  // should be immutable
    }

    export interface ReversableAction {
        metadata: Metadata;
        do: FunctionName;
        doArguments: any[];  // should be immutable
        undo: FunctionName;
        undoArguments: any[]; // should be immutable
    }


    export interface ProvenanceGraph {
        version: string;
        addEdge(edge: StateEdge): void;
        getStateNode(id: NodeIdentifier): StateNode;
    }

    export interface ProvenanceGraphTracker {
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
}