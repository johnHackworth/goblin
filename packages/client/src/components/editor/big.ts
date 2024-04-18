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
            parseHTML: element => element.style.background?.replace(/['"]+/g, ''),
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