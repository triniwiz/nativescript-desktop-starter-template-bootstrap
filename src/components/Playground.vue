<script lang="ts" setup>
import { ref } from 'nativescript-vue';

const justifyOptions = [
  { label: 'Start', value: 'justify-content-start' },
  { label: 'Center', value: 'justify-content-center' },
  { label: 'Between', value: 'justify-content-between' },
  { label: 'End', value: 'justify-content-end' },
];
const justify = ref(justifyOptions[2].value);

const directionOptions = [
  { label: 'Row', value: 'flex-row' },
  { label: 'Column', value: 'flex-column' },
];
const direction = ref(directionOptions[0].value);

const buttonStyles = ['btn-solid', 'btn-outline', 'btn-subtle', 'btn-text'];
const themes = ['primary', 'accent', 'success', 'warning', 'danger'];

// Bootstrap's CSS grid: 12 tracks, `g-col-*` spans, `md:` breakpoints.
const tiles = [
  { title: 'Featured', span: 'g-col-12 md:g-col-8', color: 'bg-primary' },
  { title: 'Inbox', span: 'g-col-6 md:g-col-4', color: 'bg-accent' },
  { title: 'Photos', span: 'g-col-6 md:g-col-4', color: 'bg-info' },
  { title: 'Analytics', span: 'g-col-12 md:g-col-8', color: 'bg-success' },
  { title: 'Music', span: 'g-col-4', color: 'bg-warning' },
  { title: 'Notes', span: 'g-col-4', color: 'bg-danger' },
  { title: 'Maps', span: 'g-col-4', color: 'bg-secondary' },
];

const allTags = [
  'Grid',
  'Flex utilities',
  'Buttons',
  'Cards',
  'Badges',
  'Alerts',
  'Progress',
  'List group',
  'Chips',
  'Forms',
  'Dark mode',
  'Taffy',
];
const tagCount = ref(6);
const selectedTags = ref(new Set(['Grid', 'Dark mode']));
function toggleTag(tag: string) {
  const next = new Set(selectedTags.value);
  next.has(tag) ? next.delete(tag) : next.add(tag);
  selectedTags.value = next;
}

const progress = ref(40);

const themeOptions = [
  { label: 'System', value: undefined },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
];
const pinnedTheme = ref<string | undefined>('dark');

const name = ref('');
</script>

<template>
  <main class="container d-flex flex-column gap-8 py-6">
    <!-- Header -->
    <header class="d-flex flex-column">
      <span class="fs-sm fw-semibold text-uppercase fg-primary">Playground</span>
      <h1 class="fs-3xl fw-bold mb-0">Bootstrap, native</h1>
    </header>

    <!-- Buttons -->
    <section class="card">
      <div class="card-body">
        <h2 class="card-title fs-xl mb-0">Buttons</h2>
        <p class="fg-secondary mb-0">
          Every style × theme combination, straight from Bootstrap's
          <code>.btn</code> classes.
        </p>
        <div
          v-for="style in buttonStyles"
          :key="style"
          class="d-flex flex-row flex-wrap gap-2"
        >
          <button
            v-for="theme in themes"
            :key="theme"
            class="btn btn-sm text-capitalize"
            :class="[style, `theme-${theme}`]"
          >
            {{ theme }}
          </button>
        </div>
      </div>
    </section>

    <!-- Flexbox -->
    <section class="card">
      <div class="card-body">
        <h2 class="card-title fs-xl mb-0">Flex utilities</h2>
        <p class="fg-secondary mb-0">
          Tap an option to swap the classes on the container below.
        </p>

        <div class="d-flex flex-row flex-wrap gap-2">
          <nav class="nav nav-pills">
            <button
              v-for="option in justifyOptions"
              :key="option.value"
              class="nav-link"
              :class="{ active: justify === option.value }"
              @tap="justify = option.value"
            >
              {{ option.label }}
            </button>
          </nav>
          <nav class="nav nav-pills">
            <button
              v-for="option in directionOptions"
              :key="option.value"
              class="nav-link"
              :class="{ active: direction === option.value }"
              @tap="direction = option.value"
            >
              {{ option.label }}
            </button>
          </nav>
        </div>

        <div
          class="d-flex gap-3 rounded-6 bg-subtle-secondary p-3"
          :style="{ height: 224 }"
          :class="[justify, direction]"
        >
          <div
            v-for="n in 3"
            :key="n"
            class="avatar avatar-lg rounded-5 theme-primary"
          >
            <span class="fw-bold">{{ n }}</span>
          </div>
        </div>

        <code>class="d-flex {{ direction }} {{ justify }} gap-3"</code>
      </div>
    </section>

    <!-- Grid -->
    <section class="card">
      <div class="card-body">
        <h2 class="card-title fs-xl mb-0">CSS Grid</h2>
        <p class="fg-secondary mb-0">
          <code>.grid</code> with <code>g-col-*</code> spans. Widen the
          window past the md breakpoint to watch it reflow.
        </p>
        <div class="grid playground-grid">
          <div
            v-for="tile in tiles"
            :key="tile.title"
            class="d-flex flex-column justify-content-end rounded-7 p-4"
            :style="{ height: 96 }"
            :class="[tile.span, tile.color]"
          >
            <span class="fw-semibold fg-white">{{ tile.title }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Chips -->
    <section class="card">
      <div class="card-body">
        <div class="d-flex flex-row align-items-center gap-2">
          <div class="d-flex flex-column flex-fill">
            <h2 class="card-title fs-xl mb-0">Chips</h2>
            <p class="fg-secondary mb-0">
              {{ tagCount }} of {{ allTags.length }} · tap to select
            </p>
          </div>
          <button
            class="btn btn-subtle theme-secondary btn-icon"
            @tap="tagCount = Math.max(0, tagCount - 1)"
          >
            −
          </button>
          <button
            class="btn btn-solid theme-primary btn-icon"
            @tap="tagCount = Math.min(allTags.length, tagCount + 1)"
          >
            +
          </button>
        </div>
        <div class="d-flex flex-row flex-wrap gap-2">
          <span
            v-for="tag in allTags.slice(0, tagCount)"
            :key="tag"
            class="chip theme-primary"
            :class="{ active: selectedTags.has(tag) }"
            @tap="toggleTag(tag)"
          >
            {{ tag }}
          </span>
        </div>
      </div>
    </section>

    <!-- Feedback -->
    <section class="card">
      <div class="card-body">
        <h2 class="card-title fs-xl mb-0">Alerts, badges and progress</h2>
        <div class="alert theme-success">
          <span><strong>Done.</strong> Bootstrap's alert, unchanged.</span>
        </div>
        <div class="alert theme-warning">
          <span>Heads up: <code>@container</code> queries use the window width.</span>
        </div>
        <div class="d-flex flex-row flex-wrap gap-2">
          <span v-for="theme in themes" :key="theme" class="badge text-capitalize" :class="`theme-${theme}`">
            {{ theme }}
          </span>
          <span class="badge badge-subtle theme-primary">subtle</span>
          <span class="badge badge-outline theme-primary">outline</span>
        </div>
        <div class="progress">
          <div class="progress-bar" :style="{ width: `${progress}%` }" />
        </div>
        <div class="d-flex flex-row gap-2">
          <button
            class="btn btn-outline theme-secondary btn-sm"
            @tap="progress = Math.max(0, progress - 10)"
          >
            −10%
          </button>
          <button
            class="btn btn-outline theme-secondary btn-sm"
            @tap="progress = Math.min(100, progress + 10)"
          >
            +10%
          </button>
        </div>
      </div>
    </section>

    <!-- Theme pinning -->
    <!-- Keyed on the theme: core doesn't restyle when an attribute changes, so a new
         card is built (Bootstrap's dark/light values hang off [data-bs-theme]). -->
    <section :key="pinnedTheme ?? 'system'" class="card" :data-bs-theme="pinnedTheme">
      <div class="card-body">
        <h2 class="card-title fs-xl mb-0">data-bs-theme</h2>
        <p class="fg-secondary mb-0">
          Pin this card to a theme, or let it follow the system.
        </p>
        <nav class="nav nav-pills align-self-start">
          <button
            v-for="option in themeOptions"
            :key="option.label"
            class="nav-link"
            :class="{ active: pinnedTheme === option.value }"
            @tap="pinnedTheme = option.value"
          >
            {{ option.label }}
          </button>
        </nav>
        <div class="list-group">
          <div class="list-group-item">An item</div>
          <div class="list-group-item">A second item</div>
          <div class="list-group-item theme-primary">A themed item</div>
        </div>
      </div>
    </section>

    <!-- Forms -->
    <section class="card">
      <div class="card-body">
        <h2 class="card-title fs-xl mb-0">Forms</h2>
        <div class="d-flex flex-column gap-1">
          <span class="form-label">Your name</span>
          <!-- v-model compiles to Vue's DOM-only vModelText; bind explicitly. -->
          <input
            class="form-control"
            placeholder="Ada Lovelace"
            :value="name"
            @input="name = $event.target.value"
          />
        </div>
        <p class="mb-0">Hello, {{ name || 'stranger' }}.</p>
      </div>
    </section>
  </main>
</template>
