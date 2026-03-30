// Type declaration for tinykeys.
// The package's exports field lacks a "types" condition, so TypeScript's
// bundler moduleResolution can't find the types automatically. This file
// provides them so we can import from 'tinykeys' without a @ts-ignore.
declare module 'tinykeys' {
  export interface KeyBindingMap {
    [keybinding: string]: (event: KeyboardEvent) => void;
  }
  export interface KeyBindingHandlerOptions {
    timeout?: number;
  }
  export function tinykeys(
    element: Window | HTMLElement,
    keyBindingMap: KeyBindingMap,
    options?: KeyBindingHandlerOptions
  ): () => void;
}
