import { markInputRule, markPasteRule } from '@tiptap/core'
import { Strike as TStrike, type StrikeOptions as TStrikeOptions } from '@tiptap/extension-strike'
import type { FloatMenuItemStorage, MarkMarkdownStorage } from '../types'
import { icon } from '../utils/icons'

const INPUT_REGEX = /(?:^|[^~])(~~(?!\s+~~)([^~]+)~~)$/
const PASTE_REGEX = /(?:^|[^~])(~~(?!\s+~~)([^~]+)~~(?!\s+~~))/g

export interface StrikeOptions extends TStrikeOptions {
  dictionary: {
    name: string
  }
}

export const Strike = TStrike.extend<StrikeOptions>({
  name: 'strike',
  addOptions() {
    return {
      ...this.parent?.(),
      HTMLAttributes: {},
      dictionary: {
        name: '删除线',
      },
    }
  },
  addStorage() {
    return {
      ...this.parent?.(),
      markdown: {
        parser: {
          match: (node: any) => node.type === 'delete',
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
              type: 'delete',
            })
          },
        },
      },
      floatMenu: {
        items: [
          {
            id: this.name,
            name: this.options.dictionary.name,
            icon: icon('strike'),
            shortcut: 'Mod-Shift-S',
            active: (editor: any) => editor.isActive(this.name),
            action: (editor: any) => editor.chain().toggleStrike().focus().run(),
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
