<template>
	<div class="hashtag-summary">
		<div class="name">
			#{{ props.tag }}
		</div>
        <MkFollowHashtagButton :tag="followableHashtag" />
    </div>
</template>

<script lang="ts" setup>
import {} from "vue";
import * as misskey from "firefish-js";
import MkFollowHashtagButton from "@/components/MkFollowHashtagButton.vue";

const props = defineProps<({
    tag: string;
})>();

const followableHashtag = props.tag;
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
}
</style>
