import {
  ListItem as TListItem,
  type ListItemOptions as TListItemOptions,
} from '@tiptap/extension-list-item'

export interface ListItemOptions extends TListItemOptions {}

export const ListItem = TListItem.extend<ListItemOptions>({
  name: 'listItem',
  addStorage() {
    return {
      ...this.parent?.(),
      markdown: {
        parser: {
          match: (node: any) => node.type === 'listItem' && node.checked === null,
          apply: (state: any, node: any, type: any) => {
            state.openNode(type)
            state.next(node.children)
            state.closeNode()
          },
        },
        serializer: {
          match: (node: any) => node.type.name === this.name,
          apply: (state: any, node: any) => {
            state.openNode({ type: 'listItem' })
            state.next(node.content)
            state.closeNode()
          },
        },
      },
    }
  },
})
