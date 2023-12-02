<template>
  <div class="block-editor" :onPaste="handlePaste" >
    <div class="editor-area">
      <div v-if="editor">
        <editor-content :editor="editor" />
        <div class="tagsContainer">        <div class="currentTags">
            <span contenteditable class="tag" v-for="(tag, index) in tags" :key="index" @blur="updateTag" :data-index="index">
              {{ tag }}
            </span>
          </div>

          <div class="tagEditor">
            <div class="tagInput"
              :class="{ hasTags: tags.length > 0 }"
              ref="tagsElement"
              contenteditable
              @keydown.enter="validateTag" />
          </div>
        </div>
      </div>
    </div>
    <footer>
      <span v-if="isSelecting" class="formatting">
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
        <button @click="editor.chain().focus().toggleSubscript().run()" class="_button" :class="{ 'is-active': editor.isActive('link') }">
          <SmallIcon />
        </button>

      </span>
      <span v-if="!isSelecting" class="formatting">
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
        @click="editor.chain().focus().toggleBlockquote().run()" :class="{ 'is-active': editor.isActive('blockquote') }"
      >
        <QuoteIcon />
      </button>
      <button
        class="_button bullet-list"
        @click="editor.chain().focus().toggleBulletList().run()" :class="{ 'is-active': editor.isActive('bulletList') }"
      >
        <BulletListIcon />
      </button>
      <button
        class="_button ordered-list"
        @click="editor.chain().focus().toggleOrderedList().run()" :class="{ 'is-active': editor.isActive('orderedList') }"
      >
        <OrderedListIcon />
      </button>

      <button
        v-tooltip="i18n.ts.useCw"
        class="_button content-warning"
        :class="{ active: useCw }"
        @click="onEnableContentWarning"
      >
        <WarningIcon />
      </button>
      <div v-if="postFormActions">
        <button
          v-if="postFormActions.length > 0"
          v-tooltip="i18n.ts.plugin"
          class="_button"
          @click="showActions"
        >
          <i class="ph-plug ph-bold ph-lg"></i>
        </button>
      </div>


      <button
        class="_button submit"
        :disabled="!props.canPost"
        data-cy-open-post-form-submit
        @click="post"
      >
        {{ props.submitText }}<i
          :class="
            props.reply
              ? 'ph-arrow-u-up-left ph-bold ph-lg'
              : props.renote
              ? 'ph-quotes ph-bold ph-lg'
              : 'ph-paper-plane-tilt ph-bold ph-lg'
          "
        ></i>
      </button>
    </footer>
  </div>
</template>


<script lang="ts" setup>
import { ref } from 'vue'
import StarterKit from '@tiptap/starter-kit';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import Youtube from '@tiptap/extension-youtube'
import Document from '@tiptap/extension-document';
import Dropcursor from '@tiptap/extension-dropcursor';
import Image from '@tiptap/extension-image';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import BubbleMenu from '@tiptap/extension-bubble-menu';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Subscript from '@tiptap/extension-subscript';
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

let tags = $ref(props.initialTags)
const tagsElement = $ref(null)

let isSelecting = $ref(false);
const emit = defineEmits(['update', 'updateTags', 'post', 'addedImage', 'enableContentWarning'])

const update = ( { editor } ) => {
  emit('update', editor.getHTML());
}

const onEnableContentWarning = () => {
  emit('enableContentWarning');
}

const updateTags = () => {
  emit('updateTags', tags);
}

const post = ( ev ) => {
  emit('post');
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
        console.log(res,'¡¡¡¡¡¡¡¡¡¡¡');
        emit('addedImage', res);
        editor.value.chain().focus().setImage({ src: res.url }).createParagraphNear().run();
      });
    }
  }
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

const validateTag = (event : Event) => {
  var newTag = tagsElement.innerText.trim()
  tags.push(newTag);
  tagsElement.innerHTML = '';
  updateTags();
  event.stopPropagation();
  event.preventDefault();
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
    Image,
    Youtube.configure({
      controls: false,
    }),
    Placeholder.configure({
      placeholder: props.placeholder
    }),
    Link.configure({
      protocols: ['ftp', 'mailto', 'http', 'https'],
      autolink: true,
    }),
    Subscript
  ],
  onUpdate: update,
  onSelectionUpdate: selectionChange,
})

const addImage = (ev) => {
  selectFiles(ev.currentTarget ?? ev.target, i18n.ts.attachFile).then(
    (files_) => {
      for (const file of files_) {
        if(file.url) {
          console.log('emitint', file)
          emit('addedImage', file);
          editor.value.chain().focus().setImage({ src: file.url }).createParagraphNear().run();
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
  width: 600px;
  min-height: 300px;

  .editor-area {
    margin-bottom: 80px;
  }

  svg {
    width: 20px;
    height: 20px;
  }

  footer {
    padding-bottom: 16px;
    position: absolute;
    bottom: 0px;
    width: calc( 100% - 32px);

    button {
      margin-right: 16px;
    }

    svg {
      width: 28px;
      height: 28px;

    }

    .formatting {
      ._button {
        svg {
          width: 24px;
          height: 24px;
        }

        &.is-active {
          svg {
            --icon-color-primary: RGB(0, 184, 255);
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
  }

  .ProseMirror:focus-visible {
    outline: none;
  }

  .submit {
    display: inline-flex;
    align-items: center;
    margin: 2px;
    padding: 8px 32px;
    font-weight: bold;
    vertical-align: center;
    border-radius: 32px;
    font-size: 0.9em;
    float: right;
    background-color: rgb(0, 184, 255);
    color: #FFF;

    &:disabled {
      opacity: 0.5;
    }

    > i {
      margin-left: 6px;
    }
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

  .currentTags {
    width: 100%;
    margin-bottom: 8px;
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
}
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

</style>
