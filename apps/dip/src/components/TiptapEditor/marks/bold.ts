import { markInputRule, markPasteRule } from '@tiptap/core'
import { Bold as TBold, type BoldOptions as TBoldOptions } from '@tiptap/extension-bold'
import type { FloatMenuItemStorage, MarkMarkdownStorage } from '../types'
import { icon } from '../utils/icons'

const STAR_INPUT_REGEX = /(?:^|[^*])(\*\*(?!\s+\*\*)([^*]+)\*\*)$/
const STAR_PASTE_REGEX = /(?:^|[^*])(\*\*(?!\s+\*\*)([^*]+)\*\*(?!\s+\*\*))/g
const UNDERSCORE_INPUT_REGEX = /(?:^|[^_])(__(?!\s+__)([^_]+)__)$/
const UNDERSCORE_PASTE_REGEX = /(?:^|[^_])(__(?!\s+__)([^_]+)__(?!\s+__))/g

export interface BoldOptions extends TBoldOptions {
  dictionary: {
    name: string
  }
}

export const Bold = TBold.extend<BoldOptions>({
  name: 'bold',
  addOptions() {
    return {
      ...this.parent?.(),
      HTMLAttributes: {},
      dictionary: {
        name: '加粗',
      },
    }
  },
  addStorage() {
    return {
      ...this.parent?.(),
      markdown: {
        parser: {
          match: (node: any) => node.type === 'strong',
          apply: (state: any, node: any, type: any) => {
            state.openMark(type)
            state.next(node.children)
            state.closeMark(type)
          },
        },
        serializer: {
          match: (mark: any) => mark.type.name === this.name,
          apply: (state: any, mark: any) => {
            state.withMark(mark, {
              type: 'strong',
            })
          },
        },
      },
      floatMenu: {
        items: [
          {
            id: this.name,
            name: this.options.dictionary.name,
            icon: icon('bold'),
            shortcut: 'Mod-B',
            active: (editor: any) => editor.isActive(this.name),
            action: (editor: any) => editor.chain().toggleBold().focus().run(),
          },
        ],
      },
    } satisfies MarkMarkdownStorage & FloatMenuItemStorage
  },
  addInputRules() {
    return [
      markInputRule({
        find: STAR_INPUT_REGEX,
        type: this.type,
      }),
      markInputRule({
        find: UNDERSCORE_INPUT_REGEX,
        type: this.type,
      }),
    ]
  },
  addPasteRules() {
    return [
      markPasteRule({
        find: STAR_PASTE_REGEX,
        type: this.type,
      }),
      markPasteRule({
        find: UNDERSCORE_PASTE_REGEX,
        type: this.type,
      }),
    ]
  },
})
