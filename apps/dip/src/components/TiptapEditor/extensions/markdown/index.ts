import { Extension } from '@tiptap/core'
import type { Node } from '@tiptap/pm/model'
import remarkDirective from 'remark-directive'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import { type Processor, unified } from 'unified'
import { ParserState } from './parser/state'
import { SerializerState } from './serializer/state'
import type { MarkMarkdownStorage, NodeMarkdownStorage } from './types'

export * from './plugins/decoration'
export { remarkDecorationSingle } from './plugins/decoration'
export * from './plugins/wrap'
export * from './types'

export type MarkdownOptions = Record<string, never>

export interface MarkdownStorage {
  get: () => string
  set: (markdown: string, emit?: boolean) => void
  parse: (markdown: string) => Node | null
  serialize: (document: Node) => string
  processor: Processor
}

export const Markdown = Extension.create<MarkdownOptions, MarkdownStorage>({
  name: 'markdown',
  addStorage() {
    return {} as MarkdownStorage
  },
  onBeforeCreate() {
    // processor
    this.storage.processor = unified()
      .use(remarkParse)
      .use(remarkStringify, {
        // 使用两个空格+换行符表示硬换行（标准 Markdown）
        handlers: {
          break: () => '  \n',
        },
      })
      .use(remarkGfm)
      .use(remarkDirective)
      .use(remarkMath) as unknown as Processor
    for (const [key, value] of Object.entries(
      this.editor.storage as unknown as Record<string, NodeMarkdownStorage | MarkMarkdownStorage>,
    )) {
      if (key !== this.name && value?.markdown?.hooks?.beforeInit) {
        this.storage.processor = value.markdown.hooks.beforeInit(this.storage.processor)
      }
    }
    for (const [key, value] of Object.entries(
      this.editor.storage as unknown as Record<string, NodeMarkdownStorage | MarkMarkdownStorage>,
    )) {
      if (key !== this.name && value?.markdown?.hooks?.afterInit) {
        this.storage.processor = value.markdown.hooks.afterInit(this.storage.processor)
      }
    }
    // parser
    this.storage.parse = (markdown: string) => {
      return new ParserState(this.editor, this.storage.processor).parse(markdown)
    }
    // serializer
    this.storage.serialize = (document: Node) => {
      return new SerializerState(this.editor, this.storage.processor).serialize(document)
    }
    // get
    this.storage.get = () => {
      return (this.editor.storage as any)[this.name].serialize(this.editor.state.doc) as string
    }
    // set
    this.storage.set = (markdown: string, emit?: boolean) => {
      const tr = this.editor.state.tr
      const doc = (this.editor.storage as any)[this.name].parse(markdown)
      this.editor.view.dispatch(
        tr.replaceWith(0, tr.doc.content.size, doc).setMeta('preventUpdate', !emit),
      )
    }
  },
})
