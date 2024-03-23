<template>
  <Ides v-if="IdesConfig.isActive()"/>
</template>

<script lang="ts" setup>
  import Ides from "./ides/index.vue";
  import IdesConfig from "./ides/config.js";
</script>