<template>
    <img class="logo-image" :src="logoImageUrl">
</template>

<script lang="ts" setup>
const props = defineProps<{
	logoImageUrl: string;
}>();
</script>
