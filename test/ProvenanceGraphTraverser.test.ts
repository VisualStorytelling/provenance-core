import {ActionFunctionRegistry} from '../src/ActionFunctionRegistry';
import {ProvenanceTracker} from '../src/ProvenanceTracker';
import {ProvenanceGraph} from '../src/ProvenanceGraph';
import {ProvenanceGraphTraverser} from '../src/ProvenanceGraphTraverser';
import {IrreversibleAction, ReversibleAction, StateNode} from '../src/api';

const reversibleAdd13Action: ReversibleAction = {
  do: 'add',
  doArguments: [13],
  undo: 'subtract',
  undoArguments: [13],
  metadata: {
    createdBy: 'me',
    createdOn: 'now',
    tags: [],
    userIntent: 'Because I want to'
  }
};

const reversibleSub2Action: ReversibleAction = {
  do: 'subtract',
  doArguments: [2],
  undo: 'add',
  undoArguments: [2],
  metadata: {
    createdBy: 'me',
    createdOn: 'now',
    tags: [],
    userIntent: 'Because I want to'
  }
};

const reversibleSub5Action: ReversibleAction = {
  do: 'subtract',
  doArguments: [5],
  undo: 'add',
  undoArguments: [5],
  metadata: {
    createdBy: 'me',
    createdOn: 'now',
    tags: [],
    userIntent: 'Because I want to'
  }
};

const irreversibleSub20Action: IrreversibleAction = {
  do: 'subtract',
  doArguments: [5],
  metadata: {
    createdBy: 'me',
    createdOn: 'now',
    tags: [],
    userIntent: 'Because I want to'
  }
};

describe('ProvenanceGraphTraverser', () => {
  let graph: ProvenanceGraph;
  let tracker: ProvenanceTracker;
  let registry: ActionFunctionRegistry;
  let traverser: ProvenanceGraphTraverser;
  let root: StateNode;

  describe('class-based', () => {
    class Calculator {
      offset = 42;

      async add(y: number) {
        this.offset = this.offset + y;
      }

      async subtract(y: number) {
        this.offset = this.offset - y;
      }
    }

    let calculator: Calculator;

    beforeEach(() => {
      calculator = new Calculator();
      graph = new ProvenanceGraph({name: 'calculator', version: '1.0.0'});
      registry = new ActionFunctionRegistry();
      registry.register('add', calculator.add, calculator);
      registry.register('subtract', calculator.subtract, calculator);
      tracker = new ProvenanceTracker(registry, graph);
      traverser = new ProvenanceGraphTraverser(registry, graph);
      root = graph.current;
    });

    describe('One action undo', () => {
      beforeEach(async () => {
        await tracker.applyAction(reversibleAdd13Action);
        await traverser.toStateNode(graph.current.parent!.previous.id);
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

    beforeEach(() => {
      state.offset = 42;
      graph = new ProvenanceGraph({name: 'calculator', version: '1.0.0'});
      registry = new ActionFunctionRegistry();
      registry.register('add', add);
      registry.register('subtract', subtract);
      tracker = new ProvenanceTracker(registry, graph);
      traverser = new ProvenanceGraphTraverser(registry, graph);
      root = graph.current;
    });

    test('should reject promise with not found', () => {
      const dummyNodeId = '11111111-1111-4111-1111-111111111111';
      const result = traverser.toStateNode(dummyNodeId);
      return expect(result).rejects.toThrow('Node id not found');
    });

    test('Traverse to the same node', async () => {
      const result = await traverser.toStateNode(graph.current.id);
      expect(result).toEqual(graph.current);
    });

    describe('One action undo', () => {
      beforeEach(async () => {
        await tracker.applyAction(reversibleAdd13Action);
        await traverser.toStateNode(graph.current.parent!.previous.id);
      });

      test('Traverse to parent node (undo one step)', () => {
        expect(state).toEqual({offset: 42});
      });
    });

    describe('Two action undo', () => {
      let intermediateNode: StateNode;
      beforeEach(async () => {
        await tracker.applyAction(reversibleAdd13Action);
        intermediateNode = graph.current;
        await tracker.applyAction(reversibleAdd13Action);
      });

      test('Traverse to root node (undo two steps)', async () => {
        await traverser.toStateNode(intermediateNode.id);
        expect(state).toEqual({offset: 55});
      });

      test('Traverse to root node (undo two steps at once)', async () => {
        await traverser.toStateNode(root.id);
        expect(state).toEqual({offset: 42});
      });
    });

    describe('Two children traverse', () => {
      let intermediateNode: StateNode;
      beforeEach(async () => {
        await tracker.applyAction(reversibleAdd13Action);
        intermediateNode = graph.current;
        await traverser.toStateNode(root.id);
        await tracker.applyAction(reversibleSub2Action);
        await traverser.toStateNode(intermediateNode.id);
      });

      test('Traverse to sibling', () => {
        expect(state).toEqual({offset: 55});
      });
    });

    describe('Three children traverse', () => {
      let intermediateNode: StateNode;
      beforeEach(async () => {
        await tracker.applyAction(reversibleAdd13Action);
        intermediateNode = graph.current;
        await traverser.toStateNode(root.id);
        await tracker.applyAction(reversibleSub2Action);
        await traverser.toStateNode(root.id);
        await tracker.applyAction(reversibleSub5Action);
        await traverser.toStateNode(intermediateNode.id);
      });

      test('Traverse to sibling', () => {
        expect(state).toEqual({offset: 55});
      });
    });

    describe('Single irreversible undo', () => {
      beforeEach(async () => {
        await tracker.applyAction(irreversibleSub20Action);
      });

      test('Traverse to sibling', () => {
        const result = traverser.toStateNode(root.id);
        return expect(result).rejects.toThrow('trying to undo an Irreversible action');
      });
    });
  });
});
