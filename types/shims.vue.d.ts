declare module '*.vue' {
  import type { DefineComponent } from 'nativescript-vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

// Vite's SVG asset imports, used for the Bootstrap Icons image URLs.
declare module '*.svg' {
  const url: string;
  export default url;
}
