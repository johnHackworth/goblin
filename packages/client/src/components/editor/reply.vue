<template>
  <div class="block-editor reply" >
    <div class="editor-area" ref="editorRef">
      <div v-if="editor">
        <editor-content :editor="editor" />
      </div>
    </div>
    <div class="button-area">
      <button
        class="_button submit"
        :disabled="!props.canPost"
        data-cy-open-post-form-submit
        @click="post"
      >
        <i class="ph-arrow-u-up-left ph-bold ph-lg"></i> Reply
      </button>
    </div>
  </div>
</template>


<script lang="ts" setup>
import {
  ref,
  onBeforeUnmount,
  onMounted,
} from "vue";
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
import { globalEvents } from "@/events";

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
    upload: (file: File, name?: string) =>void;
  }>(),
  {
    initialText: '',
    text: '',
    submitText: 'Post',
    placeholder: 'Go ahead, put anything',
  },
);

const editorRef = ref<HTMLElement>();

onMounted(() => {
  globalEvents.on('reply', initFromReply);
  globalEvents.on('postedByKeyboard', clearContent);
});

onBeforeUnmount(() => {
  globalEvents.off('reply', initFromReply);
  globalEvents.off('postedByKeyboard', clearContent);
});

const emit = defineEmits(['update', 'post'])

const update = ( { editor } ) => {
  emit('update', editor.getHTML());
}

const initFromReply = () => {
  editorRef.value.scrollIntoView({
      behavior: 'auto',
      block: 'center',
      inline: 'center'
  });
  editor.value.commands.focus('end')

}

const clearContent = () => {
  editor.value.commands.clearContent(true);
}

const post = ( ev ) => {
  const props = {}
  emit('post', props);
  setTimeout(() => { clearContent}, 100);
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
      protocols: ['ftp', 'http', 'https'],
      autolink: true,
    }),
    Subscript
  ],
  onUpdate: update
})

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

</script>

<style lang="scss">
.block-editor.reply {
  padding: 0 24px;
  display: flex;
  width: 100%;
  box-sizing: border-box;
  margin: 8px 0 16px;
  min-height: 16px;

  .tiptap {
    background: #EEE;
    border-radius: 8px;
    padding: 8px;
    margin-top: 8px;
    min-height: 40px;

    p {
      margin: 0;
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
  .editor-area {
    flex-grow: 1;
    margin-bottom: 0;
  }

  .button-area {
    padding: 8px 0;
    margin-left: 8px;
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
    padding: 4px 8px;
    font-weight: bold;
    vertical-align: center;
    border-radius: 4px;
    font-size: 0.9em;
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
}
</style>
