<template>
  <template v-if="file.isSensitive && hide && defaultStore.state.nsfw !== 'force'">
    <img :src="file.url" :alt="file.comment" class="nsfw" @click="hide = false" />
    <span class="nsfw-warning" @click="hide = false">
      <span v-if="file.isSensitive">{{ i18n.ts.nsfw }}<br></span>
      {{ i18n.ts.clickToShow }}
    </span>
  </template>
  <template v-else>
    <img :src="file.url" :alt="file.comment" />
  </template>
</template>

<script lang="ts" setup>
import { i18n } from "@/i18n";
import * as misskey from "firefish-js";
import { defaultStore } from "@/store";

defineProps<{
  file: misskey.entities.DriveFile;
}>();

let hide = $ref(true);
</script>

<style lang="scss" scoped>
img {
  &.nsfw {
    filter: blur(20px);
  }
}

span {
  &.nsfw-warning {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);

    text-align: center;
    font-weight: bold;

    padding: 5px 20px;
    background-color: rgba(1.0, 1.0, 1.0, 0.4);
    color: lightgray;

    border-radius: 5px;
  }
}
</style>