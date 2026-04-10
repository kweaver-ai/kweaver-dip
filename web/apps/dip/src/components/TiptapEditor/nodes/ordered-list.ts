import {
  OrderedList as TOrderedList,
  type OrderedListOptions as TOrderedListOptions,
} from '@tiptap/extension-ordered-list'
import type { BlockMenuItemStorage, ClickMenuItemStorage, NodeMarkdownStorage } from '../types'
import { icon } from '../utils/icons'

export interface OrderedListOptions extends TOrderedListOptions {
  dictionary: {
    name: string
  }
}

export const OrderedList = TOrderedList.extend<OrderedListOptions>({
  name: 'orderedList',
  addOptions() {
    return {
      ...this.parent?.(),
      itemTypeName: 'listItem',
      HTMLAttributes: {},
      keepMarks: false,
      keepAttributes: false,
      dictionary: {
        name: '有序列表',
      },
    }
  },
  addStorage() {
    return {
      ...this.parent?.(),
      markdown: {
        parser: {
          match: (node: any) => node.type === 'list' && !!node.ordered,
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
              ordered: true,
              start: 1,
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
            icon: icon('ol'),
            shortcut: 'Mod-Shift-7',
            keywords: 'orderedlist,ol,yxlb',
            action: (editor: any) => editor.chain().toggleOrderedList().focus().run(),
          },
        ],
      },
      clickMenu: {
        items: [
          {
            id: this.name,
            name: this.options.dictionary.name,
            icon: icon('ol'),
            action: (editor: any) => editor.chain().toggleOrderedList().focus().run(),
          },
        ],
      },
    } satisfies BlockMenuItemStorage & ClickMenuItemStorage & NodeMarkdownStorage
  },
})
