import { IActionFunctionRegistry, ProvenanceEnabledFunction } from './api';

export class ActionFunctionRegistry implements IActionFunctionRegistry {
  private functionRegistry: { [key: string]: ProvenanceEnabledFunction } = {};

  /**
   * Register a new function into the provenance tracker (to be able to call it later)
   *
   * @param name The name of the new function to register
   * @param func The ProvenanceEnabledFunction to register
   *
   */
  register(name: string, func: ProvenanceEnabledFunction) {
    if (this.functionRegistry[name]) {
      throw new Error('Function already registered');
    }
    this.functionRegistry[name] = func;
  }

  getFunctionByName(name: string) {
    if (!this.functionRegistry[name]) {
      throw new Error('Function not found in registry');
    }
    return this.functionRegistry[name];
  }
}
