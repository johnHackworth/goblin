<template>
  <div v-size="{ min: [350, 500] }" class="reblog-item" :data-debug="JSON.stringify(note)">
    <div class="reblog-item-header">
      <div class="avatar">
        <Pfp :user="note.user" :url="note.url" />
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

  @media (max-width: 500px) {
    padding: 8px 8px;
    width: calc(100% - 16px);;
  }

  .reblog-item-header {
    display: flex;
    flex-direction: row;
  }

  .reblog-item-content {
    margin: 0;

      img {
        max-width: 500px !important;
      }

  }
}
</style>
