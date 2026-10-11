<script lang="ts" setup>
import { ref } from 'nativescript-vue';
import DemoCard from './DemoCard.vue';
import { showDialog } from '../dialog';

// Bootstrap's JavaScript needs a DOM, so open/closed/active state lives here.
const range = ref('Week');
const page = ref(2);
const agree = ref(true);
const notify = ref(false);
const radioOptions = ['A radio', 'Another radio'];
const radio = ref(radioOptions[0]);
// The input that raised a change event; MasonKit sends core's EventData.
const checkedOf = (event: { object: { checked: boolean } }) => event.object.checked;
const openItem = ref<number | null>(0);
const toastOpen = ref(true);
const dialogAnswer = ref('');

async function openDialog() {
  const confirmed = await showDialog({
    title: 'Keep the changes?',
    body: 'A Bootstrap .dialog over a backdrop, drawn by the app shell. Tap the backdrop to cancel.',
    confirmLabel: 'Keep',
  });
  dialogAnswer.value = confirmed ? 'Kept.' : 'Cancelled.';
}

const faq = [
  { q: 'Does Bootstrap’s CSS run unchanged?', a: 'Mostly. postcss-bootstrap-compat.mjs bridges the rest at build time.' },
  { q: 'What about its JavaScript?', a: 'It needs a DOM. Components like this accordion are driven by Vue state.' },
  { q: 'Which elements can I use?', a: 'MasonKit’s HTML-shaped ones: div, section, p, span, ul, ol, li, button, input, …' },
];

const tableColumns = 'grid-template-columns: 2fr 1fr 1fr';
const rows = [
  { name: 'Flexbox', engine: 'Taffy', status: 'Native' },
  { name: 'CSS Grid', engine: 'Taffy', status: 'Native' },
  { name: 'Tables', engine: 'Taffy', status: 'CSS Grid' },
];
</script>

<template>
  <main class="container d-flex flex-column gap-8 py-6">
    <header class="d-flex flex-column gap-1">
      <span class="fs-sm fw-semibold text-uppercase fg-primary">Components</span>
      <h1 class="fs-3xl fw-bold mb-0">How much of Bootstrap carries over?</h1>
      <p class="fg-secondary mb-0">
        Bootstrap's own markup and classes. Each card says how close it comes to
        the web; COMPATIBILITY.md has the details.
      </p>
    </header>

    <div class="row g-4">
      <div class="col-12 lg:col-6">
        <DemoCard
          title="Button group"
          status="partial"
          note="Inner corners stay rounded: the group targets [class*=btn-], and core reads any [class…] selector as a plain class."
        >
          <div class="btn-group align-self-start">
            <button
              v-for="option in ['Day', 'Week', 'Month']"
              :key="option"
              class="btn btn-outline theme-secondary"
              :class="{ active: range === option }"
              @tap="range = option"
            >
              {{ option }}
            </button>
          </div>
        </DemoCard>
      </div>

      <div class="col-12 lg:col-6">
        <DemoCard title="Input group" status="works">
          <div class="input-group">
            <span class="input-group-text">@</span>
            <input class="form-control" placeholder="username" />
            <button class="btn btn-solid theme-primary">Follow</button>
          </div>
        </DemoCard>
      </div>

      <div class="col-12 lg:col-6">
        <DemoCard
          title="Checks, radios and switches"
          status="works"
          note="MasonKit draws appearance: none inputs as plain boxes with a :checked state. The ::before marks are background images in app.css, and radios are grouped in Vue: MasonKit has no radio groups yet."
        >
          <div class="d-flex flex-row align-items-center gap-2">
            <input type="checkbox" class="check" :checked="agree" @change="agree = checkedOf($event)" />
            <span>A check</span>
          </div>
          <div v-for="option in radioOptions" :key="option" class="d-flex flex-row align-items-center gap-2">
            <input type="radio" class="radio" :checked="radio === option" @change="checkedOf($event) && (radio = option)" />
            <span>{{ option }}</span>
          </div>
          <div class="d-flex flex-row align-items-center gap-2">
            <div class="switch"><input type="checkbox" :checked="notify" @change="notify = checkedOf($event)" /></div>
            <span>Notifications {{ notify ? 'on' : 'off' }}</span>
          </div>
        </DemoCard>
      </div>

      <div class="col-12 lg:col-6">
        <DemoCard
          title="Breadcrumb and pagination"
          status="works"
          note="With <nav>/<div> markup. In <ol>/<li> MasonKit keeps the list markers."
        >
          <!-- <ol>/<li> keep MasonKit's list markers, so these are plain elements -->
          <nav class="breadcrumb">
            <a class="breadcrumb-link">Home</a>
            <span class="breadcrumb-divider">/</span>
            <a class="breadcrumb-link">Library</a>
            <span class="breadcrumb-divider">/</span>
            <a class="breadcrumb-link active">Data</a>
          </nav>
          <nav class="pagination">
            <div class="page-item">
              <a class="page-link" @tap="page = Math.max(1, page - 1)">‹</a>
            </div>
            <div v-for="n in 4" :key="n" class="page-item" :class="{ active: page === n }">
              <a class="page-link" @tap="page = n">{{ n }}</a>
            </div>
            <div class="page-item">
              <a class="page-link" @tap="page = Math.min(4, page + 1)">›</a>
            </div>
          </nav>
        </DemoCard>
      </div>

      <div class="col-12 lg:col-6">
        <DemoCard title="Spinners and placeholders" status="works">
          <div class="d-flex flex-row align-items-center gap-4">
            <div class="spinner-border fg-primary" />
            <div class="spinner-grow fg-success" />
            <div class="spinner-border spinner-sm fg-danger" />
          </div>
          <div class="placeholder-pulse d-flex flex-column gap-2">
            <div class="placeholder w-75" />
            <div class="placeholder w-50" />
          </div>
        </DemoCard>
      </div>

      <div class="col-12 lg:col-6">
        <DemoCard
          title="Table"
          status="partial"
          note="There are no <table> elements, so rows are CSS Grid: no cell borders or stripes (:nth-of-type)."
        >
          <div class="table table-striped">
            <div>
              <div class="d-grid fw-semibold" :style="tableColumns">
                <span>Feature</span>
                <span>Engine</span>
                <span>Status</span>
              </div>
            </div>
            <div>
              <div v-for="row in rows" :key="row.name" class="d-grid" :style="tableColumns">
                <span>{{ row.name }}</span>
                <span>{{ row.engine }}</span>
                <span>{{ row.status }}</span>
              </div>
            </div>
          </div>
        </DemoCard>
      </div>

      <div class="col-12 lg:col-6">
        <DemoCard
          title="Accordion"
          status="partial"
          note="Keyed on its open state: core doesn't restyle when the [open] attribute goes away. Toggling also re-wraps the headers until MasonKit ships its layout fix (after 1.0.0-beta.111)."
        >
          <div class="accordion">
            <div
              v-for="(item, index) in faq"
              :key="`${item.q}:${openItem === index}`"
              class="accordion-item"
              v-bind="openItem === index ? { open: true } : {}"
            >
              <div
                class="accordion-header"
                @tap="openItem = openItem === index ? null : index"
              >
                {{ item.q }}
              </div>
              <div v-if="openItem === index" class="accordion-body">{{ item.a }}</div>
            </div>
          </div>
        </DemoCard>
      </div>

      <div class="col-12 lg:col-6">
        <DemoCard
          title="Toast and dialog"
          status="works"
          note="There’s no <dialog> or ::backdrop: the app shell draws the backdrop and the .dialog over everything."
        >
          <div class="d-flex flex-row flex-wrap gap-2">
            <button class="btn btn-outline theme-secondary btn-sm" @tap="toastOpen = !toastOpen">
              {{ toastOpen ? 'Hide' : 'Show' }} toast
            </button>
            <button class="btn btn-outline theme-secondary btn-sm" @tap="openDialog">
              Open dialog
            </button>
            <span v-if="dialogAnswer" class="fs-sm fg-secondary align-self-center">{{ dialogAnswer }}</span>
          </div>
          <div v-if="toastOpen" class="toast show">
            <div class="toast-header">
              <strong class="flex-fill">MasonKit</strong>
              <button class="btn-close" @tap="toastOpen = false" />
            </div>
            <div class="toast-body">Hello from a Bootstrap toast.</div>
          </div>
        </DemoCard>
      </div>

      <div class="col-12 lg:col-6">
        <DemoCard
          title="Masks"
          status="works"
          note="mask-image, -size, -position and -repeat, and the mask shorthand. The wave's mask-position keyframes are played by MasonKit; core's keyframes can't animate it."
        >
          <div class="d-flex flex-row align-items-center gap-3">
            <button class="btn-close" />
            <div class="mask-icon" />
            <div class="mask-icon mask-icon-accent" />
          </div>
          <div class="placeholder-wave d-flex flex-column gap-2">
            <div class="placeholder w-100" />
            <div class="placeholder w-75" />
          </div>
          <div class="mask-fade d-flex flex-column gap-1">
            <span class="fw-semibold">A fading container</span>
            <span class="fs-sm fg-secondary">
              Its background, text and children all fade out through one linear-gradient mask,
              the way they would in a browser.
            </span>
            <span class="badge theme-primary align-self-start">Badge</span>
          </div>
        </DemoCard>
      </div>

      <div class="col-12 lg:col-6">
        <DemoCard
          title="Clip paths and border images"
          status="works"
          note="clip-path basic shapes, mask-border (an SVG tile repeated round the edge) and a gradient border-image. Taps outside a clip-path miss the element."
        >
          <div class="d-flex flex-row align-items-center gap-3">
            <div class="clip-demo clip-circle" />
            <div class="clip-demo clip-hexagon" />
            <div class="clip-demo clip-inset" />
          </div>
          <div class="ticket">
            <span class="fw-semibold">Admit one</span>
            <span class="fs-sm">Perforated by mask-border</span>
          </div>
          <div class="gradient-frame">A border-image frame</div>
        </DemoCard>
      </div>
    </div>
  </main>
</template>
