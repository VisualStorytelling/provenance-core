import { IActionFunctionRegistry, ActionFunction, ActionFunctionWithThis } from '../src/api';
import { ActionFunctionRegistry } from '../src/ActionFunctionRegistry';

describe('ActionFunctionRegistry', () => {
  let registry: IActionFunctionRegistry;

  beforeEach(() => {
    registry = new ActionFunctionRegistry();
  });

  describe('get unknown function', () => {
    test('should throw error', () => {
      expect(() => registry.getFunctionByName('nonexisting')).toThrow(
        // tslint:disable-next-line:quotemark as prettier changes it back to double quotes
        "Function 'nonexisting' not found in registry"
      );
    });
  });

  describe('register a function', () => {
    let someFunction: ActionFunction;
    beforeEach(() => {
      someFunction = jest.fn() as ActionFunction;
      registry.register('some', someFunction);
    });

    test('should be able to get registered function back', () => {
      const result: ActionFunctionWithThis = registry.getFunctionByName('some');
      expect(result.func).toBe(someFunction);
      expect(result.thisArg).toBe(null);
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
