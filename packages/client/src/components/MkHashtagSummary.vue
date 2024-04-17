<template>
	<div class="hashtag-summary">
		<div class="name">
			#{{ tag }}
		</div>
        <MkFollowHashtagButton :tag="tag" />
        <MkBlockHashtagButton :tag="tag" />
    </div>
</template>

<script lang="ts" setup>
import {} from "vue";
import MkFollowHashtagButton from "@/components/MkFollowHashtagButton.vue";
import MkBlockHashtagButton from "@/components/MkBlockHashtagButton.vue";

const props = defineProps<({
    tag: string;
})>();
</script>

<style type="text/scss" scoped>
.hashtag-summary {
    .name {
        font-size: large;
        font-weight: bold;
        margin-left: 20px;
    }

    display: flex;
    justify-content: space-between;

    background-color: white;
    border-radius: 10px;
    padding: 1em;
    margin-bottom: 0.4em;

    .name {
        flex-grow: 2;
    }

    button {
        margin-left: 15px;
    }
}
</style>
