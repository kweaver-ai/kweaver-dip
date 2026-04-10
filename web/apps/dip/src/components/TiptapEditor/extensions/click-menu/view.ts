import type { Editor } from '@tiptap/core'
import type { Node, ResolvedPos } from '@tiptap/pm/model'
import { NodeSelection, TextSelection } from '@tiptap/pm/state'
import type { EditorProps } from '@tiptap/pm/view'
import tippy, { type Instance, type PopperElement, type Props } from 'tippy.js'
import { icon } from '../../utils/icons'
import { serializeForClipboard } from '../../utils/serialize'

export interface ClickMenuViewOptions {
  editor: Editor
  tippy?: Partial<Props>
  onMenu?: (props: {
    editor: Editor
    view: ClickMenuView
    root: PopperElement
    active: ClickMenuActiveOptions
    selection: NodeSelection
  }) => void
  onInit?: (props: { editor: Editor; view: ClickMenuView; root: HTMLElement }) => void
  onMount?: (props: { editor: Editor; view: ClickMenuView; root: HTMLElement }) => void
  onDestroy?: (props: { editor: Editor; view: ClickMenuView; root: HTMLElement }) => void
  classes?: Array<string>
  attributes?: Record<string, string>
}

export interface ClickMenuActiveOptions {
  node: Node
  pos: ResolvedPos
  dom: HTMLElement
}

export class ClickMenuView {
  private readonly editor: Editor
  private readonly popover: Instance
  private readonly element: HTMLElement
  private readonly options: ClickMenuViewOptions

  private _menu: Instance | undefined
  private _timer: number | undefined
  private _active: ClickMenuActiveOptions | undefined
  private _dragging: boolean | undefined
  private _selection: NodeSelection | undefined
  private _scrollHandler: (() => void) | undefined
  private _dragStartPos: { from: number; to: number } | undefined

  constructor(options: ClickMenuViewOptions) {
    this.editor = options.editor
    this.options = options
    this.element = this._element()
    this.popover = this._popover()

    // 使用 update 事件确保 DOM 已准备好后再设置滚动监听
    this.editor.once('update', () => {
      this._setupScrollListener()
      // 调用 onInit 回调（如果提供）
      this.options.onInit?.({ editor: this.editor, view: this, root: this.element })
    })
  }

  private _setupScrollListener() {
    // 查找滚动容器（.tiptap-scroll-container）
    let element = this.editor.view.dom.parentElement

    while (element) {
      if (element.classList.contains('tiptap-scroll-container')) {
        break
      }
      element = element.parentElement
    }

    if (!element) return

    this._scrollHandler = () => {
      this.hide('both')
    }

    element.addEventListener('scroll', this._scrollHandler, { passive: true })
  }

  public show(active: ClickMenuActiveOptions) {
    if (active.node.type.name === 'listItem') {
      this.popover.setProps({
        getReferenceClientRect: () => active.dom.getBoundingClientRect(),
        offset: [0, 30],
      })
    } else {
      this.popover.setProps({
        getReferenceClientRect: () => active.dom.getBoundingClientRect(),
        offset: [0, 10],
      })
    }
    if (this._active?.dom !== active.dom) {
      this.popover.hide()
    }
    this._active = active
    this.popover.show()
  }

  public hide(mode?: 'button' | 'menu' | 'both') {
    if (mode !== 'menu') {
      this.popover.hide()
    }
    if (mode !== 'button' && this._menu) {
      this._menu.destroy()
    }

    // 清除选中状态
    if (mode === 'both' && this._selection) {
      const { state, view } = this.editor

      // 如果当前是节点选择，则转换为文本选择并聚焦到块的末尾
      if (state.selection instanceof NodeSelection) {
        const node = state.selection.node
        const from = state.selection.from

        // 计算节点内容的末尾位置
        // from 是节点开始位置（节点的开标签之前）
        // from + node.nodeSize 是节点结束后的位置（节点的闭标签之后）
        // from + node.nodeSize - 1 是节点的闭标签位置
        // 我们需要找到节点内容的最后一个有效位置
        const endPos = from + node.nodeSize - 1

        // TextSelection.near 会自动找到最近的有效文本位置
        // -1 表示优先向后（文档末尾方向）查找
        const $endPos = state.doc.resolve(endPos)
        const textSelection = TextSelection.near($endPos, -1)
        view.dispatch(state.tr.setSelection(textSelection))
      }

      this._selection = undefined
    }
  }

  public destroy() {
    if (this.options.onDestroy) {
      this.options.onDestroy({
        view: this,
        root: this.element,
        editor: this.editor,
      })
    }

    // 移除滚动监听器
    if (this._scrollHandler) {
      let element = this.editor.view.dom.parentElement

      while (element) {
        if (element.classList.contains('tiptap-scroll-container')) {
          break
        }
        element = element.parentElement
      }

      if (element) {
        element.removeEventListener('scroll', this._scrollHandler)
      }
    }

    this.popover.destroy()
    this.element.remove()
  }

  public events(): EditorProps['handleDOMEvents'] {
    return {
      drop: (view, event) => {
        // 如果是移动操作，完全自己处理拖拽逻辑
        if (this._dragging && view.dragging?.move && this._dragStartPos && this._selection) {
          event.preventDefault()

          const { state } = view
          const { from, to } = this._dragStartPos
          const slice = this._selection.content()

          // 获取 drop 位置
          const dropPos = view.posAtCoords({ left: event.clientX, top: event.clientY })

          if (!dropPos) {
            // 无法获取 drop 位置，取消拖拽
            this._dragging = false
            view.dragging = null
            this._selection = undefined
            this._dragStartPos = undefined
            return true
          }

          const dropPosValue = dropPos.pos

          // 检查是否拖拽到了新位置（不是原位置）
          if (dropPosValue < from || dropPosValue > to) {
            const tr = state.tr

            // 先删除原节点
            tr.delete(from, to)

            // 计算新插入位置（删除后位置会变化）
            let insertPos = dropPosValue
            if (dropPosValue > from) {
              // 如果拖拽到原节点之后，删除后位置需要减去原节点长度
              insertPos = dropPosValue - (to - from)
            }

            // 在新位置插入
            tr.replace(insertPos, insertPos, slice)

            // 应用 transaction
            view.dispatch(tr)
          }

          // 清除拖拽状态
          view.dragging = null
          this._selection = undefined
          this._dragStartPos = undefined
          this._dragging = false

          return true // 阻止默认行为
        }

        this._dragging = false
        return false // 让 ProseMirror 处理其他情况
      },
      keydown: () => {
        this.hide()
      },
      dragenter: () => {
        this._dragging = true
      },
      dragleave: () => {
        this._dragging = false
        this._dragStartPos = undefined
      },
      dragover: (_view, event) => {
        if (this._dragging) {
          const view = this.editor.view
          const root = view.dom.parentElement

          if (!root) {
            return
          }

          const rect = root.getBoundingClientRect()

          if (root.scrollHeight > root.clientHeight) {
            if (root.scrollTop > 0 && Math.abs(event.y - rect.y) < 20) {
              root.scrollTop = root.scrollTop > 10 ? root.scrollTop - 10 : 0
              return
            }
            if (
              Math.round(root.scrollTop + rect.height) <
                Math.round(view.dom.getBoundingClientRect().height) &&
              Math.abs(event.y - (rect.height + rect.y)) < 20
            ) {
              root.scrollTop = root.scrollTop + 10
            }
          }
        }
      },
      mousemove: (_view, event) => {
        const { view } = this.editor
        if (view.composing || !view.editable || !event.target) {
          return false
        }
        clearTimeout(this._timer)
        // @ts-expect-error
        this._timer = setTimeout(() => {
          const active = this._find(event)
          if (active) {
            this.show(active)
          } else {
            this.hide('button')
          }
        }, 8)
        return false
      },
    }
  }

  private _element() {
    const element = document.createElement('div')
    element.classList.add('dip-prose-mirror-cm')
    for (const clazz of this.options.classes ?? []) {
      element.classList.add(clazz)
    }
    for (const [key, val] of Object.entries(this.options.attributes ?? {})) {
      element.setAttribute(key, val)
    }

    const plus = document.createElement('div')
    plus.innerHTML = icon('plus')
    plus.classList.add('dip-prose-mirror-cm-plus')
    plus.addEventListener('click', () => {
      if (this._active) {
        const { pos, node } = this._active
        this.editor
          .chain()
          .insertContentAt(pos.pos - (node.isLeaf ? 0 : 1) + node.nodeSize, { type: 'paragraph' })
          .focus()
          .run()
      }
    })

    const drag = document.createElement('div')
    drag.innerHTML = icon('drag')
    drag.classList.add('dip-prose-mirror-cm-drag')
    drag.draggable = true
    drag.addEventListener('mouseup', () => {
      if (!this._dragging) {
        requestAnimationFrame(() => {
          this.editor.view.focus()
        })
        return
      }
      this._dragging = false
      this._selection = undefined
      this._dragStartPos = undefined
    })
    drag.addEventListener('mousedown', () => {
      const { state, view } = this.editor
      const active = this._active
      if (active && NodeSelection.isSelectable(active.node)) {
        const selection = NodeSelection.create(
          state.doc,
          active.pos.pos - (active.node.isLeaf ? 0 : 1),
        )
        view.dispatch(state.tr.setSelection(selection))
        view.focus()
        this._selection = selection
      }
    })
    drag.addEventListener('dragstart', (e) => {
      this._dragging = true
      const view = this.editor.view
      const selection = this._selection
      if (e.dataTransfer && selection) {
        const slice = selection.content()
        view.dragging = { slice, move: true }
        // 保存原节点位置，以便在滚动后仍能删除
        this._dragStartPos = { from: selection.from, to: selection.to }
        const { dom, text } = serializeForClipboard(view, slice)
        e.dataTransfer.effectAllowed = 'copyMove'
        e.dataTransfer.clearData()
        e.dataTransfer.setData('text/html', dom.innerHTML)
        e.dataTransfer.setData('text/plain', text)
      }
    })
    drag.addEventListener('click', () => {
      if (this._menu) {
        this._menu.destroy()
      }
      if (!(this._active && this._selection) || this._dragging || !this.options.onMenu) {
        return
      }
      const root = document.createElement('div')
      root.classList.add('dip-prose-mirror-cm-menu')
      this.options.onMenu({
        root,
        view: this,
        editor: this.editor,
        active: this._active,
        selection: this._selection,
      })
      this._menu = tippy(document.body, {
        appendTo: () => document.body,
        getReferenceClientRect: () => this._active?.dom.getBoundingClientRect() ?? new DOMRect(),
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
      })
    })

    element.append(plus)
    element.append(drag)
    if (this.options.onInit) {
      this.options.onInit({
        view: this,
        root: element,
        editor: this.editor,
      })
    }
    return element
  }

  private _popover() {
    return tippy(document.body, {
      appendTo: () => document.body,
      getReferenceClientRect: null,
      content: this.element,
      arrow: false,
      interactive: true,
      hideOnClick: false,
      theme: 'dip-prose-mirror-none',
      animation: 'shift-away',
      trigger: 'manual',
      placement: 'left-start',
      maxWidth: 'none',
      offset: [0, 10],
      zIndex: 998,
      ...this.options.tippy,
      onMount: (i) => {
        if (this.options.tippy?.onMount) {
          this.options.tippy.onMount(i)
        }
        if (this.element && this.options.onMount) {
          this.options.onMount({
            view: this,
            root: this.element,
            editor: this.editor,
          })
        }
      },
    })
  }

  private _find(event: HTMLElementEventMap['mousemove']) {
    const { view } = this.editor

    if (view.composing || !view.editable || !event.target || !view.dom.parentElement) {
      return undefined
    }

    let pos = 0
    let node = document.elementFromPoint(event.x + 70, event.y)
    if (!node || node === view.dom) {
      node = event.target as Element | null
    }
    if (!node || node === view.dom) {
      node = document.elementFromPoint(event.x, event.y)
    }
    if (node) {
      pos = view.posAtDOM(node, 0)
    }
    if (pos <= 0) {
      return undefined
    }

    let _pos = view.state.doc.resolve(pos)
    let _node = _pos.node()

    if (_node.type.name === 'doc') {
      const node = view.state.doc.nodeAt(pos)
      if (!node) {
        return undefined
      }
      _node = node
    }

    while (
      _node &&
      (this._nodeIsNotBlock(_node) || this._nodeIsDisabled(_node) || this._nodeIsFirstChild(_pos))
    ) {
      _pos = view.state.doc.resolve(_pos.before())
      _node = _pos.node()
    }

    _pos =
      _pos.pos - _pos.parentOffset === 0
        ? _pos
        : view.state.doc.resolve(_pos.pos - _pos.parentOffset)

    let _dom = view.nodeDOM(_pos.pos) as HTMLElement | undefined
    if (!_dom) {
      _dom = view.nodeDOM(_pos.pos - 1) as HTMLElement | undefined
    }

    while (
      _dom?.parentElement &&
      _dom.parentElement !== view.dom.parentElement &&
      _pos.pos === view.posAtDOM(_dom.parentElement, 0)
    ) {
      _dom = _dom.parentElement
    }

    if (!_dom) {
      return undefined
    }

    return { node: _node, pos: _pos, dom: _dom }
  }

  private _nodeIsDisabled(node: Node) {
    return (this.editor.storage as unknown as Record<string, any>)[node.type.name]?.clickMenu?.hide
  }

  private _nodeIsNotBlock(node: Node) {
    return !node.type.isBlock || node.type.name === 'doc'
  }

  private _nodeIsFirstChild(pos: ResolvedPos) {
    let parent = pos.parent
    const node = pos.node()
    if (parent === node) {
      parent = pos.node(pos.depth - 1)
    }
    if (!parent || parent.type.name === 'doc' || parent.type.name === 'detailsContent') {
      return false
    }
    return parent.firstChild === node
  }
}
