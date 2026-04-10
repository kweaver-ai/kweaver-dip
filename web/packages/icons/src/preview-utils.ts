export interface PreviewItem {
  iconfontName: string
  componentName: string
  kind: 'outlined' | 'colored'
}

export function filterPreviewItems(
  items: PreviewItem[],
  keyword: string,
): PreviewItem[] {
  const normalizedKeyword = keyword.trim().toLowerCase()

  if (!normalizedKeyword) {
    return items
  }

  return items.filter((item) => {
    return (
      item.iconfontName.toLowerCase().includes(normalizedKeyword) ||
      item.componentName.toLowerCase().includes(normalizedKeyword)
    )
  })
}

export function groupPreviewItems(items: PreviewItem[]): {
  outlined: PreviewItem[]
  colored: PreviewItem[]
} {
  return {
    outlined: items.filter((item) => item.kind === 'outlined'),
    colored: items.filter((item) => item.kind === 'colored'),
  }
}

export function toPreviewCopySnippet(componentName: string): string {
  return `<${componentName} />`
}
