import { markInputRule, markPasteRule } from '@tiptap/core'
import {
  type SuperscriptExtensionOptions,
  Superscript as TSuperscript,
} from '@tiptap/extension-superscript'
import { remarkDecorationSingle } from '../extensions/markdown'
import type { FloatMenuItemStorage, MarkMarkdownStorage } from '../types'
import { icon } from '../utils/icons'

// 单个 ^ 的正则表达式
const INPUT_REGEX = /(?:^|[^^])(\^(?!\^)([^^]+)\^)$/
const PASTE_REGEX = /(?:^|[^^])(\^(?!\^)([^^]+)\^)/g

export interface SuperscriptOptions extends SuperscriptExtensionOptions {
  dictionary: {
    name: string
  }
}

export const Superscript = TSuperscript.extend<SuperscriptOptions>({
  name: 'superscript',
  addOptions() {
    return {
      ...this.parent?.(),
      HTMLAttributes: {},
      dictionary: {
        name: '上标',
      },
    }
  },
  addStorage() {
    return {
      ...this.parent?.(),
      markdown: {
        parser: {
          match: (node: any) => node.type === 'sup',
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
              type: 'sup',
            })
          },
        },
        hooks: {
          beforeInit: (processor: any) => processor.use(remarkDecorationSingle('sup', '^')),
        },
      },
      floatMenu: {
        items: [
          {
            id: this.name,
            name: this.options.dictionary.name,
            icon: icon('sup'),
            shortcut: 'Mod-.',
            active: (editor: any) => editor.isActive(this.name),
            action: (editor: any) => editor.chain().toggleSuperscript().run(),
          },
        ],
      },
    } satisfies MarkMarkdownStorage & FloatMenuItemStorage
  },

  addInputRules() {
    return [
      markInputRule({
        find: INPUT_REGEX,
        type: this.type,
      }),
    ]
  },

  addPasteRules() {
    return [
      markPasteRule({
        find: PASTE_REGEX,
        type: this.type,
      }),
    ]
  },
})
