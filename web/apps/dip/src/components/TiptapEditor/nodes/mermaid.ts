import { findParentNode, mergeAttributes, Node, textblockTypeInputRule } from '@tiptap/core'
import { Fragment } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import mermaid from 'mermaid'
import type { BlockMenuItemStorage } from '../extensions/block-menu/menu'
import type { MarkdownNode, NodeMarkdownStorage } from '../extensions/markdown'
import { InnerEditorView } from '../extensions/node-view/inner-editor'
import { debounce } from '../utils/functions'

import { icon } from '../utils/icons'

mermaid.initialize({
  startOnLoad: false,
})

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    diagram: {
      setMermaid: (code: string) => ReturnType
    }
  }
}

export interface MermaidOptions {
  HTMLAttributes: Record<string, any>
  dictionary: {
    name: string
    inputHelp: string
    inputGraph: string
  }
}

export const Mermaid = Node.create<MermaidOptions>({
  name: 'mermaid',
  group: 'block',
  marks: '',
  content: 'text*',
  atom: true,
  code: true,
  defining: true,
  isolating: true,
  addOptions() {
    return {
      HTMLAttributes: {},
      dictionary: {
        name: 'Mermaid',
        inputHelp: 'Help',
        inputGraph: '输入或粘贴 mermaid 代码',
      },
    }
  },
  addStorage() {
    return {
      markdown: {
        parser: {
          match: (node) => node.type === 'containerDirective' && node.name === this.name,
          apply: (state, node, type) => {
            const collect = (node: MarkdownNode): string => {
              return (node.children ?? []).reduce((a, i) => {
                if (i.type === 'text') {
                  return a + i.value
                } else {
                  return a + collect(i)
                }
              }, '')
            }
            state.openNode(type).addText(collect(node)).closeNode()
          },
        },
        serializer: {
          match: (node) => node.type.name === this.name,
          apply: (state, node) => {
            state
              .openNode({
                type: 'containerDirective',
                name: this.name,
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
            icon: icon('mermaid'),
            keywords: 'mermaid,graph',
            action: (editor) =>
              editor
                .chain()
                .setMermaid('graph TD;\n  A-->B;  A-->C;\n  B-->D;\n  C-->D;')
                .focus()
                .run(),
          },
        ],
      },
    } satisfies NodeMarkdownStorage & BlockMenuItemStorage
  },
  parseHTML() {
    return [
      {
        tag: `div[data-type="${this.name}"]`,
        preserveWhitespace: 'full',
      },
    ]
  },
  renderHTML({ node, HTMLAttributes }) {
    return [
      'div',
      mergeAttributes({ 'data-type': this.name }, this.options.HTMLAttributes, HTMLAttributes),
      node.textContent,
    ]
  },
  addNodeView() {
    const render = debounce(300, (code: string, node: HTMLElement) => {
      if (code) {
        const dom = document.createElement('div')
        dom.id = `${this.name}-${Math.random().toString(36).substring(2, 10)}`
        mermaid
          .render(dom.id, code)
          .then(({ svg, bindFunctions }) => {
            dom.innerHTML = svg
            bindFunctions?.(dom)
            node.classList.remove('ProseMirror-info')
            node.classList.remove('ProseMirror-error')
            node.innerHTML = dom.outerHTML
          })
          .catch((reason) => {
            document.querySelector(`#d${dom.id}`)?.remove()
            node.classList.remove('ProseMirror-info')
            node.classList.add('ProseMirror-error')
            node.innerHTML = reason
          })
      } else {
        node.classList.remove('ProseMirror-error')
        node.classList.add('ProseMirror-info')
        node.innerHTML = this.options.dictionary.inputGraph
      }
    })
    return InnerEditorView.create({
      HTMLAttributes: this.options.HTMLAttributes,
      onRender: ({ view }) => {
        render(view.node.textContent, view.$preview)
      },
    })
  },
  addCommands() {
    return {
      setMermaid: (code) => {
        return ({ commands }) =>
          commands.insertContent({
            type: this.name,
            content: [
              {
                type: 'text',
                text: code,
              },
            ],
          })
      },
    }
  },
  addInputRules() {
    return [
      textblockTypeInputRule({
        find: /^:::mermaid$/,
        type: this.type,
      }),
    ]
  },
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('mermaid-paste'),
        props: {
          handlePaste: (view, event) => {
            const clipboardData = event.clipboardData
            if (!clipboardData) {
              return false
            }

            const text = clipboardData.getData('text/plain')
            if (!text) {
              return false
            }

            const trimmedText = text.trim()
            let mermaidCode = ''

            // 检查是否为 :::mermaid 格式（Markdown 容器指令格式）
            const mermaidDirectivePattern = /^:::mermaid\s*\n([\s\S]*?)\n:::$/i
            const directiveMatch = trimmedText.match(mermaidDirectivePattern)
            if (directiveMatch) {
              mermaidCode = directiveMatch[1].trim()
            } else {
              // 检查是否为直接的 mermaid 代码
              // 常见的 mermaid 图表类型：graph, flowchart, sequenceDiagram, classDiagram, stateDiagram, erDiagram, gantt, pie, gitgraph, journey, requirement
              const mermaidCodePattern =
                /^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie|gitgraph|journey|requirement|mindmap|timeline|quadrantChart|C4Context|C4Container|C4Component)[\s\S]*$/i
              if (mermaidCodePattern.test(trimmedText)) {
                mermaidCode = trimmedText
              } else {
                return false
              }
            }

            // 如果识别到 mermaid 代码，转换为 mermaid 节点
            if (mermaidCode) {
              event.preventDefault()
              const { state, dispatch } = view
              const { selection } = state
              const { from, to } = selection

              // 检查当前选择是否在空段落中
              const parentParagraph = findParentNode((node) => node.type.name === 'paragraph')(
                selection,
              )
              const isEmptyParagraph =
                parentParagraph && parentParagraph.node.content.size === 0 && selection.empty

              // 创建 mermaid 节点
              const mermaidNode = this.type.create({}, state.schema.text(mermaidCode))

              // 如果在空段落中粘贴，在最后添加一个空段落以便继续输入
              const nodesToInsert = [mermaidNode]
              if (isEmptyParagraph) {
                nodesToInsert.push(state.schema.nodes.paragraph.create())
              }

              const fragment = Fragment.from(nodesToInsert)
              let tr = state.tr

              if (isEmptyParagraph && parentParagraph) {
                // 如果当前在空段落中，替换整个段落
                const paragraphStart = parentParagraph.pos
                const paragraphEnd = parentParagraph.pos + parentParagraph.node.nodeSize
                tr = tr.replaceWith(paragraphStart, paragraphEnd, fragment)
              } else {
                // 否则删除选中的文本并插入节点
                tr = tr.delete(from, to).insert(from, fragment)
              }

              dispatch(tr)
              return true
            }

            return false
          },
        },
      }),
    ]
  },
})
