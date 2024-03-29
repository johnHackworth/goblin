<template>
    <img class="logo-image" :src="logoImageUrl">
</template>

<script lang="ts" setup>
const props = defineProps<{
	logoImageUrl: string;
}>();
</script>

<style lang="scss" scoped>
.logo-image {
  z-index: 20;
}
</style>