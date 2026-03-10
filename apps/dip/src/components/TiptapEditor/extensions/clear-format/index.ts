import { Extension } from '@tiptap/core'
import type { ClickMenuItemStorage } from '../../types'
import { icon } from '../../utils/icons'

export const ClearFormat = Extension.create({
  name: 'clearFormat',

  addOptions() {
    return {
      dictionary: {
        name: '清除格式',
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
            action: (editor: any) => {
              editor.chain().clearNodes().unsetAllMarks().focus().run()
            },
          },
        ],
      },
    } satisfies ClickMenuItemStorage
  },
})
