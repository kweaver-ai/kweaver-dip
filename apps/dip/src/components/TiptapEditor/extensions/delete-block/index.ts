import { Extension } from '@tiptap/core'
import type { ClickMenuItemStorage } from '../../types'
import { icon } from '../../utils/icons'

/** 删除节点 */
export const DeleteBlock = Extension.create({
  name: 'deleteBlock',

  addOptions() {
    return {
      dictionary: {
        name: '删除',
      },
    }
  },

  addStorage() {
    return {
      clickMenu: {
        items: [
          {
            id: this.name,
            name: this.options.dictionary.name,
            icon: icon('remove'),
            action: (editor: any, context?: any) => {
              const selection = context?.selection
              if (selection) {
                editor.chain().deleteRange({ from: selection.from, to: selection.to }).focus().run()
              } else {
                editor.chain().deleteSelection().focus().run()
              }
            },
          },
        ],
      },
    } satisfies ClickMenuItemStorage
  },
})
