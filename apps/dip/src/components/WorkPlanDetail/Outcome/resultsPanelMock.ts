import type { SessionArchivesResponse } from '@/apis/dip-studio/sessions'

// 不要再 import ...pdf?url / ...jpeg?url

const jpegAssetUrl = encodeURI('/123图片.jpeg')
const pdfAssetUrl = encodeURI('/_2018年世界杯转播平台洞察报告 (1).pdf')
const tailwindHtmlAssetUrl = encodeURI('/Width - Tailwind CSS.html')

/** 为 true 时成果 Tab 走本地 mock，不调归档接口 */
export const RESULTS_PANEL_USE_MOCK = true

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

/** 外层归档目录（与 archiveUtils 目录名格式一致） */
const MOCK_ARCHIVES_ROOT: SessionArchivesResponse = {
  path: '/',
  contents: [
    {
      name: '2026-03-20-16-11-32',
      type: 'directory',
    },
    {
      name: '2026-03-21-14-27-30',
      type: 'directory',
    },
    {
      name: '2026-03-21-14-34-17',
      type: 'directory',
    },
  ],
}

function mockFolderListing(folderName: string): SessionArchivesResponse {
  return {
    path: `/${folderName}`,
    contents: [
      { name: '企业数字员工简报.md', type: 'file' },
      { name: '企业数字员工简报.html', type: 'file' },
      { name: 'Width - Tailwind CSS.html', type: 'file' },
      { name: 'config.json', type: 'file' },
      { name: '_2018年世界杯转播平台洞察报告 (1).pdf', type: 'file' },
      { name: '示例.docx', type: 'file' },
      { name: '123图片.jpeg', type: 'file' },
      { name: '示例.zip', type: 'file' },
    ],
  }
}

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  // 有些 mock base64 可能会包含换行/空白，atob 不一定接受，先统一清理
  const binary = atob(b64.replace(/\s+/g, ''))
  const len = binary.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

/** 可见内容的 mock PDF（单页） */
const MOCK_MINI_PDF_BASE64 =
  'JVBERi0xLjQKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjQgMCBvYmoKPDwgL1R5cGUgL0ZvbnQgL1N1YnR5cGUgL1R5cGUxIC9CYXNlRm9udCAvSGVsdmV0aWNhID4+CmVuZG9iagozIDAgb2JqCjw8IC9UeXBlIC9QYWdlIC9QYXJlbnQgMiAwIFIgL01lZGlhQm94IFswIDAgNjEyIDc5Ml0gL1Jlc291cmNlcyA8PCAvRm9udCA8PCAvRjEgNCAwIFIgPj4gPj4gL0NvbnRlbnRzIDUgMCBSID4+CmVuZG9iago1IDAgb2JqCjw8IC9MZW5ndGggMTQyID4+CnN0cmVhbQpxCjAuOSB3CjcyIDcyIDQ2OCA2MDAgcmUKUwpCVAovRjEgMjQgVGYKMTAwIDcwMCBUZAooIk1vY2sgUERGIFByZXZpZXciKSBUagovRjEgMTIgVGYKMTAwIDY3MCBUZAooU2luZ2xlLXBhZ2UgUERGIGZvciBwcmV2aWV3IHRlc3RpbmcpIFRqCkVUClEKCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTggMDAwMDAgbiAKMDAwMDAwMDE4NSAwMDAwMCBuIAowMDAwMDAwMTE1IDAwMDAwIG4gCjAwMDAwMDAwMzExIDAwMDAwIG4gCXRyaWxlcnMKPDwvU2l6ZSA2IC9Sb290IDEgMCBSID4+CnN0YXJ0eHJlZgowNTA0CiUlRU9GCg=='

void MOCK_MINI_PDF_BASE64
/** minimal 可解析 PDF（用于 mock iframe 预览） */
const MOCK_MINI_PDF_BASE64_GOOD =
  'JVBERi0xLjEKJcKlwrHDqwoKMSAwIG9iagogIDw8IC9UeXBlIC9DYXRhbG9nCiAgICAgL1BhZ2VzIDIgMCBSCiAgPj4KZW5kb2JqCgoyIDAgb2JqCiAgPDwgL1R5cGUgL1BhZ2VzCiAgICAgL0tpZHMgWzMgMCBSXQogICAgIC9Db3VudCAxCiAgICAgL01lZGlhQm94IFswIDAgMzAwIDE0NF0KICA+PgplbmRvYmoKCjMgMCBvYmoKICA8PCAgL1R5cGUgL1BhZ2UKICAgICAgL1BhcmVudCAyIDAgUgogICAgICAvUmVzb3VyY2VzCiAgICAgICA8PCAvRm9udAogICAgICAgICAgIDw8IC9GMQogICAgICAgICAgICAgICAgIDw8IC9UeXBlIC9Gb250CiAgICAgICAgICAgICAgICAgICAvU3VidHlwZSAvVHlwZTEKICAgICAgICAgICAgICAgICAgICAgICAvQmFzZUZvbnQgL1RpbWVzLV' +
  'vb21hbgogICAgICAgICAgICAgICA+PgogICAgICAgICAgID4+CiAgICAgICA+PgogICAgICAvQ29udGVudHMgNCAwIFIKICA+PgplbmRvYmoKCjQgMCBvYmoKICA8PCAvTGVuZ3RoIDU1ID4+CnN0cmVhbQogIEJUCiAgICAvRjEgMTggVGYKICAgIDAgMCBUZAogICAgKEhlbGxvIFdvcmxkKSBUagogIEVUCmVuZHN0cmVhbQplbmRvYmoKCnhyZWYKMCA1CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxOCAwMDAwMCBuIAowMDAwMDAwMDc3IDAwMDAwIG4gCjAwMDAwMDAxNzggMDAwMDAgbiAKMDAwMDAwMDQ1NyAwMDAwMCBuIAp0cmFpbGVyCiAgPDwgIC9Sb290IDEgMCBSCiAgICAgIC9TaXplIDUKICA+PgpzdGFydHhyZWYKNTY1CiUlRU9GCg=='

/** 64×64 纯色 PNG（用于 mock 图片类预览，避免渲染过小看不见） */
const MOCK_1X1_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAT0lEQVR42u3PQQkAAAgEsOtkGPsn0Qi+hcEKLNP1WgQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQELgurj5Fp2s+3WAAAAABJRU5ErkJggg=='

/** 二进制：与真实接口一致返回 ArrayBuffer（按扩展名给占位数据） */
let cachedJpeg: ArrayBuffer | null = null
let cachedPdf: ArrayBuffer | null = null
async function mockBinaryArchiveBody(subpath: string): Promise<ArrayBuffer> {
  const jpegName = '123图片.jpeg'
  const pdfName = '_2018年世界杯转播平台洞察报告 (1).pdf'

  if (subpath.endsWith(jpegName)) {
    if (cachedJpeg) return cachedJpeg
    const res = await fetch(jpegAssetUrl)
    const buf = await res.arrayBuffer()
    cachedJpeg = buf
    return buf
  }

  if (subpath.endsWith(pdfName)) {
    if (cachedPdf) return cachedPdf
    const res = await fetch(pdfAssetUrl)
    const buf = await res.arrayBuffer()
    cachedPdf = buf
    return buf
  }

  const l = subpath.toLowerCase()
  if (l.endsWith('.pdf')) {
    return base64ToArrayBuffer(MOCK_MINI_PDF_BASE64_GOOD)
  }
  if (
    l.endsWith('.png') ||
    l.endsWith('.jpg') ||
    l.endsWith('.jpeg') ||
    l.endsWith('.gif') ||
    l.endsWith('.webp') ||
    l.endsWith('.bmp') ||
    l.endsWith('.ico')
  ) {
    return base64ToArrayBuffer(MOCK_1X1_PNG_BASE64)
  }
  if (l.endsWith('.svg')) {
    const svg = new TextEncoder().encode(
      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect width="16" height="16" fill="#ccc"/></svg>',
    )
    return svg.buffer.slice(svg.byteOffset, svg.byteOffset + svg.byteLength)
  }
  if (
    l.endsWith('.doc') ||
    l.endsWith('.docx') ||
    l.endsWith('.ppt') ||
    l.endsWith('.pptx') ||
    l.endsWith('.xls') ||
    l.endsWith('.xlsx')
  ) {
    const stub = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00, 0x00, 0x00])
    return stub.buffer
  }
  if (l.endsWith('.zip')) {
    return new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00, 0x00, 0x00]).buffer
  }
  return new ArrayBuffer(0)
}

/** Mock：一篇完整 Markdown 样例（GFM），用于本地预览效果 */
function getMockMarkdownSample(subpath: string): string {
  return `# 企业数字员工 · 工作成果简报

> **摘要**：本期由数字员工自动汇总会话产出，以下为 Markdown 预览效果示例。

## 一、关键结论

1. 已完成 **新闻检索** 与 **日报框架** 生成；
2. 输出物包含 \`简报.md\`、\`简报.html\` 与配置 \`config.json\`；
3. 可追溯目录：\`5346e9bf-…_2026-03-21-14-34-17/\`。

## 二、数据片段（表格）

| 指标 | 数值 | 说明 |
| --- | ---: | --- |
| 检索条数 | 128 | mock |
| 生成耗时 | 3.2s | 模拟 |

## 三、代码示例

\`\`\`typescript
export function hello(name: string): string {
  return \`Hello, \${name}\`
}
\`\`\`

## 四、列表与引用

- 无序项 A
- 无序项 B

> 引用块：可用于强调风险提示或补充说明。

---

**路径**：\`${subpath}\` · *由 resultsPanelMock 注入*
`
}

async function mockFileBody(
  subpath: string,
  responseType: 'json' | 'text' | 'arraybuffer' | undefined,
): Promise<string> {
  const lower = subpath.toLowerCase()
  if (lower.endsWith('.json') || responseType === 'json') {
    return JSON.stringify({ mock: true, path: subpath, message: 'mock json 预览' }, null, 2)
  }
  if (lower.endsWith('width - tailwind css.html')) {
    try {
      const response = await fetch(tailwindHtmlAssetUrl)
      if (response.ok) {
        return await response.text()
      }
    } catch {
      // fallback to generic html content
    }
  }
  if (lower.endsWith('.html')) {
    return '<!DOCTYPE html><html><body><p>mock html</p></body></html>'
  }
  if (lower.endsWith('.md')) {
    return getMockMarkdownSample(subpath)
  }
  return `# mock\n\n子路径：${subpath}\n\n（Markdown 预览）`
}

export async function mockGetDigitalHumanSessionArchives(): Promise<SessionArchivesResponse> {
  await delay(400)
  return MOCK_ARCHIVES_ROOT
}

export async function mockGetDigitalHumanSessionArchiveSubpath(
  subpath: string,
  options?: { responseType?: 'json' | 'text' | 'arraybuffer' },
): Promise<SessionArchivesResponse | string | ArrayBuffer> {
  await delay(300)
  const rt = options?.responseType

  if (!subpath.includes('/')) {
    const isDir = MOCK_ARCHIVES_ROOT.contents.some(
      (c) => c.type === 'directory' && c.name === subpath,
    )
    if (isDir) {
      return mockFolderListing(subpath)
    }
  }

  if (rt === 'arraybuffer') {
    return await mockBinaryArchiveBody(subpath)
  }

  return await mockFileBody(subpath, rt ?? 'text')
}
