import { markInputRule, markPasteRule } from '@tiptap/core'
import {
  Underline as TUnderline,
  type UnderlineOptions as TUnderlineOptions,
} from '@tiptap/extension-underline'
import { remarkDecoration } from '../extensions/markdown'
import type { FloatMenuItemStorage, MarkMarkdownStorage } from '../types'
import { icon } from '../utils/icons'

// 使用 ++ 标记，与 Markdown 输出保持一致
const INPUT_REGEX = /(?:^|[^+])(\+\+(?!\s+\+\+)([^+]+)\+\+(?!\s+\+\+))$/
const PASTE_REGEX = /(?:^|[^+])(\+\+(?!\s+\+\+)([^+]+)\+\+(?!\s+\+\+))/g

export interface UnderlineOptions extends TUnderlineOptions {
  dictionary: {
    name: string
  }
}

export const Underline = TUnderline.extend<UnderlineOptions>({
  name: 'underline',
  addOptions() {
    return {
      ...this.parent?.(),
      HTMLAttributes: {},
      dictionary: {
        name: '下划线',
      },
    }
  },
  parseHTML() {
    return [
      {
        tag: 'u',
        priority: 100,
      },
      {
        style: 'text-decoration',
        getAttrs: (value) => {
          if (typeof value === 'string' && value.includes('underline')) {
            return {}
          }
          return false
        },
      },
    ]
  },
  addStorage() {
    return {
      ...this.parent?.(),
      markdown: {
        parser: {
          match: (node: any) => node.type === 'underline',
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
              type: 'underline',
            })
          },
        },
        hooks: {
          beforeInit: (processor: any) => processor.use(remarkDecoration('underline', '+')),
        },
      },
      floatMenu: {
        items: [
          {
            id: this.name,
            name: this.options.dictionary.name,
            icon: icon('underline'),
            shortcut: 'Mod-U',
            active: (editor: any) => editor.isActive(this.name),
            action: (editor: any) => editor.chain().toggleUnderline().run(),
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
