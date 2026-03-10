import { Extension } from '@tiptap/core'
import { DragHandlePlugin, defaultComputePositionConfig } from '@tiptap/extension-drag-handle'
import { NodeSelection, Plugin, PluginKey } from '@tiptap/pm/state'
import tippy, { type Instance } from 'tippy.js'
import { icon } from '../../utils/icons'
import { renderMenu } from '../../utils/menu'

export interface DragHandleOptions {
  items: Array<string | '|'>
  nested?: any
  computePositionConfig?: any
}

export const CustomDragHandle = Extension.create<DragHandleOptions>({
  name: 'customDragHandle',

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
        'orderedList',
        'bulletList',
        'taskList',
        '|',
        'blockquote',
        'codeBlock',
      ],
      nested: false,
      computePositionConfig: {},
    }
  },

  addStorage() {
    return {
      node: null as any,
      pos: -1,
    }
  },

  addProseMirrorPlugins() {
    const { editor, options, storage } = this

    const element = document.createElement('div')
    element.classList.add('dip-prose-mirror-cm')
    // 初始状态隐藏，只在鼠标悬浮时显示
    element.style.opacity = '0'
    element.style.pointerEvents = 'none'

    // 显示拖拽手柄
    const showElement = () => {
      if (storage.node && storage.pos !== -1) {
        element.style.opacity = '1'
        element.style.pointerEvents = 'auto'
      }
    }

    // 隐藏拖拽手柄
    const hideElement = () => {
      element.style.opacity = '0'
      element.style.pointerEvents = 'none'
    }

    // Plus button
    const plus = document.createElement('div')
    plus.innerHTML = icon('plus')
    plus.classList.add('dip-prose-mirror-cm-plus')
    plus.addEventListener('click', (e) => {
      e.stopPropagation()
      e.preventDefault()

      const { node, pos } = storage

      if (node && pos !== -1) {
        // The pos from onNodeChange is the absolute start of the node.
        // We want to insert AFTER the node, so we use pos + node.nodeSize.
        const targetPos = pos + node.nodeSize
        const docSize = editor.state.doc.content.size
        const safeInsertPos = Math.min(targetPos, docSize)

        editor
          .chain()
          .insertContentAt(safeInsertPos, { type: 'paragraph' })
          .setTextSelection(safeInsertPos + 1)
          .focus()
          .run()
      }
    })

    // Drag handle
    const drag = document.createElement('div')
    drag.innerHTML = icon('drag')
    drag.classList.add('dip-prose-mirror-cm-drag')
    drag.setAttribute('data-drag-handle', '') // Required by official extension

    let menuInstance: Instance | undefined

    drag.addEventListener('click', (e) => {
      e.stopPropagation()
      e.preventDefault()

      if (menuInstance) {
        menuInstance.destroy()
        menuInstance = undefined
        return
      }

      const { node, pos } = storage

      if (!node || pos === -1) return

      // Use the provided position directly as it's the node start position from onNodeChange
      // Ensure the position is within valid range [0, doc.content.size]
      const docSize = editor.state.doc.content.size
      const safePos = Math.max(0, Math.min(pos, docSize))

      if (safePos > docSize) return

      // Select the node before showing menu
      try {
        const selection = NodeSelection.create(editor.state.doc, safePos)
        // Ensure we are selecting the block node, especially if focus was inside an inner editor
        editor.view.dispatch(
          editor.state.tr.setSelection(selection).setStoredMarks([]).scrollIntoView(),
        )
        editor.view.focus()

        const root = document.createElement('div')
        root.classList.add('dip-prose-mirror-cm-menu')

        const resolvedPos = editor.state.doc.resolve(safePos)

        // 根据节点类型过滤菜单项
        let filteredItems = options.items
        const nodeType = node.type.name

        // 对于 atom 节点（agent、knowledge、metric）和 horizontalRule，只保留复制和删除
        // 因为这些节点不应该被转换为其他类型（如 paragraph、heading 等）
        if (
          nodeType === 'horizontalRule' ||
          nodeType === 'agent' ||
          nodeType === 'knowledge' ||
          nodeType === 'metric'
        ) {
          filteredItems = ['copyBlock', 'deleteBlock']
        }

        renderMenu({
          editor,
          root,
          active: { node, pos: resolvedPos },
          selection,
          items: filteredItems,
          onClose: () => {
            if (menuInstance) {
              menuInstance.destroy()
              menuInstance = undefined
            }
          },
        })

        menuInstance = tippy(document.body, {
          appendTo: () => document.body,
          getReferenceClientRect: () => drag.getBoundingClientRect(),
          content: root,
          arrow: false,
          interactive: true,
          showOnCreate: true,
          theme: 'dip-prose-mirror',
          animation: 'shift-away',
          trigger: 'manual',
          placement: 'left-start',
          maxWidth: 'none',
          offset: [0, 35],
          zIndex: 999,
          onHide: () => {
            menuInstance = undefined
          },
        })
      } catch (error) {
        console.error('[CustomDragHandle] Failed to create selection or render menu', error)
      }
    })

    element.append(plus)
    element.append(drag)

    // Normalize nested options to match what the plugin expects
    let nestedOptions: any
    if (options.nested === true) {
      nestedOptions = {
        enabled: true,
        rules: [],
        defaultRules: true,
        edgeDetection: { edges: ['left', 'top'], threshold: 12, strength: 500 },
      }
    } else if (typeof options.nested === 'object' && options.nested !== null) {
      nestedOptions = {
        enabled: true,
        rules: options.nested.rules ?? [],
        defaultRules: options.nested.defaultRules ?? true,
        allowedContainers: options.nested.allowedContainers,
        edgeDetection: options.nested.edgeDetection ?? {
          edges: ['left', 'top'],
          threshold: 12,
          strength: 500,
        },
      }
    } else {
      nestedOptions = {
        enabled: false,
        rules: [],
        defaultRules: true,
        edgeDetection: { edges: [], threshold: 0, strength: 0 },
      }
    }

    const pluginResult = DragHandlePlugin({
      editor,
      element,
      computePositionConfig: {
        ...defaultComputePositionConfig,
        ...options.computePositionConfig,
      },
      nestedOptions,
      onNodeChange: ({ node, pos }) => {
        storage.node = node
        storage.pos = pos
      },
    })

    // 监听编辑器DOM的鼠标悬浮事件
    const editorDOM = editor.view.dom
    let currentHoveredNode: HTMLElement | null = null

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target) return

      // Find the closest block-level node element
      let nodeElement: HTMLElement | null = target
      while (nodeElement && nodeElement !== editorDOM) {
        // Check if the element is considered a "block" in our context
        const computedStyle = window.getComputedStyle(nodeElement)
        const display = computedStyle.display
        const isBlock =
          display === 'block' ||
          display === 'flex' ||
          display === 'grid' ||
          display === 'list-item' || // Correctly handle list items
          nodeElement.tagName === 'LI' ||
          nodeElement.hasAttribute('data-type') ||
          nodeElement.classList.contains('ProseMirror-selectednode')

        if (isBlock) {
          const pos = editor.view.posAtDOM(nodeElement, 0)
          if (pos !== null && pos >= 0) {
            const { doc } = editor.state
            const $pos = doc.resolve(pos)

            // Get the block node at the appropriate depth
            let depth = $pos.depth
            let node = $pos.node(depth)

            // If we are hovering an atom node or a node with data-type,
            // we might want that specific node.
            if (node.type.name === 'doc' && $pos.nodeAfter) {
              node = $pos.nodeAfter
              storage.node = node
              storage.pos = pos
            } else {
              // Traverse up to find the closest block node that is not the document
              while (depth > 0 && !node.isBlock) {
                depth--
                node = $pos.node(depth)
              }

              if (node && node.type.name !== 'doc') {
                storage.node = node
                // Use .before(depth) to get the position before the block node
                storage.pos = $pos.before(depth)
              } else {
                storage.node = node
                storage.pos = pos
              }
            }

            currentHoveredNode = nodeElement
            showElement()
            return
          }
        }
        nodeElement = nodeElement.parentElement
      }
    }

    const handleMouseOut = (e: MouseEvent) => {
      // 检查鼠标是否真的离开了编辑器区域或当前节点
      const relatedTarget = e.relatedTarget as HTMLElement

      // 获取鼠标当前实际位置下的元素（包括内边距区域）
      const elementAtPoint = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement

      // 如果鼠标移到了拖拽手柄上，不隐藏
      if (elementAtPoint && element.contains(elementAtPoint)) {
        return
      }

      // 检查鼠标是否仍在编辑器DOM内（包括内边距区域）
      const mouseInEditor = elementAtPoint ? editorDOM.contains(elementAtPoint) : false

      if (!relatedTarget) {
        // 如果鼠标仍在编辑器DOM内（包括内边距区域），不隐藏
        if (mouseInEditor) {
          return
        }
        hideElement()
        currentHoveredNode = null
        return
      }

      // 如果鼠标移到了拖拽手柄元素上，不隐藏
      if (element.contains(relatedTarget)) {
        return
      }

      const relatedInEditor = editorDOM.contains(relatedTarget)

      // 如果鼠标仍在编辑器内（包括内边距区域），不隐藏
      if (mouseInEditor) {
        return
      }

      // 如果relatedTarget仍在编辑器内，不隐藏
      if (relatedInEditor) {
        return
      }

      // 鼠标真正离开了编辑器区域，隐藏
      hideElement()
      currentHoveredNode = null
    }

    // 当鼠标进入拖拽手柄时保持显示
    const handleElementMouseEnter = () => {
      if (storage.node && storage.pos !== -1) {
        showElement()
      }
    }

    // 当鼠标离开拖拽手柄时隐藏
    const handleElementMouseLeave = (e: MouseEvent) => {
      const relatedTarget = e.relatedTarget as HTMLElement
      // 如果鼠标移回了编辑器节点，不隐藏（会由handleMouseOver处理显示）
      if (relatedTarget && currentHoveredNode?.contains(relatedTarget)) {
        return
      }
      // 如果鼠标移回了编辑器，不隐藏（会由handleMouseOver处理）
      if (relatedTarget && editorDOM.contains(relatedTarget)) {
        return
      }
      // 否则隐藏
      hideElement()
      currentHoveredNode = null
    }

    editorDOM.addEventListener('mouseover', handleMouseOver)
    editorDOM.addEventListener('mouseout', handleMouseOut)
    element.addEventListener('mouseenter', handleElementMouseEnter)
    element.addEventListener('mouseleave', handleElementMouseLeave)

    // 创建辅助插件来管理事件监听器的清理
    const plugins = [
      pluginResult.plugin,
      new Plugin({
        key: new PluginKey('customDragHandle-cleanup'),
        view: () => ({
          destroy: () => {
            editorDOM.removeEventListener('mouseover', handleMouseOver)
            editorDOM.removeEventListener('mouseout', handleMouseOut)
            element.removeEventListener('mouseenter', handleElementMouseEnter)
            element.removeEventListener('mouseleave', handleElementMouseLeave)
          },
        }),
      }),
    ]

    return plugins
  },
})
