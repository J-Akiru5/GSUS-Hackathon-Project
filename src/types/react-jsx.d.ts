// Minimal JSX namespace to allow TSX files in a JS-first repo
// This suppresses errors when a full TypeScript/react types setup is not present.
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

export {};
