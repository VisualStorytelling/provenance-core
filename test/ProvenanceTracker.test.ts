import {
  IProvenanceTracker,
  StateNode,
  IProvenanceGraph,
  IActionFunctionRegistry
} from '../src/api';
import { ProvenanceGraph } from '../src/ProvenanceGraph';
import { ActionFunctionRegistry } from '../src/ActionFunctionRegistry';
import { ProvenanceTracker } from '../src/ProvenanceTracker';

describe('ProvenanceGraphTracker', () => {
  let graph: ProvenanceGraph;
  let tracker: ProvenanceTracker;
  let registry: ActionFunctionRegistry;
  const state = {
    offset: 0
  };

  function add(y: number) {
    state.offset = state.offset + y;
    return Promise.resolve();
  }

  function subtract(y: number) {
    state.offset = state.offset - y;
    return Promise.resolve();
  }

  beforeEach(() => {
    state.offset = 42;
    graph = new ProvenanceGraph({ name: 'calculator', version: '1.0.0' });
    registry = new ActionFunctionRegistry();
    registry.register('add', add);
    registry.register('subtract', subtract);
    tracker = new ProvenanceTracker(registry, graph);
  });

  describe('add 13', () => {
    let prom1: Promise<StateNode>;

    beforeEach(() => {
      const action1 = {
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
      prom1 = tracker.applyAction(action1);
      return prom1;
    });

    test('should have offset equal to 55', () => {
      prom1.then(() => {
        expect(state).toEqual({ offset: 55 });
      });
    });

    describe('Subtract 5', () => {
      let prom2: Promise<StateNode>;
      beforeEach(() => {
        const action2 = {
          do: 'subtract',
          doArguments: [5],
          undo: 'add',
          undoArguments: [5],
          metadata: {
            createdBy: 'me',
            createdOn: 'later',
            tags: [],
            userIntent: 'Because I want to'
          }
        };
        prom2 = tracker.applyAction(action2);
        return prom2;
      });

      test('should have offset equal to 50', () => {
        prom1.then(() => {
          expect(state).toEqual({ offset: 50 });
        });
      });
    });
  });
});
