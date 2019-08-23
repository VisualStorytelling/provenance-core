import { ProvenanceNode, StateNode, Action, ReversibleAction } from './api';

export function generateUUID(): string {
  // Public Domain/MIT
  let d = new Date().getTime();

  /* istanbul ignore if */
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    d += performance.now(); // use high-precision timer if available
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    // tslint:disable-next-line:no-bitwise
    const r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    // tslint:disable-next-line:no-bitwise
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/**
 * Generate a Unix timestamp in milliseconds
 *
 * @returns {number} in milliseconds
 */
export function generateTimestamp(): number {
  // Removed, because performance.now() returns a floating point number, which is not compatible with the Date.getTime() integer
  // if (
  //   window.performance &&
  //   window.performance.now &&
  //   window.performance.timing &&
  //   window.performance.timing.navigationStart
  // ) {
  //   return window.performance.now();
  // }
  return new Date().getTime();
}

export function isStateNode(node: ProvenanceNode): node is StateNode {
  return 'parent' in node;
}

export function isReversibleAction(action: Action): action is ReversibleAction {
  return 'undo' in action;
}
