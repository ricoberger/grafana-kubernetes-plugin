// Jest setup provided by Grafana scaffolding
import './.config/jest-setup';
import { MessageChannel as NodeMessageChannel } from 'worker_threads';

// The scaffolded setup polyfills MessageChannel with worker_threads for React 19's
// scheduler. Those ports keep the Node.js event loop alive, so Jest never exits.
// Unref the ports after a message handler is attached to allow Jest to exit.
class UnrefMessageChannel extends NodeMessageChannel {
  constructor() {
    super();
    for (const port of [this.port1, this.port2]) {
      const descriptor = Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(port),
        'onmessage',
      );
      Object.defineProperty(port, 'onmessage', {
        configurable: true,
        get: () => descriptor.get.call(port),
        set: (handler) => {
          descriptor.set.call(port, handler);
          port.unref();
        },
      });
    }
  }
}

Object.assign(global, { MessageChannel: UnrefMessageChannel });
