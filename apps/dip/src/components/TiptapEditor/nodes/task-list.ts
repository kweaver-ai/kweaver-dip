import {
  TaskList as TTaskList,
  type TaskListOptions as TTaskListOptions,
} from '@tiptap/extension-task-list'
import type { BlockMenuItemStorage, ClickMenuItemStorage, NodeMarkdownStorage } from '../types'
import { icon } from '../utils/icons'

export interface TaskListOptions extends TTaskListOptions {
  dictionary: {
    name: string
  }
}

export const TaskList = TTaskList.extend<TaskListOptions>({
  name: 'taskList',
  addOptions() {
    const parentOptions = this.parent?.() || {}
    return {
      itemTypeName: 'taskItem',
      HTMLAttributes: {},
      ...parentOptions,
      dictionary: {
        name: '任务列表',
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
            node.children?.find((item: any) => item.checked !== null),
          apply: (state: any, node: any, type: any) => {
            state.openNode(type)
            state.next(node.children)
            state.closeNode()
          },
        },
        serializer: {
          match: (node: any) => node.type.name === this.name,
          apply: (state: any, node: any) => {
            state
              .openNode({
                type: 'list',
                ordered: false,
              })
              .next(node.content)
              .closeNode()
          },
        },
      },
      blockMenu: {
        items: [
          {
            id: this.name,
            name: this.options.dictionary.name,
            icon: icon('tl'),
            shortcut: 'Mod-Shift-9',
            keywords: 'tasklist,tl,rwlb',
            action: (editor: any) => editor.chain().toggleTaskList().focus().run(),
          },
        ],
      },
      clickMenu: {
        items: [
          {
            id: this.name,
            name: this.options.dictionary.name,
            icon: icon('tl'),
            action: (editor: any) => editor.chain().toggleTaskList().focus().run(),
          },
        ],
      },
    } satisfies BlockMenuItemStorage & ClickMenuItemStorage & NodeMarkdownStorage
  },
})
