import { ActionFunctionRegistry } from '../src/ActionFunctionRegistry';
import { ProvenanceGraphTracker } from '../src/ProvenanceTracker';
import { ProvenanceGraph } from '../src/ProvenanceGraph';
import { ProvenanceGraphTraverser } from '../src/ProvenanceGraphTraverser';

describe('ProvenanceGraphTraverser', () => {
  let graph: ProvenanceGraph;
  let tracker: ProvenanceGraphTracker;
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
    tracker = new ProvenanceGraphTracker(registry, graph);
    traverser = new ProvenanceGraphTraverser(registry, graph);
  });

  test('should reject promise with not found', () => {
    const dummyNodeId = '11111111-1111-4111-1111-111111111111';
    const result = traverser.toStateNode(dummyNodeId);
    return expect(result).rejects.toThrow('Node id not found');
  });

  test('Traverse to the same node', () => {
    const result = traverser.toStateNode(graph.current.id);
    result.then(console.log);
    result.catch(console.log);
    return expect(result).resolves.toEqual(graph.current);
  });
});

//   describe('traverse to current', () => {
//     test.skip('should return current', () => {
//       // TODO implement
//       expect(1).toEqual(2);
//     });
//   });
