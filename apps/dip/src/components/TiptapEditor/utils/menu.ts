import type { Editor } from '@tiptap/core'
import type { NodeSelection } from '@tiptap/pm/state'
import type { ClickMenuItemStorage } from '../types'

export interface ClickMenuItem {
  id: string
  name: string
  icon: string
  action: (editor: Editor, context: any) => void
}

export function renderMenu(props: {
  editor: Editor
  root: HTMLElement
  active: { node: any; pos: any }
  selection: NodeSelection
  items: Array<string | '|'>
  onClose: () => void
}) {
  const { editor, root, active, selection, items, onClose } = props

  // 收集所有菜单项
  const mappings = new Map<string, ClickMenuItem>()
  for (const storage of Object.values(
    editor.storage as unknown as Record<string, ClickMenuItemStorage>,
  )) {
    if (storage?.clickMenu?.items) {
      const storageItems = Array.isArray(storage.clickMenu.items)
        ? storage.clickMenu.items
        : [storage.clickMenu.items]
      for (const item of storageItems) {
        mappings.set(item.id, item)
      }
    }
  }

  // 清空菜单
  root.innerHTML = ''

  // 渲染菜单项
  for (const itemId of items) {
    if (itemId === '|') {
      const divider = document.createElement('div')
      divider.classList.add('dip-prose-mirror-cm-menu-divider')
      root.appendChild(divider)
      continue
    }

    const item = mappings.get(itemId)
    if (!item) continue

    const button = document.createElement('button')
    button.classList.add('dip-prose-mirror-cm-menu-button')

    // 检查是否为当前块类型以进行高亮
    const { node } = active
    let isActive = false
    if (itemId === node.type.name) {
      isActive = true
    } else if (node.type.name === 'heading' && itemId === `heading${node.attrs.level}`) {
      // 特殊处理标题级别
      isActive = true
    }

    if (isActive) {
      button.setAttribute('data-active', 'true')
    }

    button.innerHTML = `
      <div class="dip-prose-mirror-cm-menu-button-icon">${item.icon}</div>
      <div class="dip-prose-mirror-cm-menu-button-name">${item.name}</div>
    `

    button.addEventListener('click', () => {
      item.action(editor, { active, selection })
      onClose()
    })

    root.appendChild(button)
  }
}
