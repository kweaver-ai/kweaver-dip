function isEmptyTextNode(node: any) {
  return !!node && typeof node === 'object' && node.type === 'text' && node.text === ''
}

function sanitizeInitialContentNode(node: any): any {
  if (Array.isArray(node)) {
    return node.map((item) => sanitizeInitialContentNode(item))
  }

  if (!node || typeof node !== 'object') {
    return node
  }

  const sanitizedNode: Record<string, any> = { ...node }

  if (Object.prototype.hasOwnProperty.call(sanitizedNode, 'content')) {
    if (Array.isArray(sanitizedNode.content)) {
      sanitizedNode.content = sanitizedNode.content.map((item: any) => sanitizeInitialContentNode(item))
    } else if (sanitizedNode.content && typeof sanitizedNode.content === 'object') {
      sanitizedNode.content = sanitizeInitialContentNode(sanitizedNode.content)
    }
  }

  if (
    sanitizedNode.type === 'paragraph' &&
    (isEmptyTextNode(sanitizedNode.content) ||
      (Array.isArray(sanitizedNode.content) &&
        sanitizedNode.content.length === 1 &&
        isEmptyTextNode(sanitizedNode.content[0])))
  ) {
    delete sanitizedNode.content
  }

  return sanitizedNode
}

export function sanitizeInitialContent(content: any) {
  if (content && typeof content === 'object') {
    return sanitizeInitialContentNode(content)
  }

  return content
}
