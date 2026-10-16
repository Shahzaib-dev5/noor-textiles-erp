import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterEach } from 'vitest';

// jsdom lacks native dialogs and layout observers; real focus/viewport behavior is browser-tested.
HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
HTMLElement.prototype.scrollIntoView = function () {};
class LayoutObserver implements ResizeObserver {
  constructor(private callback: ResizeObserverCallback) {}
  observe(target: Element) { this.callback([{ target, contentRect: new DOMRect(0, 0, 640, 250), borderBoxSize: [], contentBoxSize: [], devicePixelContentBoxSize: [] }], this); }
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = LayoutObserver;
configure({ asyncUtilTimeout: 15000 });

afterEach(() => cleanup());
