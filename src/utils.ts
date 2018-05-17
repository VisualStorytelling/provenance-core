import { Node, StateNode, Action, ReversibleAction } from './api';

export function generateUUID() {
  // Public Domain/MIT
  let d = new Date().getTime();
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    d += performance.now(); // use high-precision timer if available
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    let r = ((d + Math.random() * 16) % 16) | 0;
    d = Math.floor(d / 16);
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function isStateNode(node: Node): node is StateNode {
  return 'parent' in node;
}

export function isReversibleAction(action: Action): action is ReversibleAction {
  return 'undo' in action;
}
