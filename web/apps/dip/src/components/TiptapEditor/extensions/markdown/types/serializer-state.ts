import type { Editor } from '@tiptap/core'
import type { Fragment, Mark, Node } from '@tiptap/pm/model'
import type { Processor } from 'unified'
import type { MarkdownNode } from './base'

export interface ISerializerState {
  readonly editor: Editor
  readonly processor: Processor
  serialize(document: Node): string
  next(nodes: Node | Fragment): this
  addNode(node: MarkdownNode): this
  openNode(node: MarkdownNode): this
  closeNode(): this
  withMark(mark: Mark, node: MarkdownNode): this
}
