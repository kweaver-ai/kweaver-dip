import { markInputRule, markPasteRule } from '@tiptap/core'
import {
  Highlight as THighlight,
  type HighlightOptions as THighlightOptions,
} from '@tiptap/extension-highlight'
import tippy from 'tippy.js'
import { remarkDecoration } from '../extensions/markdown'
import type { FloatMenuItemStorage, MarkMarkdownStorage } from '../types'
import { colors } from '../utils/colors'
import { icon } from '../utils/icons'

const INPUT_REGEX = /(?:^|[^=])(==(?!\s+==)([^=]+)==)$/
const PASTE_REGEX = /(?:^|[^=])(==(?!\s+==)([^=]+)==(?!\s+==))/g

export interface HighlightOptions extends Omit<THighlightOptions, 'multicolor'> {
  dictionary: Record<(typeof colors)[number][0], string> & {
    name: string
  }
}

export const Highlight = THighlight.extend<HighlightOptions>({
  name: 'highlight',
  addOptions() {
    return {
      ...this.parent?.(),
      HTMLAttributes: {},
      dictionary: {
        name: '高亮',
        none: 'None',
        gray: 'Gray',
        tomato: 'Tomato',
        red: 'Red',
        ruby: 'Ruby',
        crimson: 'Crimson',
        pink: 'Pink',
        plum: 'Plum',
        purple: 'Purple',
        violet: 'Violet',
        iris: 'Iris',
        indigo: 'Indigo',
        blue: 'Blue',
        cyan: 'Cyan',
        teal: 'Teal',
        jade: 'Jade',
        green: 'Green',
        bronze: 'Bronze',
        gold: 'Gold',
        brown: 'Brown',
        orange: 'Orange',
        amber: 'Amber',
        yellow: 'Yellow',
        lime: 'Lime',
        mint: 'Mint',
        sky: 'Sky',
      },
    }
  },
  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: (e: HTMLElement) => e.getAttribute('data-color'),
        renderHTML: (a: any) => (a.color ? { 'data-color': a.color } : {}),
      },
      backgroundColor: {
        default: 'none',
        parseHTML: (e: HTMLElement) => e.getAttribute('data-background-color') || 'none',
        renderHTML: (a: any) => ({
          'data-background-color': a.backgroundColor || 'none',
        }),
      },
    }
  },
  addStorage() {
    const mapping1 = new Map<string, string>()
    const mapping2 = new Map<string, string>()
    for (const [c, k] of colors) {
      mapping1.set(k, c)
      mapping1.set(`b${k}`, `b-${c}`)
      mapping2.set(c, k)
      mapping2.set(`b-${c}`, `b${k}`)
    }
    return {
      ...this.parent?.(),
      markdown: {
        parser: {
          match: (node: any) => node.type === 'highlight',
          apply: (state: any, node: any, type: any) => {
            const value = node.data?.flags ?? ''
            state.openMark(type, { color: mapping1.get(value) })
            state.next(node.children)
            state.closeMark(type)
          },
        },
        serializer: {
          match: (mark: any) => mark.type.name === this.name,
          apply: (state: any, mark: any) => {
            const value = mark.attrs.color ?? ''
            state.withMark(mark, {
              type: 'highlight',
              data: { flags: mapping2.get(value) },
            })
          },
        },
        hooks: {
          beforeInit: (processor: any) =>
            processor.use((remarkDecoration as any)('highlight', '=', true)),
        },
      },
      floatMenu: {
        items: [
          {
            id: this.name,
            render: ({ editor, view, root }: any) => {
              const node = view.createButton({
                id: this.name,
                name: this.options.dictionary.name,
                icon: icon('highlight'),
                shortcut: 'Mod-Shift-H',
              })

              // color picker
              const container1 = document.createElement('div')
              const container2 = document.createElement('div')

              // 字体色按钮
              for (const [colorName] of colors) {
                const button = document.createElement('button')
                button.innerHTML = `<span>A</span>`
                button.setAttribute('data-type', 'color')
                button.setAttribute('data-value', colorName)

                const span = button.querySelector('span')
                if (span) {
                  span.setAttribute('data-color', colorName)
                  span.setAttribute('data-background-color', 'none')
                }

                const popover = document.createElement('span')
                popover.classList.add('dip-prose-mirror-fm-button-popover')
                popover.innerHTML = (this.options.dictionary as any)[colorName]
                tippy(button, {
                  appendTo: () => document.body,
                  content: popover,
                  arrow: false,
                  theme: 'dip-prose-mirror-dark',
                  animation: 'shift-away',
                  duration: [200, 150],
                })

                button.addEventListener('click', (e) => {
                  e.stopPropagation()
                  if (colorName === 'none') {
                    editor.chain().unsetHighlight().run()
                  } else {
                    // 设置字体色，保留现有背景色
                    const currentBackgroundColor =
                      editor.getAttributes(this.name)?.backgroundColor || 'none'
                    editor
                      .chain()
                      .setHighlight({ color: colorName, backgroundColor: currentBackgroundColor })
                      .focus()
                      .run()
                  }
                  // 立即更新按钮状态
                  setTimeout(() => updateButtonStates(), 0)
                })

                container1.append(button)
              }

              // 背景色按钮
              for (const [colorName] of colors) {
                const button = document.createElement('button')
                button.innerHTML = `<span>A</span>`
                button.setAttribute('data-type', 'background')
                button.setAttribute('data-value', colorName)

                const popover = document.createElement('span')
                popover.classList.add('dip-prose-mirror-fm-button-popover')
                popover.innerHTML = `Background ${(this.options.dictionary as any)[colorName]}`
                tippy(button, {
                  appendTo: () => document.body,
                  content: popover,
                  arrow: false,
                  theme: 'dip-prose-mirror-dark',
                  animation: 'shift-away',
                  duration: [200, 150],
                })

                button.addEventListener('click', (e) => {
                  e.stopPropagation()
                  // 设置背景色，保留现有字体色
                  const currentColor = editor.getAttributes(this.name)?.color
                  editor
                    .chain()
                    .setHighlight({ color: currentColor, backgroundColor: colorName })
                    .focus()
                    .run()
                  // 立即更新按钮状态
                  setTimeout(() => updateButtonStates(), 0)
                })

                container2.append(button)
              }

              const pick = document.createElement('div')
              pick.classList.add('dip-prose-mirror-fm-color-picker')
              pick.append(container1)
              pick.append(container2)

              // 更新按钮状态的函数
              const updateButtonStates = () => {
                const attrs = editor.getAttributes(this.name)
                const currentColor = attrs?.color || 'none'
                const currentBackgroundColor = attrs?.backgroundColor || 'none'

                for (const item of Array.from(pick.querySelectorAll(`button[data-type]`))) {
                  const type = item.getAttribute('data-type')
                  const value = item.getAttribute('data-value')
                  let isActive = false

                  if (type === 'color') {
                    // 字体色按钮
                    isActive = value === currentColor
                  } else if (type === 'background') {
                    // 背景色按钮
                    isActive = value === currentBackgroundColor
                  }

                  if (isActive) {
                    item.innerHTML = icon('check')

                    // 为字体色按钮的打勾图标应用颜色
                    if (type === 'color') {
                      const iconSpan = item.querySelector('.dip-prose-mirror-icon')
                      if (iconSpan) {
                        iconSpan.setAttribute('data-color', value || 'none')
                      }
                    }
                  } else {
                    item.innerHTML = `<span>A</span>`

                    // 重新应用样式属性
                    const span = item.querySelector('span')
                    if (span && type === 'color') {
                      span.setAttribute('data-color', value || 'none')
                      span.setAttribute('data-background-color', 'none')
                    }
                  }
                }
              }

              tippy(node, {
                appendTo: () => node,
                content: pick,
                arrow: false,
                interactive: true,
                trigger: 'click',
                hideOnClick: false,
                theme: 'dip-prose-mirror',
                placement: 'bottom-start',
                maxWidth: 'none',
                animation: 'shift-away',
                duration: [200, 150],
                onShow: () => {
                  updateButtonStates()
                },
              })

              if (editor.isActive(this.name)) {
                node.setAttribute('data-active', 'true')
              }

              root.append(node)
            },
            update: ({ editor, root }: any) => {
              const node = root.firstElementChild
              if (!node) return

              if (editor.isActive(this.name)) {
                node.setAttribute('data-active', 'true')
              } else {
                node.removeAttribute('data-active')
              }
            },
          },
        ],
      },
    } satisfies MarkMarkdownStorage & FloatMenuItemStorage
  },
  addInputRules() {
    return [
      markInputRule({
        find: INPUT_REGEX,
        type: this.type,
      }),
    ]
  },
  addPasteRules() {
    return [
      markPasteRule({
        find: PASTE_REGEX,
        type: this.type,
      }),
    ]
  },
})
