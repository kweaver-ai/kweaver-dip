import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { renderMenu } from '../../utils/menu'
import { ClickMenuView } from './view'

export interface ClickMenuOptions {
  items: Array<string | '|'>
}

export const ClickMenu = Extension.create<ClickMenuOptions>({
  name: 'clickMenu',

  addOptions() {
    return {
      items: [
        'copyBlock',
        'deleteBlock',
        '|',
        'paragraph',
        'heading1',
        'heading2',
        'heading3',
        '|',
        'bulletList',
        'orderedList',
        'taskList',
        '|',
        'blockquote',
        'codeBlock',
      ],
    }
  },

  addProseMirrorPlugins() {
    const view = new ClickMenuView({
      editor: this.editor,
      onMenu: ({ root, editor, active, selection, view }) => {
        renderMenu({
          editor,
          root,
          active,
          selection,
          items: this.options.items,
          onClose: () => view.hide('both'),
        })
      },
    })

    return [
      new Plugin({
        key: new PluginKey(`${this.name}-click-menu`),
        view: () => ({ destroy: () => view.destroy() }),
        props: { handleDOMEvents: view.events() },
      }),
    ]
  },
})
