import {
  IProvenanceTracker,
  StateNode,
  IProvenanceGraph,
  IActionFunctionRegistry,
  Action,
  ActionFunction,
  IScreenShotProvider
} from '../src/api';
import { ProvenanceGraph } from '../src/ProvenanceGraph';
import { ActionFunctionRegistry } from '../src/ActionFunctionRegistry';
import { ProvenanceTracker } from '../src/ProvenanceTracker';
import { dataURLSample } from './helpers';

class Calculator {
  offset = 42;

  add(y: number) {
    this.offset = this.offset + y;
    return Promise.resolve();
  }

  subtract(y: number) {
    this.offset = this.offset - y;
    return Promise.resolve();
  }
}

describe('ProvenanceTracker', () => {
  let graph: ProvenanceGraph;
  let tracker: ProvenanceTracker;
  let registry: ActionFunctionRegistry;
  const username = 'me';

  describe('class-based', () => {
    let calculator: Calculator;

    beforeEach(() => {
      calculator = new Calculator();
      graph = new ProvenanceGraph({ name: 'calculator', version: '1.0.0' }, username);
      registry = new ActionFunctionRegistry();
      registry.register('add', calculator.add, calculator);
      registry.register('subtract', calculator.subtract, calculator);
      tracker = new ProvenanceTracker(registry, graph, username);
    });

    describe('add 13', () => {
      let prom1: Promise<StateNode>;
      let action1: Action;

      beforeEach(() => {
        action1 = {
          do: 'add',
          doArguments: [13],
          undo: 'subtract',
          undoArguments: [13],
          metadata: {
            userIntent: 'Because I want to',
            label: 'metadataLabel'
          }
        };
        prom1 = tracker.applyAction(action1);
        return prom1;
      });

      test('should have offset equal to 55', () => {
        return prom1.then(() => {
          expect(calculator.offset).toEqual(55);
        });
      });

      test('should resolve promise with a state node', () => {
        return prom1.then(node => {
          const expected: StateNode = {
            id: expect.any(String),
            label: 'metadataLabel',
            metadata: {
              createdBy: username,
              createdOn: expect.any(Number)
            },
            action: action1,
            actionResult: undefined,
            artifacts: {},
            children: [],
            parent: expect.any(Object)
          };
          expect(node).toEqual(expected);
        });
      });

      describe('substract 5', () => {
        let prom2: Promise<StateNode>;
        beforeEach(() => {
          const action2 = {
            do: 'subtract',
            doArguments: [5],
            undo: 'add',
            undoArguments: [5],
            metadata: {
              userIntent: 'Because I want to'
            }
          };
          prom2 = tracker.applyAction(action2);
          return prom2;
        });

        test('should have offset equal to 50', () => {
          return prom1.then(() => {
            expect(calculator.offset).toEqual(50);
          });
        });
      });
    });
  });

  describe('function-based', () => {
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
      graph = new ProvenanceGraph({ name: 'calculator', version: '1.0.0' }, username);
      registry = new ActionFunctionRegistry();
      registry.register('add', add);
      registry.register('subtract', subtract);
      tracker = new ProvenanceTracker(registry, graph, username);
    });

    describe('add 13', () => {
      let prom1: Promise<StateNode>;
      let action1: Action;

      beforeEach(() => {
        action1 = {
          do: 'add',
          doArguments: [13],
          undo: 'subtract',
          undoArguments: [13],
          metadata: {
            userIntent: 'Because I want to'
          }
        };
        prom1 = tracker.applyAction(action1);
        return prom1;
      });

      test('should have offset equal to 55', () => {
        return prom1.then(() => {
          expect(state).toEqual({ offset: 55 });
        });
      });

      test('should resolve promise with a state node', () => {
        return prom1.then(node => {
          const expected: StateNode = {
            id: expect.any(String),
            label: 'add',
            metadata: {
              createdBy: username,
              createdOn: expect.any(Number)
            },
            action: action1,
            actionResult: undefined,
            artifacts: {},
            children: [],
            parent: expect.any(Object)
          };
          expect(node).toEqual(expected);
        });
      });

      describe('subtract 5', () => {
        let prom2: Promise<StateNode>;
        beforeEach(() => {
          const action2 = {
            do: 'subtract',
            doArguments: [5],
            undo: 'add',
            undoArguments: [5],
            metadata: {
              userIntent: 'Because I want to'
            }
          };
          prom2 = tracker.applyAction(action2);
          return prom2;
        });

        test('should have offset equal to 50', () => {
          return prom1.then(() => {
            expect(state).toEqual({ offset: 50 });
          });
        });
      });
    });
  });

  describe('skipFirstDoAction', () => {
    let functionToCall: any;
    let functionToSkip: any;
    beforeEach(async () => {
      functionToCall = jest.fn() as ActionFunction;
      functionToSkip = jest.fn() as ActionFunction;
      graph = new ProvenanceGraph({ name: 'calculator', version: '1.0.0' }, username);
      registry = new ActionFunctionRegistry();
      registry.register('caller', functionToCall);
      registry.register('skipper', functionToSkip);
      tracker = new ProvenanceTracker(registry, graph, username);
      const skipperAction = {
        do: 'skipper',
        doArguments: [],
        undo: 'skipper',
        undoArguments: []
      };
      const callerAction = {
        do: 'caller',
        doArguments: [],
        undo: 'caller',
        undoArguments: []
      };
      await tracker.applyAction(skipperAction, true);
      await tracker.applyAction(callerAction, false);
    });
    test('callerAction', () => {
      expect(functionToCall).toHaveBeenCalled();
      expect(functionToSkip).not.toHaveBeenCalled();
    });
  });

  describe('screenshots', () => {
    let calculator: Calculator;
    const action = {
      do: 'add',
      doArguments: [13],
      undo: 'subtract',
      undoArguments: [13],
      metadata: {
        userIntent: 'Because I want to',
        label: 'metadataLabel'
      }
    };
    const originalWarn = console.warn;
    beforeEach(() => {
      console.warn = jest.fn();
      calculator = new Calculator();
      graph = new ProvenanceGraph({ name: 'calculator', version: '1.0.0' }, username);
      registry = new ActionFunctionRegistry();
      registry.register('add', calculator.add, calculator);
      registry.register('subtract', calculator.subtract, calculator);
      tracker = new ProvenanceTracker(registry, graph, username);
    });
    afterEach(() => {
      console.warn = originalWarn;
    });
    test('auto screenshot works', async () => {
      tracker.screenShotProvider = () => dataURLSample;
      tracker.autoScreenShot = true;
      const node = await tracker.applyAction(action);
      expect(node.metadata.screenShot).toBe(dataURLSample);
    });
    test('auto screenshot false gives undefined screenshot', async () => {
      tracker.screenShotProvider = () => dataURLSample;
      tracker.autoScreenShot = false;
      const node = await tracker.applyAction(action);
      expect(node.metadata.screenShot).toBeUndefined();
    });
    test('auto screenshot without provider warns', async () => {
      tracker.autoScreenShot = true;
      expect(console.warn).toHaveBeenCalled();
      const node = await tracker.applyAction(action);
      expect(node.metadata.screenShot).toBeUndefined();
    });
    test('broken screenShotProvider warns', async () => {
      tracker.screenShotProvider = () => {
        throw new Error('some error');
      };
      tracker.autoScreenShot = true;
      const node = await tracker.applyAction(action);
      expect(node.metadata.screenShot).toBeUndefined();
      expect(console.warn).toHaveBeenCalled();
    });
  });
});
