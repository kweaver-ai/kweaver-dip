import { Extension } from '@tiptap/core'

/**
 * 点击编辑器底部空白区域时，自动添加空段落或聚焦到已有的空段落
 */
export const ClickInBottom = Extension.create({
  name: 'clickInBottom',

  onCreate() {
    const editor = this.editor

    // 等待编辑器首次更新，确保 DOM 已挂载
    const setupListener = () => {
      const wrapper = editor.view.dom.closest('.tiptap-scroll-container') as HTMLElement
      if (!wrapper) return

      const handleClick = (event: MouseEvent) => {
        const clickY = event.clientY

        // 获取编辑器内容区域
        const prosemirrorDom = editor.view.dom
        const contentRect = prosemirrorDom.getBoundingClientRect()

        // 只处理点击在内容区域下方的情况
        if (clickY <= contentRect.bottom) {
          return
        }

        const { state } = editor
        const { doc } = state

        // 获取最后一个节点
        const lastNode = doc.lastChild

        if (!lastNode) {
          // 文档为空，插入一个段落
          editor.commands.insertContentAt(0, { type: 'paragraph' })
          editor.commands.focus('end')
          return
        }

        // 检查最后一个节点是否是空段落
        const isLastNodeEmptyParagraph =
          lastNode.type.name === 'paragraph' && lastNode.content.size === 0

        if (isLastNodeEmptyParagraph) {
          // 最后一个节点是空段落，直接聚焦到那里
          editor.commands.focus('end')
        } else {
          // 最后一个节点不是空段落，添加一个新的空段落并聚焦
          const endPos = doc.content.size
          editor.commands.insertContentAt(endPos, { type: 'paragraph' })
          editor.commands.focus('end')
        }
      }

      wrapper.addEventListener('click', handleClick)

      // 清理监听器
      editor.on('destroy', () => {
        wrapper.removeEventListener('click', handleClick)
      })
    }

    // 使用 update 事件确保 DOM 已准备好
    editor.once('update', setupListener)
  },
})
