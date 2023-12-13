<template>
  <div v-size="{ min: [350, 500] }" class="reblog-item">
    <div class="reblog-item-header">
      <div class="avatar">
        <Pfp :user="note.user" />
      </div>
      <div class="data">
        <Header :note="note" />
      </div>
    </div>
    <div class="reblog-item-content">
      <NoteContent
        class="welcomeNote"
        :note="note"
        :detailed="false"
        :parentId="note.parentId"
        hideTags>
      </NoteContent>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {} from "vue";
import * as misskey from "firefish-js";
import Pfp from "@/components/note/Pfp.vue";
import Header from "@/components/note/Header.vue";
import NoteContent from "@/components/note/NoteContent.vue";

const props = defineProps<{
  note: misskey.entities.Note;
  pinned?: boolean;
}>();
</script>

<style lang="scss">
.reblog-item {
  margin: 0;
  padding: 8px 32px;
  width: calc(100% - 64px);;
  display: flex;
  flex-direction: column;


  .reblog-item-header {
    display: flex;
    flex-direction: row;
  }

  .reblog-item-content {
    margin: 16px 0;

      img {
        max-width: 500px !important;
      }

  }
}
</style>
