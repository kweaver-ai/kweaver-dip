import { Extension } from '@tiptap/core'
import type { ClickMenuItemStorage } from '../../types'
import { icon } from '../../utils/icons'

export const DuplicateBlock = Extension.create({
  name: 'duplicateBlock',

  addOptions() {
    return {
      dictionary: {
        name: '复制并粘贴',
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
            icon: icon('plus'),
            action: (editor: any, { active }: any) => {
              const { pos, node } = active
              const endPos = pos.pos + node.nodeSize
              editor.chain().insertContentAt(endPos, node.toJSON()).focus().run()
            },
          },
        ],
      },
    } satisfies ClickMenuItemStorage
  },
})
