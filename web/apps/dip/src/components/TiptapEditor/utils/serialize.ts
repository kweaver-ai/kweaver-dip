import { DOMSerializer, type NodeType, type Slice } from '@tiptap/pm/model'
// Copy from: https://github.com/ProseMirror/prosemirror-view/blob/master/src/clipboard.ts
import type { EditorView } from '@tiptap/pm/view'

let _detachedDoc: Document | null = null

const wrapMap: { [node: string]: string[] } = {
  thead: ['table'],
  tbody: ['table'],
  tfoot: ['table'],
  caption: ['table'],
  colgroup: ['table'],
  col: ['table', 'colgroup'],
  tr: ['table', 'tbody'],
  td: ['table', 'tbody', 'tr'],
  th: ['table', 'tbody', 'tr'],
}

function detachedDoc() {
  if (!_detachedDoc) {
    _detachedDoc = document.implementation.createHTMLDocument('title')
  }
  return _detachedDoc
}

export function serializeForClipboard(view: EditorView, slice: Slice) {
  const context: Array<string | Record<string, unknown> | null> = []
  let { openStart, openEnd, content } = slice
  while (
    openStart > 1 &&
    openEnd > 1 &&
    content.childCount === 1 &&
    content.firstChild !== null &&
    content.firstChild.childCount === 1
  ) {
    openStart -= 1
    openEnd -= 1
    const node = content.firstChild
    if (!node) {
      break
    }
    context.push(
      node.type.name,
      node.attrs !== (node.type as NodeType & { defaultAttrs: unknown }).defaultAttrs
        ? node.attrs
        : null,
    )
    content = node.content
  }

  const serializer =
    view.someProp('clipboardSerializer') || DOMSerializer.fromSchema(view.state.schema)
  const doc = detachedDoc()
  const wrap = doc.createElement('div')
  wrap.appendChild(serializer.serializeFragment(content, { document: doc }))

  let firstChild = wrap.firstChild
  let needsWrap: string[] | undefined
  let wrappers = 0
  while (firstChild && firstChild.nodeType === 1 && !!wrapMap[firstChild.nodeName.toLowerCase()]) {
    needsWrap = wrapMap[firstChild.nodeName.toLowerCase()]
    if (!needsWrap) {
      break
    }
    for (let i = needsWrap.length - 1; i >= 0; i--) {
      const wrapper = doc.createElement(needsWrap[i] as string)
      while (wrap.firstChild) wrapper.appendChild(wrap.firstChild)
      wrap.appendChild(wrapper)
      wrappers++
    }
    firstChild = wrap.firstChild
  }

  if (firstChild && firstChild.nodeType === 1) {
    ;(firstChild as HTMLElement).setAttribute(
      'data-pm-slice',
      `${openStart} ${openEnd}${wrappers ? ` -${wrappers}` : ''} ${JSON.stringify(context)}`,
    )
  }

  const text =
    view.someProp('clipboardTextSerializer', (f) => f(slice, view)) ||
    slice.content.textBetween(0, slice.content.size, '\n\n')

  return { dom: wrap, text }
}
