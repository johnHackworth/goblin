<template>
  <div class="block-editor" >
    <div class="editor-area">

      <div v-if="editor">
       <div v-if="isSelecting">
          <button @click="editor.chain().focus().toggleBold().run()" :disabled="!editor.can().chain().focus().toggleBold().run()" :class="{ 'is-active': editor.isActive('bold') }">
          <BoldIcon />
          </button>
          <button @click="editor.chain().focus().toggleItalic().run()" :disabled="!editor.can().chain().focus().toggleItalic().run()" :class="{ 'is-active': editor.isActive('italic') }">
            <ItalicIcon />
          </button>
          <button @click="editor.chain().focus().toggleStrike().run()" :disabled="!editor.can().chain().focus().toggleStrike().run()" :class="{ 'is-active': editor.isActive('strike') }">
            <StrikeIcon />
          </button>
          <button @click="editor.chain().focus().toggleCodeBlock().run()" :class="{ 'is-active': editor.isActive('codeBlock') }">
            code block
          </button>

        </div>
      </div>
      <editor-content :editor="editor" />
    </div>
    <footer>
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
        @click="useCw = !useCw"
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
import StarterKit from '@tiptap/starter-kit';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import Youtube from '@tiptap/extension-youtube'
import Document from '@tiptap/extension-document';
import Dropcursor from '@tiptap/extension-dropcursor';
import Image from '@tiptap/extension-image';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Placeholder from '@tiptap/extension-placeholder'
import { selectFiles } from "@/scripts/select-file";
import { i18n } from "@/i18n";

import BoldIcon from '@/components/icons/bold';
import ItalicIcon from '@/components/icons/italic';
import StrikeIcon from '@/components/icons/strike';
import PhotoIcon from "@/components/icons/photo.vue";
import VideoIcon from "@/components/icons/video.vue";
import QuoteIcon from "@/components/icons/quote.vue";
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
  }>(),
  {
    initialContent: '',
    submitText: 'Post',
    placeholder: 'Go ahead, put anything',
  },
);


let isSelecting = $ref(false);
const emit = defineEmits(['update', 'post'])

const update = ( { editor } ) => {
  emit('update', editor.getHTML());
}

const post = ( ev ) => {
  emit('post');
}

const selectionChange = ( { editor } ) => {
  const selection = editor.state.selection;
  isSelecting = !selection.empty;
}

const editor = useEditor({
  content: props.initialContent,
  extensions: [
    StarterKit,
    Image,
    Youtube.configure({
      controls: false,
    }),
    Placeholder.configure({
      placeholder: props.placeholder
    })
  ],
  onUpdate: update,
  onSelectionUpdate: selectionChange,
})

const addImage = (ev) => {
  selectFiles(ev.currentTarget ?? ev.target, i18n.ts.attachFile).then(
    (files_) => {
      for (const file of files_) {
        if(file.url) {
          editor.value.chain().focus().setImage({ src: file.url }).createParagraphNear().run();
        }
      }
    },
  );
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
}

</style>
