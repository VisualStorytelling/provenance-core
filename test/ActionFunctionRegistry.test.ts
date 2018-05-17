import { IActionFunctionRegistry, ProvenanceEnabledFunction } from '../src/api';
import { ActionFunctionRegistry } from '../src/ActionFunctionRegistry';

describe('ActionFunctionRegistry', () => {
  let registry: IActionFunctionRegistry;

  beforeEach(() => {
    registry = new ActionFunctionRegistry();
  });

  describe('get unknown function', () => {
    test('should throw error', () => {
      expect(() => registry.getFunctionByName('nonexisting')).toThrow(
        'Function not found in registry'
      );
    });
  });

  describe('register a function', () => {
    let someFunction: ProvenanceEnabledFunction;
    beforeEach(() => {
      someFunction = jest.fn() as ProvenanceEnabledFunction;
      registry.register('some', someFunction);
    });

    test('should be able to get registered function back', () => {
      const result = registry.getFunctionByName('some');
      expect(result).toBe(someFunction);
    });

    describe('register same function again', () => {
      test('should throw error', () => {
        expect(() => registry.register('some', someFunction)).toThrow(
          'Function already registered'
        );
      });
    });
  });
});
