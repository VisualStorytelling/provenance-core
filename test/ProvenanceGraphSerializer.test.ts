import { ActionFunctionRegistry } from '../src/ActionFunctionRegistry';
import { ProvenanceTracker } from '../src/ProvenanceTracker';
import { ProvenanceGraph } from '../src/ProvenanceGraph';
import { ProvenanceGraphTraverser } from '../src/ProvenanceGraphTraverser';
import {
  IrreversibleAction,
  ReversibleAction,
  StateNode,
  ProvenanceNode
} from '../src/api';
import { isStateNode } from '../src/utils';

const createAddAction = (amount: number): ReversibleAction => ({
  do: 'add',
  doArguments: [amount],
  undo: 'subtract',
  undoArguments: [amount],
});

const createSubtractAction = (amount: number): ReversibleAction => ({
  do: 'subtract',
  doArguments: [amount],
  undo: 'add',
  undoArguments: [amount],
});

const reversibleAdd13Action = createAddAction(13);
const reversibleSub2Action = createSubtractAction(2);
const reversibleSub5Action = createSubtractAction(5);
const irreversibleDivideAction: IrreversibleAction = {
  do: 'divide',
  doArguments: [0],
};

describe('ProvenanceGraphSerializer', () => {
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

    describe('Branches at root', () => {
      beforeEach(async () => {
        await tracker.applyAction(reversibleAdd13Action);
        await traverser.toStateNode(root.id);
        await tracker.applyAction(reversibleSub2Action);
      });

      test('Is serializable', () => {
        const simpleObject = graph.serialize();
        expect(typeof simpleObject).toBe('object');
        expect(typeof graph.serialize()).toBe('object');
      });
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

      test('Traverse to sibling', () => {
        const result = traverser.toStateNode(root.id);
        return expect(result).rejects.toThrow(
          'trying to undo an Irreversible action'
        );
      });
    });
  });
});
