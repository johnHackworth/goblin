<template>
  <MkStickyContainer>
    <template #header v-if="$i"
      ><MkPageHeader
        :actions="headerActions"
        :tabs="headerTabs"
        :display-back-button="true"
        :to="`#${noteId}`"
    /></template>
    <MkSpacer :content-max="640" :marginMin="6">
      <div class="fcuexfpr">
        <transition
          :name="$store.state.animation ? 'fade' : ''"
          mode="out-in"
        >
          <div v-if="appearNote" class="note">

            <div class="main _gap">
              <div class="note _gap">
                <MkRemoteCaution
                  v-if="appearNote.user.host != null"
                  :href="appearNote.url ?? appearNote.uri"
                />
                <XNoteDetailed
                  :key="appearNote.id"
                  v-model:note="appearNote"
                  class="note"
                />
              </div>
            </div>
          </div>
          <MkError v-else-if="error" @retry="fetch()" />
          <MkLoading v-else />
        </transition>
      </div>
    </MkSpacer>
  </MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, defineComponent, watch } from "vue";
import * as misskey from "firefish-js";
import * as Acct from "firefish-js/built/acct";
import XNoteDetailed from "@/components/MkNoteDetailed.vue";
import XNotes from "@/components/MkNotes.vue";
import MkRemoteCaution from "@/components/MkRemoteCaution.vue";
import MkButton from "@/components/MkButton.vue";
import * as os from "@/os";
import { definePageMetadata } from "@/scripts/page-metadata";
import { i18n } from "@/i18n";
import { $i } from "@/account";

const props = defineProps<{
  slug: string;
  acct: string;
}>();

let note = $ref<null | misskey.entities.Note>();
let error = $ref();
let isRenote = $ref(false);
let appearNote = $ref<null | misskey.entities.Note>();


const fetchNote = async () => {
  note = null;
  const params = {
    ...Acct.parse(props.acct),
    slug: props.slug,
  };
  const res = await fetch(`/api/notes/show?slug=${params.slug}&username=${params.username}&host=${params.host}`)
  note = await res.json();
  isRenote =
    note.renote != null &&
    note.text == null &&
    note.fileIds.length === 0 &&
    note.poll == null;
  appearNote = isRenote
    ? (note.renote as misskey.entities.Note)
    : note;
}

watch(() => props.noteId, fetchNote, {
  immediate: true,
});

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata(
  computed(() =>
    appearNote
      ? {
          title: i18n.t("noteOf", {
            user: appearNote.user.name || appearNote.user.username,
          }),
          subtitle: new Date(appearNote.createdAt).toLocaleString(),
          avatar: appearNote.user,
          path: `/notes/${appearNote.id}`,
          share: {
            title: i18n.t("noteOf", {
              user:
                appearNote.user.name ||
                appearNote.user.username,
            }),
            text: appearNote.text,
          },
        }
      : null,
  ),
);
</script>

<style lang="scss" scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.125s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fcuexfpr {
  #goblin_app > :not(.wallpaper) & {
    background: var(--bg);
  }

  > .note {
    > .main {
      > .load {
        min-width: 0;
        margin: 0 auto;
        border-radius: 999px;

        &.next {
          margin-bottom: var(--margin);
        }

        &.prev {
          margin-top: var(--margin);
        }
      }

      > .note {
        > .note {
          border-radius: var(--radius);
          background: var(--panel);
        }
      }
    }
  }
}
</style>
