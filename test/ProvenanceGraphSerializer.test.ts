import { ActionFunctionRegistry } from '../src/ActionFunctionRegistry';
import { ProvenanceTracker } from '../src/ProvenanceTracker';
import {
  ProvenanceGraph,
  restoreProvenanceGraph,
  serializeProvenanceGraph
} from '../src/ProvenanceGraph';
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

describe('ProvenanceGraphSerializer', () => {
  let graph: ProvenanceGraph;
  let tracker: ProvenanceTracker;
  let registry: ActionFunctionRegistry;
  let traverser: ProvenanceGraphTraverser;
  let root: ProvenanceNode;

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

  describe('Provenancegraph with three actions', () => {
    beforeEach(async () => {
      await tracker.applyAction(reversibleAdd13Action);
      await traverser.toStateNode(root.id);
      await tracker.applyAction(reversibleSub2Action);
      await tracker.applyAction(reversibleSub2Action);
    });

    it('can be serializabled without throwing', () => {
      const serializedGraph = serializeProvenanceGraph(graph);
      expect(typeof JSON.stringify(serializedGraph)).toEqual('string');
    });
    test('Can be restored', () => {
      const restoredGraph = restoreProvenanceGraph(serializeProvenanceGraph(graph));
      expect(serializeProvenanceGraph(restoredGraph)).toEqual(serializeProvenanceGraph(graph));
    });
  });
});
