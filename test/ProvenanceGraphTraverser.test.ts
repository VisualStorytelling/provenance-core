import { ActionFunctionRegistry } from '../src/ActionFunctionRegistry';
import { ProvenanceTracker } from '../src/ProvenanceTracker';
import { ProvenanceGraph } from '../src/ProvenanceGraph';
import { ProvenanceGraphTraverser } from '../src/ProvenanceGraphTraverser';
import { IrreversibleAction, ReversibleAction, StateNode, ProvenanceNode } from '../src/api';
import { isStateNode } from '../src/utils';

const createAddAction = (amount: number): ReversibleAction => ({
  do: 'add',
  doArguments: [amount],
  undo: 'subtract',
  undoArguments: [amount]
});

const createSubtractAction = (amount: number): ReversibleAction => ({
  do: 'subtract',
  doArguments: [amount],
  undo: 'add',
  undoArguments: [amount]
});

const reversibleAdd13Action = createAddAction(13);
const reversibleSub2Action = createSubtractAction(2);
const reversibleSub5Action = createSubtractAction(5);
const irreversibleDivideAction: IrreversibleAction = {
  do: 'divide',
  doArguments: [0]
};

describe('ProvenanceGraphTraverser', () => {
  let graph: ProvenanceGraph;
  let tracker: ProvenanceTracker;
  let registry: ActionFunctionRegistry;
  let traverser: ProvenanceGraphTraverser;
  let root: ProvenanceNode;

  describe('class-based', () => {
    class Calculator {
      offset = 42;

      async add(y: number) {
        this.offset = this.offset + y;
      }

      async subtract(y: number) {
        this.offset = this.offset - y;
      }

      async divide(y: number) {
        this.offset = this.offset / y;
      }
    }

    let calculator: Calculator;

    beforeEach(() => {
      calculator = new Calculator();
      graph = new ProvenanceGraph({ name: 'calculator', version: '1.0.0' });
      registry = new ActionFunctionRegistry();
      registry.register('add', calculator.add, calculator);
      registry.register('subtract', calculator.subtract, calculator);
      registry.register('divide', calculator.divide, calculator);
      tracker = new ProvenanceTracker(registry, graph);
      traverser = new ProvenanceGraphTraverser(registry, graph);
      root = graph.current;
    });

    describe('One action undo', () => {
      beforeEach(async () => {
        await tracker.applyAction(reversibleAdd13Action);
        if (isStateNode(graph.current)) {
          await traverser.toStateNode(graph.current.parent.id);
        }
      });

      test('Traverse to parent node (undo one step)', () => {
        expect(calculator.offset).toEqual(42);
      });
    });
  });

  describe('function-based', () => {
    const state = {
      offset: 0
    };

    async function add(y: number) {
      state.offset = state.offset + y;
    }

    async function subtract(y: number) {
      state.offset = state.offset - y;
    }

    async function divide(y: number) {
      state.offset = state.offset / y;
    }

    beforeEach(() => {
      state.offset = 42;
      graph = new ProvenanceGraph({ name: 'calculator', version: '1.0.0' });
      registry = new ActionFunctionRegistry();
      registry.register('add', add);
      registry.register('subtract', subtract);
      registry.register('divide', divide);
      tracker = new ProvenanceTracker(registry, graph);
      traverser = new ProvenanceGraphTraverser(registry, graph);
      root = graph.current;
    });

    test('should reject promise with not found', () => {
      const dummyNodeId = '11111111-1111-4111-1111-111111111111';
      const result = traverser.toStateNode(dummyNodeId);
      return expect(result).rejects.toThrow('Node id not found');
    });

    test('should traverse to the same node without changes', async () => {
      const result = await traverser.toStateNode(graph.current.id);
      expect(result).toEqual(graph.current);
    });

    describe('One action undo', () => {
      beforeEach(async () => {
        await tracker.applyAction(reversibleAdd13Action);
        if (isStateNode(graph.current)) {
          await traverser.toStateNode(graph.current.parent.id);
        }
      });

      test('Traverse to parent node (undo one step)', () => {
        expect(state).toEqual({ offset: 42 });
      });
    });

    describe('One child re-do', () => {
      let intermediateNode: ProvenanceNode;
      beforeEach(async () => {
        await tracker.applyAction(reversibleAdd13Action);
        intermediateNode = graph.current;
        await traverser.toStateNode(root.id);
        await traverser.toStateNode(intermediateNode.id);
      });

      test('Traverse to child', () => {
        expect(state).toEqual({ offset: 55 });
      });
    });

    describe('Sequential traverse to child 2 deep', () => {
      let intermediateNode: ProvenanceNode;
      beforeEach(async () => {
        await tracker.applyAction(reversibleAdd13Action);
        await tracker.applyAction(reversibleSub2Action);
        intermediateNode = graph.current;
        await traverser.toStateNode(root.id);
        await traverser.toStateNode(intermediateNode.id);
      });

      test('Traverse to child 2 deep', () => {
        expect(state).toEqual({ offset: 53 });
      });
    });

    describe('Two children traverse', () => {
      let intermediateNode: ProvenanceNode;
      beforeEach(async () => {
        await tracker.applyAction(reversibleAdd13Action);
        intermediateNode = graph.current;
        await traverser.toStateNode(root.id);
        await tracker.applyAction(reversibleSub2Action);
        await traverser.toStateNode(intermediateNode.id);
      });

      test('Traverse to sibling', () => {
        expect(state).toEqual({ offset: 55 });
      });
      test('Tree makes sense', () => {
        expect(graph.root.children.length).toEqual(2);
        expect(intermediateNode.children.length).toEqual(0);
      });
    });

    describe('Sequential traverse to parent 2 high', () => {
      let intermediateNode: ProvenanceNode;
      beforeEach(async () => {
        await tracker.applyAction(reversibleAdd13Action);
        intermediateNode = graph.current;
        await tracker.applyAction(reversibleAdd13Action);
      });

      test('Traverse to root node (undo two steps)', async () => {
        await traverser.toStateNode(intermediateNode.id);
        expect(state).toEqual({ offset: 55 });
      });

      test('Traverse to root node (undo two steps at once)', async () => {
        await traverser.toStateNode(root.id);
        expect(state).toEqual({ offset: 42 });
      });
    });

    describe('Single irreversible do', () => {
      beforeEach(async () => {
        await tracker.applyAction(irreversibleDivideAction);
      });

      test('Traverse to sibling', () => {
        return expect(state.offset).toEqual(Infinity);
      });
    });

    describe('Single irreversible undo', () => {
      beforeEach(async () => {
        await tracker.applyAction(irreversibleDivideAction);
      });

      test('Traverse to sibling', done => {
        const cb = (node: ProvenanceNode) => {
          expect(node).toEqual(root);
          done();
        };
        traverser.on('invalidTraversal', cb);

        traverser.toStateNode(root.id);

        traverser.off('invalidTraversal', cb);
      });
    });
  });
});

describe('noTrackingWhenTraversing', () => {
  /**
   * test prevention of feedback loops (triggering action trigger event listener) using
   * noTrackingWhenTraversing setting
   */
  let graph: ProvenanceGraph;
  let tracker: ProvenanceTracker;
  let registry: ActionFunctionRegistry;
  let traverser: ProvenanceGraphTraverser;
  let root: ProvenanceNode;
  let onDoAction: any;
  let doAction: any;

  beforeEach(() => {
    graph = new ProvenanceGraph({ name: 'noTrackingWhenTraversingTest', version: '1.0.0' });
    registry = new ActionFunctionRegistry();
    tracker = new ProvenanceTracker(registry, graph);
    traverser = new ProvenanceGraphTraverser(registry, graph, tracker);

    onDoAction = (val: any) => {
      tracker.applyAction(
        {
          do: 'doAction',
          doArguments: ['someArgument'],
          undo: 'doAction',
          undoArguments: ['someUndoArgument']
        },
        true
      );
    };
    doAction = (val: any) => {
      onDoAction(val);
    };

    registry.register('doAction', () => Promise.resolve(doAction()));

    root = graph.current;
  });

  test('creating action and traversing back with trackingWhenTraversing adds a node', async () => {
    traverser.trackingWhenTraversing = true;
    await doAction();
    expect(Object.keys(graph.nodes).length).toBe(2);
    await traverser.toStateNode(root.id);
    expect(Object.keys(graph.nodes).length).toBe(3);
  });

  test('disabling trackingWhenTraversing should not add node when traversing', async () => {
    traverser.trackingWhenTraversing = false;
    await doAction();
    expect(Object.keys(graph.nodes).length).toBe(2);
    await traverser.toStateNode(root.id);
    expect(Object.keys(graph.nodes).length).toBe(2);
  });
});
