export type IconKind = 'outlined' | 'colored'

// 线性库
const OutlinedLink = '//at.alicdn.com/t/c/font_5140342_i0qkuv1tpr.js'
// 彩色面性库
const ColoredLink = '//at.alicdn.com/t/c/font_5140345_godrm8ixc4i.js'

export interface IconSourceConfig {
  kind: IconKind
  suffix: 'Outlined' | 'Colored'
  symbolUrl: string
  rawDir: string
  componentDir: string
}

export function normalizeSymbolUrl(url: string): string {
  if (url.startsWith('//')) {
    return `https:${url}`
  }

  return url
}

export const outlinedIconSource: IconSourceConfig = {
  kind: 'outlined',
  suffix: 'Outlined',
  symbolUrl: normalizeSymbolUrl(
    OutlinedLink,
  ),
  rawDir: 'raw-svgs/outlined',
  componentDir: 'src/components/outlined',
}

export const coloredIconSource: IconSourceConfig = {
  kind: 'colored',
  suffix: 'Colored',
  symbolUrl: normalizeSymbolUrl(
    ColoredLink,
  ),
  rawDir: 'raw-svgs/colored',
  componentDir: 'src/components/colored',
}

export const iconSources: IconSourceConfig[] = [
  outlinedIconSource,
  coloredIconSource,
]
