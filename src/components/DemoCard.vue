<script lang="ts" setup>
defineProps<{
  title: string;
  /** How much of the component renders as it does on the web. */
  status: 'works' | 'partial' | 'broken';
  note?: string;
}>();

const badges = {
  works: { label: 'Works', theme: 'theme-success' },
  partial: { label: 'Partial', theme: 'theme-warning' },
  broken: { label: 'Broken', theme: 'theme-danger' },
};
</script>

<template>
  <section class="card h-100">
    <div class="card-header d-flex flex-row align-items-center gap-2">
      <span class="fw-semibold flex-fill">{{ title }}</span>
      <span class="badge badge-subtle" :class="badges[status].theme">
        {{ badges[status].label }}
      </span>
    </div>
    <div class="card-body">
      <slot />
      <p v-if="note" class="fs-sm fg-secondary mb-0">{{ note }}</p>
    </div>
  </section>
</template>
