import '@tiptap/extension-text-style'

import { Extension } from '@tiptap/core'

export type GradientOptions = {
  types: string[],
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    gradient: {
      setGradient: (gradient) => ReturnType,
      unsetGradient: () => ReturnType,
    }
  }
}

export const Gradient = Extension.create<GradientOptions>({
  name: 'gradient',

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

          background: {
            default: null,
            parseHTML: element => element.style.background?.replace(/['"]+/g, ''),
            renderHTML: attributes => {
              console.log(attributes)
              if (!attributes.background) {
                return {}
              }

              return {
                style: "background:"+attributes.background
              }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setGradient: (gradient) => ({ chain }) => {
        return chain()
          .setMark('textStyle', {
            background: 'linear-gradient(to left,'+gradient+') text',
            color: 'transparent'
          })
          .run()
      },
      unsetGradient: () => ({ chain }) => {
        return chain()
          .setMark('textStyle', { background: null, color: null })
          .removeEmptyTextStyle()
          .run()
      },
    }
  },
})