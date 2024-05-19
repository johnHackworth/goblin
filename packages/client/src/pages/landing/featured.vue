<template>
  <MkSpacer :content-max="640">
    <XNotes :pagination="paginationForLocal" />
  </MkSpacer>
</template>

<script lang="ts" setup>
import XNotes from "@/components/MkNotes.vue";
import MkTab from "@/components/MkTab.vue";
import { i18n } from "@/i18n";

const paginationForLocal = {
  endpoint: "notes/local-timeline" as const,
  limit: 10,
  origin: "local",
  offsetMode: true,
  params: {
    days: 14,
  },
};

let tab = $ref("local");
</script>
