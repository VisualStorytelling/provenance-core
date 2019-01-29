import { Handler } from './api';

/** Mitt: Tiny (~200b) functional event emitter / pubsub.
 *  @name mitt
 *  @returns {Mitt}
 */

export default function mitt(all?: any) {
  all = all || Object.create(null);

  return {
    /**
     * Register an event handler for the given type.
     *
     * @param  {String} type	Type of event to listen for
     * @param  {Function} handler Function to call in response to given event
     * @memberOf mitt
     */
    on(type: string, handler: Handler) {
      (all[type] || (all[type] = [])).push(handler);
    },

    /**
     * Remove an event handler for the given type.
     *
     * @param  {String} type	Type of event to unregister `handler` from
     * @param  {Function} handler Handler function to remove
     * @memberOf mitt
     */
    off(type: string, handler: Handler) {
      if (all[type]) {
        // tslint:disable-next-line:no-bitwise
        all[type].splice(all[type].indexOf(handler) >>> 0, 1);
      }
    },

    /**
     * Invoke all handlers for the given type.
     *
     * @param {String} type  The event type to invoke
     * @param {Any} [evt]  Any value (object is recommended and powerful), passed to each handler
     * @memberOf mitt
     */
    emit(type: string, evt: any) {
      (all[type] || []).slice().map((handler: Handler) => {
        handler(evt);
      });
    }
  };
}
