<template>
  <div v-for="(trailNote, index) in reblogtrail" :key="index">
    <div class="reblog">
      <ReblogItem :note="trailNote" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import {} from "vue";
import * as misskey from "firefish-js";
import ReblogItem from '@/components/note/ReblogItem.vue';

const props = defineProps<{
  reblogtrail: misskey.entities.Note[];
}>();
</script>


<style lang="scss" scoped>
  .reblog {
    border-bottom: 0.5px solid rgb(0, 25, 53);
    width: 100%;
    margin-bottom: 32px;
  }

</style>