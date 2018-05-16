import { ActionFunctionRegistry } from '../src/ActionFunctionRegistry';
import { ProvenanceTracker } from '../src/ProvenanceTracker';
import { ProvenanceGraph } from '../src/ProvenanceGraph';
import { ProvenanceGraphTraverser } from '../src/ProvenanceGraphTraverser';
import { ReversibleAction } from '../src/api';

describe('ProvenanceGraphTraverser', () => {
  let graph: ProvenanceGraph;
  let tracker: ProvenanceTracker;
  let registry: ActionFunctionRegistry;
  let traverser: ProvenanceGraphTraverser;
  const state = {
    offset: 0
  };

  function add(y: number) {
    state.offset = state.offset + y;
    return Promise.resolve();
  }

  function substract(y: number) {
    state.offset = state.offset - y;
    return Promise.resolve();
  }

  beforeEach(() => {
    state.offset = 42;
    graph = new ProvenanceGraph({ name: 'calculator', version: '1.0.0' });
    registry = new ActionFunctionRegistry();
    registry.register('add', add);
    registry.register('substract', substract);
    tracker = new ProvenanceTracker(registry, graph);
    traverser = new ProvenanceGraphTraverser(registry, graph);

    const action: ReversibleAction = {
      do: 'add',
      doArguments: [13],
      undo: 'substract',
      undoArguments: [13],
      metadata: {
        createdBy: 'me',
        createdOn: 'now',
        tags: [],
        userIntent: 'Because I want to'
      }
    };
    tracker.applyAction(action);
  });

  test('should reject promise with not found', () => {
    const dummyNodeId = '11111111-1111-4111-1111-111111111111';
    const result = traverser.toStateNode(dummyNodeId);
    return expect(result).rejects.toThrow('Node id not found');
  });

  test('Traverse to the same node', () => {
    const result = traverser.toStateNode(graph.current.id);
    return expect(result).resolves.toEqual(graph.current);
  });

  test('Traverse to parent node (undo one step)', () => {
    expect(state).toEqual({ offset: 55 });
    traverser.toStateNode(graph.current.parent.previous.id);
    expect(state).toEqual({ offset: 42 });
  });
});

//   describe('traverse to current', () => {
//     test.skip('should return current', () => {
//       // TODO implement
//       expect(1).toEqual(2);
//     });
//   });
