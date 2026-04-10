import {
  BulletList as TBulletList,
  type BulletListOptions as TBulletListOptions,
} from '@tiptap/extension-bullet-list'
import type { BlockMenuItemStorage, ClickMenuItemStorage, NodeMarkdownStorage } from '../types'
import { icon } from '../utils/icons'

export interface BulletListOptions extends TBulletListOptions {
  dictionary: {
    name: string
  }
}

export const BulletList = TBulletList.extend<BulletListOptions>({
  name: 'bulletList',
  addOptions() {
    return {
      ...this.parent?.(),
      itemTypeName: 'listItem',
      HTMLAttributes: {},
      keepMarks: false,
      keepAttributes: false,
      dictionary: {
        name: '无序列表',
      },
    }
  },
  addStorage() {
    return {
      ...this.parent?.(),
      markdown: {
        parser: {
          match: (node: any) =>
            node.type === 'list' &&
            !node.ordered &&
            !node.children?.find((item: any) => item.checked !== null),
          apply: (state: any, node: any, type: any) => {
            state.openNode(type)
            state.next(node.children)
            state.closeNode()
          },
        },
        serializer: {
          match: (node: any) => node.type.name === this.name,
          apply: (state: any, node: any) => {
            state.openNode({
              type: 'list',
              ordered: false,
            })
            state.next(node.content)
            state.closeNode()
          },
        },
      },
      blockMenu: {
        items: [
          {
            id: this.name,
            name: this.options.dictionary.name,
            icon: icon('ul'),
            shortcut: 'Mod-Shift-8',
            keywords: 'bulletlist,bl,ul,wxlb',
            action: (editor: any) => editor.chain().toggleBulletList().focus().run(),
          },
        ],
      },
      clickMenu: {
        items: [
          {
            id: this.name,
            name: this.options.dictionary.name,
            icon: icon('ul'),
            action: (editor: any) => editor.chain().toggleBulletList().focus().run(),
          },
        ],
      },
    } satisfies BlockMenuItemStorage & ClickMenuItemStorage & NodeMarkdownStorage
  },
})
