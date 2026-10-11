<script lang="ts" setup>
import { ref, computed } from 'nativescript-vue';
import { Device, Screen } from '@nativescript/core';
import { currentScreen } from '../navigation';

const taps = ref(0);
const tapLabel = computed(() =>
  taps.value === 0 ? 'Tap me' : `Tapped ${taps.value}×`,
);

const platform = Device.os;
const screen = `${Math.round(Screen.mainScreen.widthDIPs)} × ${Math.round(
  Screen.mainScreen.heightDIPs,
)} dp`;

const stats = [
  { label: 'Running on', value: platform },
  { label: 'Layout engine', value: 'Taffy' },
  { label: 'Styling', value: 'Bootstrap 6' },
];

const features = [
  {
    icon: '▦',
    title: 'Bootstrap grid',
    body: 'Rows, columns and gutters, with md: and lg: breakpoints that reflow as the window grows.',
    theme: 'theme-primary',
  },
  {
    icon: '⇆',
    title: 'Flex utilities',
    body: 'd-flex, gap-*, justify-content-* and friends behave exactly like the web.',
    theme: 'theme-accent',
  },
  {
    icon: '</>',
    title: 'Semantic elements',
    body: 'Write <section>, <h1>, <p> and <button>. They render as native views.',
    theme: 'theme-info',
  },
  {
    icon: '◐',
    title: 'Light and dark',
    body: "Bootstrap's light-dark() colours follow the system theme, or data-bs-theme.",
    theme: 'theme-secondary',
  },
  {
    icon: '⚡',
    title: 'Rust core',
    body: 'Layout is computed natively by MasonKit, not in JavaScript.',
    theme: 'theme-warning',
  },
  {
    icon: '◎',
    title: 'One codebase',
    body: 'The same components run on iOS, Android and Windows.',
    theme: 'theme-success',
  },
];

const steps = [
  { text: 'Edit this screen in', file: 'src/components/Home.vue' },
  { text: 'Add global styles in', file: 'src/app.css' },
  { text: 'See what Bootstrap needs adapted in', file: 'postcss-bootstrap-compat.mjs' },
];
</script>

<template>
  <main class="container d-flex flex-column gap-8 py-6">
    <!-- Hero -->
    <section class="bg-hero d-flex flex-column gap-3 rounded-9 p-8">
      <span class="badge theme-inverse align-self-start">
        NativeScript × MasonKit × Bootstrap
      </span>
      <h1 class="fs-5xl fw-bold fg-white mb-0">
        Native apps, styled with Bootstrap.
      </h1>
      <p class="fs-lg fg-white opacity-75 mb-0">
        Bootstrap 6's own stylesheet, laid out by a Rust engine on iOS,
        Android and Windows.
      </p>
      <div class="d-flex flex-row flex-wrap gap-3 pt-2">
        <button
          class="btn btn-solid theme-inverse btn-lg"
          @tap="currentScreen = 'playground'"
        >
          Open the playground →
        </button>
        <button class="btn btn-subtle theme-inverse btn-lg" @tap="taps++">
          {{ tapLabel }}
        </button>
      </div>
    </section>

    <!-- Stats: one column on phones, three from the md breakpoint up -->
    <div class="row g-4">
      <div v-for="stat in stats" :key="stat.label" class="col-12 md:col-4">
        <div class="card">
          <div class="card-body">
            <span class="fg-secondary fs-sm">{{ stat.label }}</span>
            <span class="fs-2xl fw-bold">{{ stat.value }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Features: 1, 2 or 3 columns depending on the window width -->
    <section class="d-flex flex-column gap-4">
      <div class="d-flex flex-column gap-1">
        <span class="fs-sm fw-semibold text-uppercase fg-primary">
          What's inside
        </span>
        <h2 class="fs-3xl fw-bold mb-0">Everything you need to start</h2>
      </div>

      <div class="row g-4">
        <div
          v-for="feature in features"
          :key="feature.title"
          class="col-12 md:col-6 lg:col-4"
        >
          <article class="card h-100">
            <div class="card-body">
              <div class="avatar avatar-lg rounded-6" :class="feature.theme">
                <span class="fw-bold">{{ feature.icon }}</span>
              </div>
              <h3 class="card-title fs-lg fw-semibold mb-0">
                {{ feature.title }}
              </h3>
              <p class="card-text fg-secondary mb-0">{{ feature.body }}</p>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- Next steps -->
    <section class="card">
      <div class="card-header fw-semibold">Next steps</div>
      <div class="list-group list-group-flush">
        <div
          v-for="(step, index) in steps"
          :key="step.file"
          class="list-group-item d-flex flex-row align-items-center gap-3"
        >
          <span class="badge theme-primary rounded-pill">{{ index + 1 }}</span>
          <div class="d-flex flex-row flex-wrap align-items-center gap-2 flex-fill">
            <span>{{ step.text }}</span>
            <code>{{ step.file }}</code>
          </div>
        </div>
      </div>
    </section>

    <footer class="d-flex flex-column align-items-center py-2">
      <span class="fs-xs fg-secondary">{{ platform }} · {{ screen }}</span>
    </footer>
  </main>
</template>
