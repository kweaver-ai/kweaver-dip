import type { Editor } from '@tiptap/core'
import type { MarkType, Node, NodeType } from '@tiptap/pm/model'
import type { Processor } from 'unified'
import type { Attrs, MarkdownNode } from './base'

export interface IParserState {
  readonly editor: Editor
  readonly processor: Processor
  parse(markdown: string): Node | null
  next(nodes?: MarkdownNode | MarkdownNode[]): this
  addText(value?: string): this
  addNode(type: NodeType, attrs?: Attrs, content?: Node[]): this
  openNode(type: NodeType, attrs?: Attrs): this
  closeNode(): this
  openMark(type: MarkType, attrs?: Attrs): this
  closeMark(type: MarkType): this
}
