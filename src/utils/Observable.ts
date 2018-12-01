export class Observable {
  handlers: { [s: string]: Array<(target: Observable) => void> };

  emit(event: string) {
    if (!this.handlers[event]) return;
    this.handlers[event].forEach(handler => handler(this));
  }

  on(events: string, handler: (e: any) => void): void {
    events.split(' ').forEach(event => {
      if (!this.handlers[event]) this.handlers[event] = [];
      this.handlers[event].push(handler);
    });
  }
}

export function applyMixins(derivedCtor: any, baseCtors: any[]) {
  baseCtors.forEach(baseCtor => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
      derivedCtor.prototype[name] = baseCtor.prototype[name];
    });
  });
}
