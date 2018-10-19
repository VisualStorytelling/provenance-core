import {
  IActionFunctionRegistry,
  ActionFunction,
  ActionFunctionWithThis
} from './api';

export class ActionFunctionRegistry implements IActionFunctionRegistry {
  private functionRegistry: { [key: string]: ActionFunctionWithThis } = {};

  /**
   * Register a new function into the provenance tracker (to be able to call it later)
   *
   * @param name The name of the new function to register
   * @param func The ActionFunction to register
   * @param thisArg Value to use as this (i.e the reference Object) when executing callback
   *
   */
  register(name: string, func: ActionFunction, thisArg: any = null): void {
    if (this.functionRegistry[name]) {
      throw new Error('Function already registered');
    }
    this.functionRegistry[name] = { func, thisArg };
  }

  getFunctionByName(name: string): ActionFunctionWithThis {
    if (!this.functionRegistry[name]) {
      throw new Error('Function \'' + name + '\' not found in registry');
    }
    return this.functionRegistry[name];
  }
}
