import { markInputRule, markPasteRule } from '@tiptap/core'
import { Italic as TItalic, type ItalicOptions as TItalicOptions } from '@tiptap/extension-italic'
import type { FloatMenuItemStorage, MarkMarkdownStorage } from '../types'
import { icon } from '../utils/icons'

const STAR_INPUT_REGEX = /(?:^|[^*])(\*(?!\s+\*)([^*]+)\*)$/
const STAR_PASTE_REGEX = /(?:^|[^*])(\*(?!\s+\*)([^*]+)\*(?!\s+\*))/g
const UNDERSCORE_INPUT_REGEX = /(?:^|[^_])(_(?!\s+_)([^_]+)_)$/
const UNDERSCORE_PASTE_REGEX = /(?:^|[^_])(_(?!\s+_)([^_]+)_(?!\s+_))/g

export interface ItalicOptions extends TItalicOptions {
  dictionary: {
    name: string
  }
}

export const Italic = TItalic.extend<ItalicOptions>({
  name: 'italic',
  addOptions() {
    return {
      ...this.parent?.(),
      HTMLAttributes: {},
      dictionary: {
        name: '斜体',
      },
    }
  },
  addStorage() {
    return {
      ...this.parent?.(),
      markdown: {
        parser: {
          match: (node: any) => node.type === 'emphasis',
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
              type: 'emphasis',
            })
          },
        },
      },
      floatMenu: {
        items: [
          {
            id: this.name,
            name: this.options.dictionary.name,
            icon: icon('italic'),
            shortcut: 'Mod-I',
            active: (editor: any) => editor.isActive(this.name),
            action: (editor: any) => editor.chain().toggleItalic().focus().run(),
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
