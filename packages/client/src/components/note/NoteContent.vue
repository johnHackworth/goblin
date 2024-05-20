<template>
  <div class="noteContent" :class="props.class">
    <p v-if="note.cw != null && !showContent" class="cw">
      <Mfm
        v-if="note.cw != ''"
        class="text"
        :text="note.cw"
        :author="note.user"
        :i="$i"
        :custom-emojis="note.emojis"
      />
    </p>
    <div
      class="content"
      :class="{
        collapsed,
        isLong,
        manyImages: note.files && note.files.length > 4,
        showContent: note.cw && !showContent,
        animatedMfm: !disableMfm,
      }"
    >
      <XCwButton
        ref="cwButton"
        v-if="note.cw && !showContent"
        v-model="showContent"
        :note="note"
        v-on:keydown="focusFooter"
        v-on:update:model-value="(val) => emit('expanded', val)"
      />
      <div
        class="body"
        v-bind="{
          'aria-hidden': note.cw && !showContent ? 'true' : null,
          tabindex: !showContent ? '-1' : null,
        }"
      >
        <template v-if="!note.cw || showContent">
          <Reblogtrail :reblogtrail="note.reblogtrail" />
          <template v-if="note.reblogtrail && note.reblogtrail.length">
            <div class="header-container">
              <MkAvatar class="avatar" :user="note.user" />
              <NoteHeader class="header" :note="note" />
            </div>
          </template>
          <div class="noteText">
            <div v-html="removeMeta(note.text)" />
          </div>
          <div v-if="!props.hideTags && note.tags" class="noteTags">
            <a class="noteTag" v-for="tag in note.tags" :href="`/tags/${tag}`">#{{tag}}</a>
          </div>
          <XPoll v-if="note.poll" :note="note" class="poll" />
          <div v-if="notEmbedFiles.length" class="noteFiles">
            <div v-for="(file, index) in notEmbedFiles" class="noteFile" :key="index">
              <span v-if="!note.text || note.text.indexOf(file.url) <0">
                <div v-if="file.type.startsWith('image')" class="noteImage">
                  <MkNoteImage :file="file" />
                </div>
                <div v-else-if="file.type.startsWith('video')" class="noteImage">
                  <video width="100%" controls :src="file.url" :type="file.type" />
                </div>
                <div v-else class="noteFile">
                  <a :href="file.url">{{ file.name }} {{ file.comment }} </a>
                </div>
              </span>
            </div>
          </div>
        </template>
      </div>
      <XCwButton
        v-if="note.cw && showContent"
        v-model="showContent"
        :note="note"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import * as misskey from "firefish-js";
import * as mfm from "mfm-js";
import * as os from "@/os";
import XCwButton from "@/components/MkCwButton.vue";
import XPoll from "@/components/MkPoll.vue";
import MkNoteImage from "@/components/note/NoteImage.vue";
import NoteHeader from "@/components/note/Header.vue";
import { extractUrlFromMfm } from "@/scripts/extract-url-from-mfm";
import { extractMfmWithAnimation } from "@/scripts/extract-mfm";
import { i18n } from "@/i18n";
import { defaultStore } from "@/store";

import Reblogtrail from "@/components/note/Reblogtrail";
import { removeMeta, getNotEmbedFiles } from "@/helpers/note/note-content"

const props = defineProps<{
  note: misskey.entities.Note;
  parentId?;
  conversation?;
  detailed?: boolean;
  detailedView?: boolean;
  class?: string;
  hideTags?: boolean;
}>();

const emit = defineEmits<{
  (ev: "push", v): void;
  (ev: "focusfooter"): void;
  (ev: "expanded", v): void;
}>();

const cwButton = ref<HTMLElement>();
const notEmbedFiles = ref(getNotEmbedFiles(props.note));
const isLong =
  !props.detailedView &&
  props.note.cw == null &&
  ((props.note.text != null &&
    (props.note.text.split("\n").length > 10 ||
      props.note.text.length > 800)) ||
    (props.note.files && props.note.files.length > 4));
const collapsed = $ref(props.note.cw == null && isLong);
const urls = props.note.text
  ? extractUrlFromMfm(mfm.parse(props.note.text)).slice(0, 5)
  : null;

let showContent = $ref(false);
const mfms = props.note.text
  ? extractMfmWithAnimation(mfm.parse(props.note.text))
  : null;

const hasMfm = $ref(mfms && mfms.length > 0);

let disableMfm = $ref(defaultStore.state.animatedMfm);

async function toggleMfm() {
  if (disableMfm) {
    if (!defaultStore.state.animatedMfmWarnShown) {
      const { canceled } = await os.confirm({
        type: "warning",
        text: i18n.ts._mfm.warn,
      });
      if (canceled) return;

      defaultStore.set("animatedMfmWarnShown", true);
    }

    disableMfm = false;
  } else {
    disableMfm = true;
  }
}

function focusFooter(ev) {
  if (ev.key == "Tab" && !ev.getModifierState("Shift")) {
    emit("focusfooter");
  }
}
</script>

<style lang="scss" scoped>
:deep(a),
:deep(button) {
  position: relative;
  z-index: 2;
}

.reply-icon {
  display: inline-block;
  border-radius: 6px;
  padding: 0.2em 0.2em;
  margin-right: 0.2em;
  color: var(--accent);
  transition: background 0.2s;
  &:hover,
  &:focus {
    background: var(--buttonHoverBg);
  }
}
.cw {
  cursor: default;
  padding: 16px;
  text-align: center;
  border: 1px dashed;
  margin: 32px;
}

.wrmlmaau {
  .content {
    overflow-wrap: break-word;

    img {
      max-width: 100%;
    }

    > .body {
      transition: filter 0.1s;
      > * {
        padding: 0px 32px;
      }

      > .rp {
        margin-left: 4px;
        font-style: oblique;
        color: var(--renote);
      }
      .reply-icon {
        display: inline-block;
        border-radius: 6px;
        padding: 0.2em 0.2em;
        margin-right: 0.2em;
        color: var(--accent);
        transition: background 0.2s;
        &:hover,
        &:focus {
          background: var(--buttonHoverBg);
        }
      }
      > :deep(.files) {
        margin-top: 0.4em;
        margin-bottom: 0.4em;
      }
      > .url-preview {
        margin-top: 8px;
      }

      > .poll {
        font-size: 80%;
      }

      > .renote {
        margin-bottom: 16px;
        padding: 0;

        > * {

          padding: 8px 32px 8px 32px;
          border: 0px;
          border-bottom: solid 1px var(--renote);
          border-radius: 0px;
          transition: background 0.2s;


          &:hover,
          &:focus-within {
            background-color: var(--panelHighlight);
          }
        }
      }
    }

    &.collapsed,
    &.showContent {
      position: relative;
      max-height: calc(15em + 100px);
      > .body {
        max-height: inherit;
        mask: linear-gradient(black calc(100% - 64px), transparent);
        -webkit-mask: linear-gradient(
          black calc(100% - 64px),
          transparent
        );
        padding-inline: 100px;
        margin-inline: -100px;
        margin-top: -100px;
        padding-top: 100px;
        overflow: hidden;
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
      }
    }
    &.collapsed {
      &.manyImages {
        max-height: calc(15em + 250px);
      }
      > .body {
        box-sizing: border-box;
      }
    }
    &.showContent {
      > .body {
        min-height: 2em;
        max-height: 5em;
        filter: blur(4px);
        :deep(span) {
          animation: none !important;
          transform: none !important;
        }
        :deep(img) {
          filter: blur(12px);
        }
      }
      :deep(.fade) {
        inset: 0;
        top: 90px;
      }
    }

    &:not(.animatedMfm) :deep(span) {
      animation: none !important;
    }
  }
  > :deep(button) {
    margin-top: 10px;
    margin-left: 0;
    margin-right: 0.4rem;
  }
  > .fade {
    position: absolute;
    inset: 0;
    bottom: -400px;
    display: flex;
    align-items: flex-end;
    z-index: 4;
    pointer-events: none;
    &::before {
      content: "";
      display: block;
      height: 100px;
      position: sticky;
      bottom: 0;
      width: 100%;
      background: var(--panel);
      mask: linear-gradient(to top, var(--gradient));
      -webkit-mask: linear-gradient(to top, var(--gradient));
      transition: background 0.2s;
    }
  }

}

.header-container {
  display: flex;
  position: relative;
  z-index: 2;
  padding: 0 16px 16px;

  @media (max-width: 500px) {
    padding: 0 8px 16px;
  }

  > .avatar {
    flex-shrink: 0;
    display: block;
    margin: 0 14px 0 0;
    width: var(--avatarSize);
    height: var(--avatarSize);
    position: relative;
    top: 0;
    left: 0;
  }
  > .header {
    width: 0;
    flex-grow: 1;
  }
}
</style>
<style lang="scss">
.noteContent {
  .noteText {
    padding: 0 16px;

    @media (max-width: 500px) {
      padding: 0 4px;
    }

    a {
      color: #006;
      text-decoration: underline;
    }

    img, video, iframe {
      width: calc(96% + 32px);
      margin-left: calc(2% - 16px);
    }
  }

  .reblog-item-content & {
    .noteText {
      padding: 0;
    }
  }

  .noteFiles {
    .noteFile {
      position: relative;
    }

    img {
      max-width: 96%;
      margin: 8px 2%;
    }

    video {
      width: 96%;
      margin: 8px 2%;
    }
  }

  .noteTags {
    padding: 16px 16px 0;

    .noteTag {
      color: #09A;
      font-weight: 600;
      margin-right: 16px;
    }
  }
}

.tumblrTitle {
  background: #e1e1e1;
  margin: 16px 16px;
  padding: 24px;
  border-radius: 4px;
}

.tumblrPost {
  width: calc(100% + 32px);
  margin-left: -16px;

  .postRoot {
    padding: 0 16px;
  }

  .reblogTrailItem {
    padding: 0 16px;
    border-bottom: 1px solid var(--accent);

    .reblogContent {
      padding: 0;
    }
  }

  .reblogContent {
    padding: 0 16px;

    figure {
      margin: 16px 0;
      max-width: 100%;

      video {
        width: 100%;
      }
    }
  }
  .reblogHeader {
    display: flex;
    align-items: center;
    padding: 0 16px;

    a {
      padding: 0 8px;
      text-decoration: none;
      color: #333;
      font-weight: bold;
    }

    img {
      width: 40px;
      height: 40px;
    }
  }
}
</style>