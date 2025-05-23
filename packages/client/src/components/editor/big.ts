import '@tiptap/extension-text-style'

import { Extension } from '@tiptap/core'

export type BigOptions = {
  types: string[],
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    big: {
      setBig: (size) => ReturnType,
      unsetBig: () => ReturnType,
      toggleBig: (size) => ReturnType,
    }
  }
}

export const Big = Extension.create<BigOptions>({
  name: 'big',

  addOptions() {
    return {
      types: ['textStyle'],
    }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {

          fontSize: {
            default: null,
            parseHTML: () => {
              return [
              {
                style: 'font-size',
                getAttrs: node => !!node.style.fontSize && null,
              }
              ]
            },
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {}
              }

              return {
                style: "font-size:"+attributes.fontSize
              }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      toggleBig: (size) => ({ chain }) => {
        return chain()
          .toggleMark('textStyle', {
            fontSize: size
          })
          .run()
      },
      setBig: (size) => ({ chain }) => {
        return chain()
          .setMark('textStyle', {
            fontSize: size
          })
          .run()
      },
      unsetBig: () => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize: 'inherit' })
          .removeEmptyTextStyle()
          .run()
      },
    }
  },
})