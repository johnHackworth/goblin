<template>
  <div class="header">
    <div class="user">
      <a v-if="note.user" :href="userPage(note.user)">{{note.user.username}}</a>
      <a v-else :href="note.url">{{ syntheticUser.user }}</a>
    </div>
    <div class="time">
      <MkA class="created-at" :to="notePage(note)">
        <MkTime :time="note.createdAt" />
        <i
          v-if="note.updatedAt"
          v-tooltip.noDelay="
            i18n.t('edited', {
              date: new Date(
                note.updatedAt,
              ).toLocaleDateString(),
              time: new Date(
                note.updatedAt,
              ).toLocaleTimeString(),
            })
          "
          class="ph-pencil ph-bold"
          style="margin-left: 0.4rem"
        ></i>
      </MkA>
      <MkVisibility :note="note" />
    </div>
  </div>
</template>


<script lang="ts" setup>
import type * as misskey from "firefish-js";
import MkVisibility from "@/components/MkVisibility.vue";
import { notePage } from "@/filters/note";
import { userPage } from "@/filters/user";
import { i18n } from "@/i18n";
import { getUserAndHostFromUrl } from "@/helpers/note/note-content"

const props = defineProps<{
  note: misskey.entities.Note;
  pinned?: boolean;
}>();

let syntheticUser = $ref(null);
if(!props.note.user) {
  syntheticUser = getUserAndHostFromUrl(props.note.url);
}


</script>

<style lang="scss" scoped>
.header {
  width: 100%;
  height: 48px;
  padding: 0 16px;
  display: flex;
  flex-direction: column;

  .user {
    font-weight: bold;
  }
}
</style>
