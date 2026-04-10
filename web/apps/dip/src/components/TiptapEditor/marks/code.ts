import { markInputRule, markPasteRule } from '@tiptap/core'
import { Code as TCode, type CodeOptions as TCodeOptions } from '@tiptap/extension-code'
import type { FloatMenuItemStorage, MarkMarkdownStorage } from '../types'
import { icon } from '../utils/icons'

const INPUT_REGEX = /(?:^|[^`])(`(?!\s+`)([^`]+)`)$/
const PASTE_REGEX = /(?:^|[^`])(`(?!\s+`)([^`]+)`(?!\s+`))/g

export interface CodeOptions extends TCodeOptions {
  dictionary: {
    name: string
  }
}

export const Code = TCode.extend<CodeOptions>({
  name: 'code',
  addOptions() {
    return {
      ...this.parent?.(),
      HTMLAttributes: {},
      dictionary: {
        name: '代码',
      },
    }
  },
  addStorage() {
    return {
      ...this.parent?.(),
      markdown: {
        parser: {
          match: (node: any) => node.type === 'inlineCode',
          apply: (state: any, node: any, type: any) => {
            state.openMark(type)
            state.addText(node.value)
            state.closeMark(type)
          },
        },
        serializer: {
          match: (mark: any) => mark.type.name === this.name,
          apply: (state: any, _mark: any, node: any) => {
            state.addNode({
              type: 'inlineCode',
              value: node.text ?? '',
            })
            return true
          },
        },
      },
      floatMenu: {
        items: [
          {
            id: this.name,
            name: this.options.dictionary.name,
            icon: icon('code'),
            shortcut: 'Mod-E',
            active: (editor: any) => editor.isActive(this.name),
            action: (editor: any) => editor.chain().toggleCode().focus().run(),
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
