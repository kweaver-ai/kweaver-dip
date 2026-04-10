import {
  Heading as THeading,
  type HeadingOptions as THeadingOptions,
} from '@tiptap/extension-heading'
import type { BlockMenuItemStorage, ClickMenuItemStorage, NodeMarkdownStorage } from '../types'
import { icon } from '../utils/icons'

export interface HeadingOptions extends THeadingOptions {
  dictionary: {
    name: string
  }
}

export const Heading = THeading.extend<HeadingOptions>({
  name: 'heading',
  addOptions() {
    return {
      ...this.parent?.(),
      levels: [1, 2, 3, 4, 5, 6],
      HTMLAttributes: {},
      dictionary: {
        name: '标题',
      },
    }
  },
  addStorage() {
    return {
      ...this.parent?.(),
      markdown: {
        parser: {
          match: (node: any) => node.type === 'heading',
          apply: (state: any, node: any, type: any) => {
            const depth = node.depth as number
            state.openNode(type, { level: depth })
            state.next(node.children)
            state.closeNode()
          },
        },
        serializer: {
          match: (node: any) => node.type.name === this.name,
          apply: (state: any, node: any) => {
            state.openNode({
              type: 'heading',
              depth: node.attrs.level,
            })
            state.next(node.content)
            state.closeNode()
          },
        },
      },
      blockMenu: {
        items: ([1, 2, 3, 4, 5, 6] as const).map((level) => {
          const levelNames = ['一级', '二级', '三级', '四级', '五级', '六级']
          return {
            id: `${this.name}${level}`,
            name: `${levelNames[level - 1]}${this.options.dictionary.name}`,
            icon: icon(`h${level}`),
            shortcut: `Mod-Alt-${level}`,
            keywords: `heading${level},title${level},bt${level}`,
            action: (editor: any) => editor.chain().toggleHeading({ level }).focus().run(),
          }
        }),
      },
      clickMenu: {
        items: ([1, 2, 3] as const).map((level) => {
          const levelNames = ['一级', '二级', '三级']
          return {
            id: `${this.name}${level}`,
            name: `${levelNames[level - 1]}${this.options.dictionary.name}`,
            icon: icon(`h${level}`),
            action: (editor: any) => editor.chain().toggleHeading({ level }).focus().run(),
          }
        }),
      },
    } satisfies BlockMenuItemStorage & ClickMenuItemStorage & NodeMarkdownStorage
  },
})
