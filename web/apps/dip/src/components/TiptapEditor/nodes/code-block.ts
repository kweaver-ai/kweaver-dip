import { mergeAttributes } from '@tiptap/core'
import {
  CodeBlockLowlight,
  type CodeBlockLowlightOptions,
} from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import tippy from 'tippy.js'
import type {
  BlockMenuItemStorage,
  ClickMenuItemStorage,
  FloatMenuItemStorage,
  NodeMarkdownStorage,
} from '../types'
import { setAttributes } from '../utils/editor'
import { icon } from '../utils/icons'

export interface CodeBlockOptions extends CodeBlockLowlightOptions {
  dictionary: Record<string, string>
}

export const CodeBlock = CodeBlockLowlight.extend<CodeBlockOptions>({
  name: 'codeBlock',
  addOptions() {
    return {
      ...this.parent?.(),
      languageClassPrefix: 'language-',
      exitOnTripleEnter: true,
      exitOnArrowDown: true,
      defaultLanguage: null,
      enableTabIndentation: true,
      tabSize: 2,
      lowlight: createLowlight(common),
      HTMLAttributes: {},
      dictionary: {
        name: '代码块',
        copy: '复制',
        copied: '复制成功!',
        arduino: 'Arduino',
        bash: 'Bash',
        c: 'C',
        cpp: 'C++',
        csharp: 'C#',
        css: 'CSS',
        diff: 'Diff',
        go: 'Go',
        graphql: 'GraphQL',
        ini: 'INI',
        java: 'Java',
        javascript: 'JavaScript',
        json: 'JSON',
        kotlin: 'Kotlin',
        less: 'Less',
        lua: 'Lua',
        makefile: 'Makefile',
        markdown: 'Markdown',
        objectivec: 'Objective-C',
        perl: 'Perl',
        php: 'PHP',
        'php-template': 'PHP Template',
        plaintext: 'Text',
        python: 'Python',
        'python-repl': 'Python Repl',
        r: 'R',
        ruby: 'Ruby',
        rust: 'Rust',
        scss: 'Scss',
        shell: 'Shell',
        sql: 'SQL',
        swift: 'Swift',
        typescript: 'TypeScript',
        vbnet: 'Visual Basic .NET',
        wasm: 'WebAssembly',
        xml: 'XML',
        yaml: 'YAML',
      },
    }
  },
  addStorage() {
    return {
      ...this.parent?.(),
      markdown: {
        parser: {
          match: (node: any) => node.type === 'code',
          apply: (state: any, node: any, type: any) => {
            const language = node.lang as string
            const value = node.value as string
            state.openNode(type, { language })
            state.addText(value)
            state.closeNode()
          },
        },
        serializer: {
          match: (node: any) => node.type.name === this.name,
          apply: (state: any, node: any) => {
            state.addNode({
              type: 'code',
              value: node.content.firstChild?.text || '',
              lang: node.attrs.language,
            })
          },
        },
      },
      floatMenu: {
        hide: true,
      },
      blockMenu: {
        items: [
          {
            id: this.name,
            name: this.options.dictionary.name,
            icon: icon('code'),
            shortcut: 'Mod-Alt-C',
            keywords: 'codeblock,cb,dmk,',
            action: (editor: any) => editor.chain().toggleCodeBlock().focus().run(),
          },
        ],
      },
      clickMenu: {
        items: [
          {
            id: this.name,
            name: this.options.dictionary.name,
            icon: icon('code'),
            action: (editor: any) => editor.chain().toggleCodeBlock().focus().run(),
          },
        ],
      },
    } satisfies FloatMenuItemStorage &
      BlockMenuItemStorage &
      ClickMenuItemStorage &
      NodeMarkdownStorage
  },
  addAttributes() {
    return {
      language: {
        default: 'plaintext',
      },
    }
  },
  addNodeView() {
    return ({ node, editor, getPos }) => {
      const parent = document.createElement('pre')
      const toolbar = document.createElement('div')
      const content = document.createElement('code')

      for (const [key, value] of Object.entries(mergeAttributes(this.options.HTMLAttributes))) {
        if (value !== undefined && value !== null) {
          parent.setAttribute(key, String(value))
          content.setAttribute(key, String(value))
        }
      }

      parent.setAttribute('data-type', this.name)
      toolbar.setAttribute('data-type', `${this.name}Toolbar`)
      content.setAttribute('data-type', `${this.name}Content`)

      // language list
      const language = document.createElement('select')
      for (const name of this.options.lowlight.listLanguages() as string[]) {
        const option = document.createElement('option')
        option.value = name
        option.textContent = this.options.dictionary[name] ?? name
        language.append(option)
      }
      language.value = node.attrs.language

      // 只读模式下禁用语言选择器
      if (!editor.isEditable) {
        language.disabled = true
      }

      language.addEventListener('change', () => {
        if (!editor.isEditable) {
          language.value = node.attrs.language
        } else if (typeof getPos === 'function') {
          const pos = getPos()
          if (typeof pos === 'number') {
            setAttributes(editor, () => pos, { ...node.attrs, language: language.value })
          }
        }
      })

      // copy button
      const copy = document.createElement('button')
      copy.textContent = this.options.dictionary.copy
      const copied = document.createElement('span')
      copied.textContent = this.options.dictionary.copied
      copied.classList.add('dip-prose-mirror-fm-button-popover')
      const instance = tippy(copy, {
        appendTo: () => document.body,
        content: copied,
        arrow: false,
        theme: 'dip-prose-mirror-dark',
        animation: 'shift-away',
        duration: [200, 150],
        trigger: 'manual',
      })
      copy.addEventListener('click', (e) => {
        e.stopPropagation()
        navigator.clipboard.writeText(node.content.firstChild?.text || '').then(() => {
          instance.show()
          setTimeout(() => instance.hide(), 1000)
        })
      })

      toolbar.contentEditable = 'false'
      toolbar.append(language)
      toolbar.append(copy)
      parent.append(toolbar)
      parent.append(content)

      // 监听编辑器状态变化
      const updateEditableState = () => {
        language.disabled = !editor.isEditable
      }

      // 初始化状态
      updateEditableState()

      // 监听编辑器状态变化
      editor.on('update', updateEditableState)

      return {
        dom: parent,
        contentDOM: content,
        update: (updatedNode) => {
          if (updatedNode.type !== this.type) {
            return false
          }
          if (language.value !== updatedNode.attrs.language) {
            language.value = updatedNode.attrs.language
          }
          // 更新编辑状态
          updateEditableState()
          return true
        },
        destroy: () => {
          // 清理事件监听
          editor.off('update', updateEditableState)
        },
      }
    }
  },
})
