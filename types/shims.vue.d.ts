declare module '*.vue' {
  import type { DefineComponent } from 'nativescript-vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

// Vite's `?raw` imports, used for the Bootstrap Icons SVG sources.
declare module '*.svg?raw' {
  const source: string;
  export default source;
}
