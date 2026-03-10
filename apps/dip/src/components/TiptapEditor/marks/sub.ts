import { markInputRule, markPasteRule } from '@tiptap/core'
import {
  type SubscriptExtensionOptions,
  Subscript as TSubscript,
} from '@tiptap/extension-subscript'
import { remarkDecorationSingle } from '../extensions/markdown'
import type { FloatMenuItemStorage, MarkMarkdownStorage } from '../types'
import { icon } from '../utils/icons'

// 单个 ~ 的正则表达式（避免与删除线的 ~~ 冲突）
const INPUT_REGEX = /(?:^|[^~])(~(?!~)([^~]+)~)$/
const PASTE_REGEX = /(?:^|[^~])(~(?!~)([^~]+)~)/g

export interface SubscriptOptions extends SubscriptExtensionOptions {
  dictionary: {
    name: string
  }
}

export const Subscript = TSubscript.extend<SubscriptOptions>({
  name: 'subscript',
  addOptions() {
    return {
      ...this.parent?.(),
      HTMLAttributes: {},
      dictionary: {
        name: '下标',
      },
    }
  },
  addStorage() {
    return {
      ...this.parent?.(),
      markdown: {
        parser: {
          match: (node: any) => node.type === 'sub',
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
              type: 'sub',
            })
          },
        },
        hooks: {
          beforeInit: (processor: any) => processor.use(remarkDecorationSingle('sub', '~')),
        },
      },
      floatMenu: {
        items: [
          {
            id: this.name,
            name: this.options.dictionary.name,
            icon: icon('sub'),
            shortcut: 'Mod-,',
            active: (editor: any) => editor.isActive(this.name),
            action: (editor: any) => editor.chain().toggleSubscript().focus().run(),
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
