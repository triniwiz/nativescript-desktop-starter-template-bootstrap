<script lang="ts" setup>
import { computed } from 'nativescript-vue';
import { icons, type IconName } from '../icons';

const props = defineProps<{ name: IconName }>();

// MasonKit draws SVG backgrounds natively. The icons are `fill="currentColor"`, so they take
// the element's text colour, active and dark-mode states included.
const backgroundImage = computed(
  () => `url("data:image/svg+xml,${encodeURIComponent(icons[props.name])}")`,
);
</script>

<template>
  <div class="icon" :style="{ backgroundImage }" />
</template>
