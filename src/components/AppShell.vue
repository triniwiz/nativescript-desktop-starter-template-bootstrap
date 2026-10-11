<script lang="ts" setup>
import { ref, computed, watch } from 'nativescript-vue';
import { Utils, isIOS, type EventData, type View } from '@nativescript/core';
import { currentScreen, screens, type ScreenId } from '../navigation';
import { currentDialog, closeDialog } from '../dialog';
import Icon from './Icon.vue';
import Home from './Home.vue';
import Playground from './Playground.vue';
import Components from './Components.vue';

const views = { home: Home, playground: Playground, components: Components };

// Below the lg breakpoint the sidebar folds into a menu under the navbar.
const menuOpen = ref(false);

// Building a screen's views takes a while (it's a lot of styled views), so a screen is built the
// first time it's visited and kept afterwards; navigating back only flips its `display`. That's an
// inline style, not a class like `d-none`: core re-matches every descendant's selectors when a class
// changes, which takes most of a second on a screen of Bootstrap views. A first visit
// waits for a frame first, so the menu closes and the active link shows before the JS thread
// is busy building.
const builtScreens = ref<ScreenId[]>([currentScreen.value]);
const shownScreen = ref<ScreenId>(currentScreen.value);
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

watch(currentScreen, async (to) => {
  menuOpen.value = false;
  if (!builtScreens.value.includes(to)) {
    await nextFrame();
    if (currentScreen.value !== to) return;
    builtScreens.value = [...builtScreens.value, to];
  }
  shownScreen.value = to;
});

// The shell draws under the status bar and home indicator (iosOverflowSafeArea on iOS,
// androidOverflowEdge on Android) and pads its own regions by those insets instead, so the
// sidebar and navbar backgrounds reach the screen edges.
const insets = ref({ top: 0, right: 0, bottom: 0, left: 0 });
const wide = ref(false);
const dp = (px: number) => Utils.layout.toDeviceIndependentPixels(px);

function setInsets(top: number, right: number, bottom: number, left: number) {
  const next = { top: dp(top), right: dp(right), bottom: dp(bottom), left: dp(left) };
  const prev = insets.value;
  if (next.top !== prev.top || next.right !== prev.right || next.bottom !== prev.bottom || next.left !== prev.left) {
    insets.value = next;
  }
}

function onRootLayout(args: EventData) {
  const root = args.object as View;
  wide.value = root.getActualSize().width >= 1024;
  if (isIOS) {
    const inset = root.getSafeAreaInsets();
    setInsets(inset.top, inset.right, inset.bottom, inset.left);
  }
}

function onAndroidInset(args: any) {
  const inset = args.inset;
  setInsets(inset.top, inset.right, inset.bottom, inset.left);
  inset.topConsumed = inset.rightConsumed = inset.bottomConsumed = inset.leftConsumed = true;
}

// Where the top and bottom insets go depends on which layout is showing.
const contentInsets = computed(() => ({
  marginTop: wide.value ? insets.value.top : 0,
  marginBottom: insets.value.bottom,
  marginLeft: wide.value ? 0 : insets.value.left,
  marginRight: insets.value.right,
}));
</script>

<template>
  <Frame>
    <Page actionBarHidden="true" androidOverflowEdge="dont-apply" @androidOverflowInset="onAndroidInset">
      <!-- A column on narrow windows (navbar on top), a row from lg up (sidebar) -->
      <div
        class="d-flex flex-column lg:flex-row w-100 h-100"
        :iosOverflowSafeArea="true"
        @layoutChanged="onRootLayout"
      >
        <header
          class="navbar flex-shrink-0 border-bottom px-4 lg:d-none"
          :style="{ paddingTop: insets.top + 8, paddingLeft: insets.left + 16, paddingRight: insets.right + 16 }"
        >
          <div class="d-flex flex-row align-items-center gap-2">
            <div class="avatar avatar-sm rounded-5 bg-hero fg-white">
              <Icon name="bootstrap-fill" />
            </div>
            <span class="navbar-brand fw-semibold">NativeScript × Bootstrap</span>
          </div>
          <div
            class="btn btn-subtle theme-secondary btn-sm btn-icon"
            @tap="menuOpen = !menuOpen"
          >
            <Icon :name="menuOpen ? 'x-lg' : 'list'" />
          </div>
        </header>
        <nav
          v-if="menuOpen"
          class="nav nav-pills nav-pills-vertical sidebar-nav flex-shrink-0 border-bottom p-3 lg:d-none"
        >
          <div
            v-for="screen in screens"
            :key="screen.id"
            class="nav-link justify-content-start gap-3"
            :class="{ active: currentScreen === screen.id }"
            @tap="currentScreen = screen.id"
          >
            <Icon :name="screen.icon" />
            <span>{{ screen.label }}</span>
          </div>
        </nav>

        <aside
          class="d-none lg:d-flex flex-column flex-shrink-0 gap-6 border-end bg-1 px-4"
          :style="{ width: 256 + insets.left, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20, paddingLeft: insets.left + 16 }"
        >
          <div class="d-flex flex-row align-items-center gap-3 px-2">
            <div class="avatar avatar-lg rounded-6 bg-hero fg-white fs-xl">
              <Icon name="bootstrap-fill" />
            </div>
            <div class="d-flex flex-column">
              <span class="fw-bold">NativeScript</span>
              <span class="fs-sm fg-secondary">Bootstrap 6 starter</span>
            </div>
          </div>

          <div class="d-flex flex-column gap-2">
            <span class="fs-xs fw-semibold text-uppercase fg-secondary px-3">Pages</span>
            <nav class="nav nav-pills nav-pills-vertical sidebar-nav gap-1">
              <div
                v-for="screen in screens"
                :key="screen.id"
                class="nav-link justify-content-start gap-3"
                :class="{ active: currentScreen === screen.id }"
                @tap="currentScreen = screen.id"
              >
                <Icon :name="screen.icon" />
                <span>{{ screen.label }}</span>
              </div>
            </nav>
          </div>

          <div class="card card-subtle mt-auto">
            <div class="card-body">
              <span class="fs-sm fw-semibold">Resize the window</span>
              <span class="fs-xs fg-secondary">
                Below 1024 dp the sidebar folds into a navbar with a menu.
              </span>
            </div>
          </div>
        </aside>

        <Scroll
          v-for="id in builtScreens"
          :key="id"
          class="shell-content"
          :style="{ display: id === shownScreen ? 'block' : 'none' }"
        >
          <component :is="views[id]" :style="contentInsets" />
        </Scroll>

        <!--
          Dialogs from showDialog() (src/dialog.ts). Native apps have no <dialog> or top layer,
          so the shell draws one over everything: a backdrop with Bootstrap's ::backdrop look,
          and the .dialog itself. They're siblings, so a tap on the dialog can't close it.
        -->
        <div v-if="currentDialog" class="app-overlay">
          <div class="app-backdrop" @tap="closeDialog(false)" />
          <div class="dialog" open>
            <div class="dialog-header">
              <h2 class="dialog-title fs-lg mb-0">{{ currentDialog.title }}</h2>
            </div>
            <div class="dialog-body">{{ currentDialog.body }}</div>
            <div class="dialog-footer">
              <div class="btn btn-subtle theme-secondary" @tap="closeDialog(false)">
                {{ currentDialog.cancelLabel ?? 'Cancel' }}
              </div>
              <div class="btn btn-solid theme-primary" @tap="closeDialog(true)">
                {{ currentDialog.confirmLabel ?? 'OK' }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Page>
  </Frame>
</template>
