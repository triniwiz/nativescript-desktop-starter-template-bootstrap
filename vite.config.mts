import { defineConfig, mergeConfig } from 'vite';
import { vueConfig } from '@nativescript/vite/vue';
import { masonkitSingleInstance } from './masonkit-hmr.mjs';
import { bootstrapCompat } from './postcss-bootstrap-compat.mjs';

export default defineConfig(({ mode }) =>
  mergeConfig(vueConfig({ mode }), {
    plugins: [masonkitSingleInstance()],
    optimizeDeps: {
      // MasonKit must load as a single instance over the HMR server. If Vite
      // pre-bundles a subpath (e.g. `/vue`), that copy is routed to the vendor
      // bundle, where MasonKit is deliberately absent, and its exports come
      // back undefined ("installMasonKit is not a function").
      exclude: [
        '@triniwiz/nativescript-masonkit',
        '@triniwiz/nativescript-masonkit/vue',
        '@triniwiz/nativescript-masonkit/web',
        '@triniwiz/nativescript-masonkit/elements',
      ],
    },
    css: {
      postcss: {
        // Bootstrap's compiled CSS goes in unmodified; this bridges the few
        // constructs NativeScript can't read yet. Switch a transform off
        // (e.g. `bootstrapCompat({ colors: false })`) to see what it covers.
        plugins: [bootstrapCompat()],
      },
    },
  }),
);
