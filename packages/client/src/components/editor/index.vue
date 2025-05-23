<template>
  <div class="block-editor" :onPaste="handlePaste" >
    <div class="editor-area">
      <div v-if="editor">
        <editor-content :editor="editor" />
      </div>
    </div>
  </div>
  <XPollEditor
    v-if="poll"
    v-model="poll"
    @destroyed="poll = null"
  />

  <div class="tagsContainer">
    <div class="currentTags">
      <span contenteditable class="tag" v-for="(tag, index) in tags" :key="index" @blur="updateTag" :data-index="index">{{ tag }}</span>
    </div>
    <div class="tagEditor">
      <div class="tagInput"
        :class="{ hasTags: tags.length > 0 }"
        ref="tagsElement"
        contenteditable
        @keydown.enter="validateTag" />
    </div>
  </div>
  <footer>
    <span v-if="isSelecting && isColorMenuVisible" class="formatting">
      <ColorMenu @close="toggleColorMenu" :editor="editor" @color="applyColor" />
    </span>
    <span v-if="isSelecting && !isColorMenuVisible" class="formatting">
      <button @click="editor.chain().focus().toggleBold().run()" :disabled="!editor.can().chain().focus().toggleBold().run()" class="_button"  :class="{ 'is-active': editor.isActive('bold') }">
      <BoldIcon />
      </button>
      <button @click="editor.chain().focus().toggleItalic().run()" :disabled="!editor.can().chain().focus().toggleItalic().run()"   class="_button" :class="{ 'is-active': editor.isActive('italic') }">
        <ItalicIcon />
      </button>
      <button @click="editor.chain().focus().toggleStrike().run()" :disabled="!editor.can().chain().focus().toggleStrike().run()"  class="_button" :class="{ 'is-active': editor.isActive('strike') }">
        <StrikeIcon />
      </button>
      <button @click="setLink" class="_button" :class="{ 'is-active': editor.isActive('link') }">
        <LinkIcon />
      </button>
      <button @click="editor.chain().focus().toggleSubscript().run()" class="_button" :class="{ 'is-active': editor.isActive('subscript') }">
        <SmallIcon />
      </button>
      <button @click="editor.chain().focus().toggleBig('1.5em').run() " class="_button" :class="{ 'is-active': editor.isActive('textStyle', { fontSize: '1.5em'}) }">
        <span class="big-icon">
          <i class="ph-caret-left ph-bold ph-lg"></i>
          <i class="ph-tumblr-logo ph-bold ph-lg"></i>
          <i class="ph-caret-right ph-bold ph-lg"></i>
        </span>
      </button>
      <button @click="toggleColorMenu" class="_button" :class="{ 'is-active': isColorMenuVisible }">
        <ColorIcon />
      </button>

    </span>
    <span v-if="!isSelecting">
      <button
        v-tooltip="i18n.ts.attachFile"
        class="_button photo"
        @click="addImage"
      >
        <PhotoIcon />
      </button>
      <button
        class="_button video"
        @click="addVideo"
      >
        <VideoIcon />
      </button>
    </span>
    <button
      class="_button quote"
      @click="editor.chain().focus().toggleBlockquote().run()" :class="{ 'is-active': editor && editor.isActive('blockquote') }"
    >
      <QuoteIcon />
    </button>
    <button
      class="_button bullet-list"
      @click="editor.chain().focus().toggleBulletList().run()" :class="{ 'is-active': editor && editor.isActive('bulletList') }"
    >
      <BulletListIcon />
    </button>
    <button
      class="_button ordered-list"
      @click="editor.chain().focus().toggleOrderedList().run()" :class="{ 'is-active': editor && editor.isActive('orderedList') }"
    >
      <OrderedListIcon />
    </button>

    <button
      v-if="!isSelecting"
      v-tooltip="i18n.ts.useCw"
      class="_button content-warning"
      :class="{ active: useCw }"
      @click="onEnableContentWarning"
    >
      <WarningIcon />
    </button>
    <button
      v-if="!isSelecting"
      class="_button pollButton"
      :class="{ active: poll }"
      @click="togglePoll"
    >
      <span class="big-icon">
        <i class="ph-chart-bar ph-fill ph-bold ph-2x"></i>
      </span>
    </button>
    <button
      class="_button submit"
      :disabled="postButtonDisabled"
      data-cy-open-post-form-submit
      @click="post"
    >
      {{ props.submitText }}<i
        :class="
          props.reply ?
            'ph-arrow-u-up-left ph-bold ph-lg' :
            props.renote ?
            isEmpty ?
            'ph-repeat ph-bold ph-lg' :
            'ph-quotes ph-bold ph-lg'
            : 'ph-paper-plane-tilt ph-bold ph-lg'
        "
      ></i>
    </button>
  </footer>

</template>


<script lang="ts" setup>
import { ref, watch } from 'vue'
import StarterKit from '@tiptap/starter-kit';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import Youtube from '@tiptap/extension-youtube'
import Document from '@tiptap/extension-document';
import Dropcursor from '@tiptap/extension-dropcursor';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Subscript from '@tiptap/extension-subscript';
import TextStyle from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { formatTimeString } from "@/scripts/format-time-string";

import { selectFiles } from "@/scripts/select-file";
import { i18n } from "@/i18n";

import BoldIcon from '@/components/icons/bold';
import ItalicIcon from '@/components/icons/italic';
import StrikeIcon from '@/components/icons/strike';
import PhotoIcon from "@/components/icons/photo.vue";
import VideoIcon from "@/components/icons/video.vue";
import QuoteIcon from "@/components/icons/quote.vue";
import LinkIcon from "@/components/icons/link.vue";
import SmallIcon from "@/components/icons/small.vue";
import BulletListIcon from "@/components/icons/bullet-list.vue";
import OrderedListIcon from "@/components/icons/ordered-list.vue";
import WarningIcon from "@/components/icons/warning.vue";
import ColorIcon from "@/components/icons/color.vue";
import XPollEditor from "@/components/MkPollEditor.vue";
import { Gradient } from "./color-gradient.ts";
import { Big } from "./big.ts";
import { Iframe } from "./iframe-module.ts";
import { GoblinImage } from "./image.js";

import ColorMenu from './color-menu.vue';

const props = withDefaults(
  defineProps<{
    initialText?: string;
    initialVisibility?: typeof misskey.noteVisibilities;
    initialLocalOnly?: boolean;
    initialNote?: misskey.entities.Note;
    initialContent?: string;
    submitText?: string;
    placeholder?: string;
    canPost?: boolean;
    reply?: boolean;
    renote?: boolean;
    initialTags?: string[];
    upload: (file: File, name?: string) =>void;
  }>(),
  {
    initialText: '',
    initialTags: [],
    text: '',
    tags: '',
    submitText: 'Post',
    placeholder: 'Go ahead, put anything',
  },
);

let postButtonDisabled = $ref( !props.canPost);
let tags = $ref(props.initialTags)
let poll = ref(null);
const tagsElement = $ref(null)

let isSelecting = $ref(false);
let isEmpty = $ref(true);
let isColorMenuVisible = $ref(false);

const emit = defineEmits(['update', 'updatePoll', 'updateTags', 'post', 'addedImage', 'enableContentWarning'])
window.poll = poll;
watch(
  poll,
  () => {
    emit("updatePoll", poll.value);
  }
);

const update = ( { editor } ) => {
  const editorValue = editor.getHTML();
  emit('update', editorValue);
  if(editorValue==="<p></p>") {
    isEmpty = true;
  } else {
    isEmpty = false;
  }
}

const onEnableContentWarning = () => {
  emit('enableContentWarning');
}

const updateTags = () => {
  emit('updateTags', tags);
}

const post = ( ev ) => {
  postButtonDisabled = true;
  validateTag()
  setTimeout(() => { emit('post') }, 100);
}

const applyColor = ( color ) => {
  editor.value.can().chain().focus()
    .extendMarkRange('link').setColor(color).run()
}

const handlePaste = async (ev) => {
  for (const { item, i } of Array.from(ev.clipboardData.items).map(
    (item, i) => ({ item, i }),
  )) {
    if (item.kind === "file") {
      const file = item.getAsFile();
      const lio = file.name.lastIndexOf(".");
      const ext = lio >= 0 ? file.name.slice(lio) : "";
      const formatted = `${formatTimeString(
        new Date(file.lastModified),
        'file',
      ).replace(/{{number}}/g, `${i + 1}`)}${ext}`;
      props.upload(file, formatted).then( (res) => {
        emit('addedImage', res);
        editor.value.chain().focus().setImage({ src: res.url }).createParagraphNear().run();
      });
    }
  }
}

function togglePoll() {
  if (poll.value) {
    poll.value = null;
  } else {
    poll.value = {
      choices: ["", ""],
      multiple: false,
      expiresAt: null,
      expiredAfter: null,
    };
  }
}



const toggleColorMenu = () => {
  isColorMenuVisible = !isColorMenuVisible;
}

const updateTag = ( event ) => {
  const index = event.target.dataset.index;
  if(!event.target.innerText) {
    tags.splice( index, 1);
  } else {
    tags[index] = event.target.innerText;
  }
  updateTags();
}

const validateTag = (event? : Event) => {
  var newTag = tagsElement.innerText.trim()
  if(newTag && newTag !== '') {
    tags.push(newTag);
    updateTags();
  }
  tagsElement.innerHTML = '';
  event && event.stopPropagation();
  event && event.preventDefault();
  return false;
}


const selectionChange = ( { editor } ) => {
  const selection = editor.state.selection;
  isSelecting = !selection.empty;
}

const editor = useEditor({
  content: props.initialText,
  extensions: [
    StarterKit,
    Iframe,
    GoblinImage,
    Youtube.configure({
      controls: false,
      nocookie: true,
      allowFullscreen: true,
      modestBranding: 'true',
    }),
    Placeholder.configure({
      placeholder: props.placeholder
    }),
    Link.configure({
      protocols: ['ftp', 'http', 'https'],
      autolink: true,
    }),
    Subscript,
    TextStyle,
    Color,
    Gradient,
    Big
  ],
  onUpdate: update,
  onSelectionUpdate: selectionChange,
  autofocus: 'end',
})

const addImage = (ev) => {
  selectFiles(ev.currentTarget ?? ev.target, i18n.ts.attachFile).then(
    (files) => {
      if(typeof files === 'string') {
        editor.value.chain().focus().setImage({ src: files }).createParagraphNear().run();
      } else {
        for (const file of files) {
          if(file.url) {
            emit('addedImage', file);
            editor.value.chain().focus().setImage({ src: file.url }).createParagraphNear().run();
          }
        }
      }
    },
  );
};

const setLink = () => {
  const previousUrl = editor.value.getAttributes('link').href;
  const url = window.prompt('URL', previousUrl)

  // cancelled
  if (url === null) {
    return
  }

  // empty
  if (url === '') {
    editor
      .value
      .chain()
      .focus()
      .extendMarkRange('link')
      .unsetLink()
      .run()

    return
  }

  // update link
  editor
    .value
    .chain()
    .focus()
    .extendMarkRange('link')
    .setLink({ href: url })
    .run()
};

const addVideo = (ev) => {
  const url = prompt('Enter YouTube URL')

  editor.value.commands.setYoutubeVideo({
    src: url,
    width: 640,
    height: 480,
  })
};

</script>

<style lang="scss">
/* Basic editor styles */
.tiptap {
  min-height: 128px;

  > * + * {
    margin-top: 0.75em;
  }

  padding-bottom: 16px;

  video, iframe {
    width: calc(100% + 64px);
    margin-left: -32px;
    min-height: 384px;
  }

  img {
    width: calc(100% + 64px);
    margin-left: -32px;
    height: auto;

    &.ProseMirror-selectednode {
      outline: 3px solid #68CEF8;
      &[contenteditable=true] {
        outline: none;
      }
    }
  }

  ul,
  ol {
    padding: 0 1rem;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    line-height: 1.1;
  }

  code {
    background-color: rgba(#616161, 0.1);
    color: #616161;
  }

  pre {
    background: #0D0D0D;
    color: #FFF;
    font-family: 'JetBrainsMono', monospace;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;

    code {
      color: inherit;
      padding: 0;
      background: none;
      font-size: 0.8rem;
    }
  }

  img {
    height: auto;
  }

  blockquote {
    padding-left: 1rem;
    border-left: 2px solid rgba(#0D0D0D, 0.1);
  }

  hr {
    border: none;
    border-top: 2px solid rgba(#0D0D0D, 0.1);
    margin: 2rem 0;
  }
}

.block-editor {
  background: white;
  width: calc(100% - 32px);
  margin-left: 16px;
  min-height: 128px;


  .ProseMirror:focus-visible {
    outline: none;
  }

  &:disabled {
    opacity: 0.5;
  }

  svg {
    width: 20px;
    height: 20px;
  }

  .tiptap p.is-editor-empty:first-child::before {
    content: attr(data-placeholder);
    float: left;
    color: #adb5bd;
    pointer-events: none;
    height: 0;
  }

  .tiptap {
    p > a {
      text-decoration: underline;
      color: #226;
    }
  }
}
</style>

<style lang="scss" scoped>
.bubble-menu {
  display: flex;
  background-color: #0D0D0D;
  padding: 0.2rem;
  border-radius: 0.5rem;

  button {
    border: none;
    background: none;
    color: #FFF;
    font-size: 0.85rem;
    font-weight: 500;
    padding: 0 0.2rem;
    opacity: 0.6;

    &:hover,
    &.is-active {
      opacity: 1;
    }
  }
}

.floating-menu {
  display: flex;
  background-color: #0D0D0D10;
  padding: 0.2rem;
  border-radius: 0.5rem;

  button {
    border: none;
    background: none;
    font-size: 0.85rem;
    font-weight: 500;
    padding: 0 0.2rem;
    opacity: 0.6;

    &:hover,
    &.is-active {
      opacity: 1;
    }
  }
}

.tagsContainer {
  width: calc(100% - 32px);
  padding: 0 16px 16px 16px;
  position: sticky;
  background-color: white;
  bottom: 24px;
  .currentTags {
    width: 100%;
    min-height: 32px;
  }

  .tagEditor {
    width: 100%;
    margin-bottom: 8px;
    outline: none;
  }

  .tagInput:empty:before {
    content: "#Tag or talk or tag and talk";
  }

  .tagInput.hasTags:empty:before {
    content: "#anything else?"
  }

  .tagInput {
    outline: none;
    background-color: #f1f1f1;
    color: #555;
    display: inline-block;
    padding: 4px 8px;
    margin-right: 8px;
    min-height: 16px;
    margin-top: 4px;
    border-radius: 8px;
  }

  .tag {
    background-color: #d1f1d1;
    display: inline-block;
    padding: 4px 8px;
    margin-right: 8px;
    min-width: 16px;
    min-height: 16px;
    margin-top: 4px;
    border-radius: 8px;
    outline: none;
  }

  .tag::before {
    content: '#';
    margin-right: 2px;
  }
}

footer {
  position: sticky;
  background-color: white;
  bottom: -30px;
  width: calc(100% - 32px);
  display: flex;
  padding: 0 16px 8px;
  flex-direction: row;
  align-items: center;

  button._button {
    margin-right: 16px;
  }

  svg {
    width: 28px;
    height: 28px;
  }

  .formatting {
    display: flex;

    .big-icon {
      width: 30px;
      display: flex;
      height: 100%;
      padding: 2px 0;
      margin-left: -4px;

      i {
        flex: 0 1 auto;
        width: 10px;
      }
    }

    ._button {
      svg {
        width: 24px;
        height: 24px;
      }

      &.is-active {
        svg {
          --icon-color-primary: RGB(0, 184, 255);
        }
        span {
          color: RGB(0, 184, 255);
        }
      }
    }
  }

  .photo svg {
    fill: rgb(255, 73, 48);
  }
  .video svg {
    fill: RGB(255, 98, 206);
  }
  .quote svg {
    fill: RGB(124, 92, 255);
  }
  .bullet-list svg {
    fill: rgb(0, 184, 255);
  }
  .ordered-list svg {
    fill: RGB(0, 207, 53);
  }
  .content-warning svg {
    fill: RGB(232, 215, 56);
  }
  .pollButton i {
    color: rgb(255, 73, 48);
  }

  button.submit._button {
    display: inline-flex;
    align-items: center;
    margin: 2px 0 2px auto;
    padding: 8px 32px;
    font-weight: bold;
    vertical-align: center;
    border-radius: 32px;
    font-size: 0.9em;
    float: right;
    background-color: rgb(0, 184, 255);
    color: #FFF;


    > i {
      margin-left: 6px;
    }
  }
}

</style>
