import { mergeAttributes, Node } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'

import Image from '@tiptap/extension-image'

import Component from './image.vue'

export const GoblinImage = Image.extend({
  addAttributes() {
    return {
      src: {
        default: "",
      },
      alt: {
        default: "",
      }
    }
  },

  parseHTML() {
    return [
      {
        tag: 'img',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(HTMLAttributes)]
  },

  addNodeView() {
    return VueNodeViewRenderer(Component)
  },
})