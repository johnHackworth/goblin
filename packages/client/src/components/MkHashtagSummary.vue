<template>
	<div class="hashtag-summary">
        <MkA :to="`/tags/${tag.tag}`" class="fjwonapw _panel">
            <div class="name">
                #{{ tag.tag }}
            </div>
        </MkA>
        <MkFollowHashtagButton :tag="tag" />
        <MkBlockHashtagButton :tag="tag" />
    </div>
</template>

<script lang="ts" setup>
import {} from "vue";

import MkA from "@/components/global/MkA.vue";
import MkFollowHashtagButton from "@/components/MkFollowHashtagButton.vue";
import MkBlockHashtagButton from "@/components/MkBlockHashtagButton.vue";

defineProps<({
    tag: object;
})>();
</script>

<style type="text/scss" scoped>
.hashtag-summary {
    flex-wrap: wrap;

    display: flex;
    justify-content: space-between;

    background-color: white;
    border-radius: 10px;
    padding: 1em;
    margin-bottom: 0.4em;

    button {
        margin-left: 15px;
    }

    .fjwonapw {
        flex-grow: 2;

        .name {
            font-size: large;
            font-weight: bold;
            margin-left: 20px;
        }
    }
}
</style>
