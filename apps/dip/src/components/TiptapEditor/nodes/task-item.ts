import {
  TaskItem as TTaskItem,
  type TaskItemOptions as TTaskItemOptions,
} from '@tiptap/extension-task-item'

export interface TaskItemOptions extends TTaskItemOptions {}

export const TaskItem = TTaskItem.extend<TaskItemOptions>({
  name: 'taskItem',
  addOptions() {
    const parentOptions = this.parent?.() || {}
    return {
      HTMLAttributes: {},
      taskListTypeName: 'taskList',
      ...parentOptions,
      nested: true,
    }
  },
  addAttributes() {
    return {
      ...this.parent?.(),
      checked: {
        default: false,
        parseHTML: (element) => element.getAttribute('data-checked') === 'true',
        renderHTML: (attributes) => ({
          'data-checked': attributes.checked,
        }),
      },
    }
  },
  addStorage() {
    return {
      ...this.parent?.(),
      markdown: {
        parser: {
          match: (node: any) => node.type === 'listItem' && node.checked !== null,
          apply: (state: any, node: any, type: any) => {
            state.openNode(type, { checked: node.checked as boolean })
            state.next(node.children)
            state.closeNode()
          },
        },
        serializer: {
          match: (node: any) => node.type.name === this.name,
          apply: (state: any, node: any) => {
            state.openNode({
              type: 'listItem',
              checked: node.attrs.checked,
            })
            state.next(node.content)
            state.closeNode()
          },
        },
      },
    }
  },
})
