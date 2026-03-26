import type { SessionArchiveEntry, SessionArchivesResponse } from '@/apis/dip-studio/sessions'

/** 目录名形如 `{uuid}_{YYYY-MM-DD-HH-mm-ss}` 或 `{YYYY-MM-DD-HH-mm-ss}`，提取 `YYYY-MM-DD` 用于分组 */
const DIR_NAME_RE =
  // 兼容两种目录名：
  // 1) 旧格式：`{uuid}_{YYYY-MM-DD-HH-mm-ss}`
  // 2) 新格式：`{YYYY-MM-DD-HH-mm-ss}`
  /^(?:([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})_)?(.+)$/

const DIR_TAIL_TIME_RE = /^(\d{4}-\d{2}-\d{2})-(\d{2})-(\d{2})-(\d{2})$/

export function parseArchiveDirectoryDateKey(name: string): string | null {
  const m = name.match(DIR_NAME_RE)
  if (!m?.[2]) return null
  const tail = m[2]
  const dm = tail.match(/^(\d{4}-\d{2}-\d{2})/)
  return dm?.[1] ?? null
}

/** 展示用：将开头的 `YYYY-MM-DD` 改为 `YYYY/MM/DD`（含 ISO 等前缀形式） */
function formatDisplayDateSeparators(text: string): string {
  return text.replace(/^(\d{4})-(\d{2})-(\d{2})/, '$1/$2/$3')
}

/** 分组键 `YYYY-MM-DD` → 面板标题等展示用 `YYYY/MM/DD` */
export function formatDateKeyForDisplay(dateKey: string): string {
  if (dateKey === '其他') return dateKey
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return dateKey.replace(/-/g, '/')
  return dateKey
}

/** 从标准归档目录名解析「更新时间」展示文案 */
export function formatArchiveDirectoryTimeLabel(dirName: string): string | null {
  const m = dirName.match(DIR_NAME_RE)
  if (!m?.[2]) return null
  const tm = m[2].match(DIR_TAIL_TIME_RE)
  if (!tm) return null
  return `${tm[1].replace(/-/g, '/')} ${tm[2]}:${tm[3]}:${tm[4]}`
}

/** 目录行标题：能解析则显示时间，否则回退原始名 */
export function formatArchiveDirectoryDisplayLabel(dirName: string): string {
  return formatArchiveDirectoryTimeLabel(dirName) ?? dirName
}

function parseDirectoryNameTimestampMs(dirName: string): number | null {
  const m = dirName.match(DIR_NAME_RE)
  if (!m?.[2]) return null
  const tm = m[2].match(DIR_TAIL_TIME_RE)
  if (!tm) return null
  const t = Date.parse(`${tm[1]}T${tm[2]}:${tm[3]}:${tm[4]}`)
  return Number.isNaN(t) ? null : t
}

/** 用于列表排序：优先接口时间字段，否则用父目录名解析；越大越新 */
export function getArchiveEntrySortTimestampMs(
  file: SessionArchiveEntry,
  parentDirName: string,
): number {
  const o = file as Record<string, unknown>
  for (const k of ['modifiedAt', 'mtime', 'updatedAt', 'updateTime'] as const) {
    const v = o[k]
    if (typeof v === 'number' && Number.isFinite(v)) {
      return v > 1e12 ? v : v * 1000
    }
    if (typeof v === 'string' && v.trim()) {
      const t = Date.parse(v.trim())
      if (!Number.isNaN(t)) return t
    }
  }
  return parseDirectoryNameTimestampMs(parentDirName) ?? 0
}

/** 文件行右侧时间：优先接口扩展字段，否则用父目录名解析 */
export function getArchiveEntryDisplayTime(
  file: SessionArchiveEntry,
  parentDirName: string,
): string {
  const o = file as Record<string, unknown>
  for (const k of ['modifiedAt', 'mtime', 'updatedAt', 'updateTime'] as const) {
    const v = o[k]
    if (typeof v === 'string' && v.trim()) return formatDisplayDateSeparators(v.trim())
  }
  return formatArchiveDirectoryTimeLabel(parentDirName) ?? '—'
}

/** 按日期分组顶层目录；无法解析日期的归入「其他」 */
export function groupArchiveDirectoriesByDate(
  entries: SessionArchiveEntry[],
): Map<string, SessionArchiveEntry[]> {
  const dirs = entries.filter((e) => e.type === 'directory')
  const map = new Map<string, SessionArchiveEntry[]>()
  for (const d of dirs) {
    const dateKey = parseArchiveDirectoryDateKey(d.name) ?? '其他'
    const list = map.get(dateKey) ?? []
    list.push(d)
    map.set(dateKey, list)
  }
  for (const [, list] of map) {
    list.sort((a, b) => b.name.localeCompare(a.name))
  }
  return map
}

export function sortDateKeysDesc(dateKeys: string[]): string[] {
  return [...dateKeys].sort((a, b) => {
    if (a === '其他') return 1
    if (b === '其他') return -1
    return b.localeCompare(a)
  })
}

export function isSessionArchivesResponse(v: unknown): v is SessionArchivesResponse {
  return (
    v !== null &&
    typeof v === 'object' &&
    'contents' in v &&
    Array.isArray((v as SessionArchivesResponse).contents)
  )
}

function getFileExtension(fileName: string): string {
  const i = fileName.lastIndexOf('.')
  return i >= 0 ? fileName.slice(i + 1).toLowerCase() : ''
}

/** 按文本拉取（UTF-8 可读）的扩展名 */
const TEXT_LIKE_EXTENSIONS = new Set([
  'json',
  'md',
  'txt',
  'html',
  'htm',
  'xml',
  'css',
  'less',
  'scss',
  'sass',
  'csv',
  'tsv',
  'yaml',
  'yml',
  'tsx',
  'jsx',
  'ts',
  'js',
  'mjs',
  'cjs',
  'vue',
  'jsonc',
  'sh',
  'bash',
  'zsh',
  'sql',
  'log',
  'gitignore',
  'env',
  'properties',
  'ini',
  'toml',
  'conf',
  'mdx',
  'py',
  'rb',
  'go',
  'java',
  'kt',
  'swift',
  'rs',
  'c',
  'h',
  'cpp',
  'hpp',
  'cs',
  'php',
  'r',
  'dart',
  'gradle',
  'groovy',
  'kts',
])

/**
 * 二进制走 `arraybuffer` → Blob 后，在侧栏用哪种方式展示。
 * - `text`：走文本接口（与 json 区分）
 * - `pdf` / `image` / `video` / `audio`：浏览器内嵌预览
 * - `office`：Office 套件，仅下载
 * - `download`：压缩包、可执行文件等，仅下载
 */
export type ArchivePreviewViewer =
  | 'text'
  | 'markdown'
  | 'pdf'
  | 'image'
  | 'video'
  | 'audio'
  | 'office'
  | 'download'

/** 文本类文件（JSON / TXT / MD 等）在侧栏里用哪种方式展示 */
export function getArchiveTextPreviewViewer(fileName: string): ArchivePreviewViewer {
  const ext = getFileExtension(fileName)
  if (ext === 'md' || ext === 'mdx' || ext === 'markdown') return 'markdown'
  return 'text'
}

/** 根据扩展名决定 arraybuffer 拉取后的预览方式（非文本类文件） */
export function getArchivePreviewViewer(fileName: string): ArchivePreviewViewer {
  const ext = getFileExtension(fileName)
  if (ext === 'pdf') return 'pdf'
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'ico', 'avif', 'svg'].includes(ext))
    return 'image'
  if (['mp4', 'webm', 'ogv', 'mov', 'm4v'].includes(ext)) return 'video'
  if (['mp3', 'wav', 'aac', 'flac', 'm4a', 'opus', 'oga', 'weba'].includes(ext)) return 'audio'
  if (
    [
      'doc',
      'docx',
      'ppt',
      'pptx',
      'pps',
      'ppsx',
      'xls',
      'xlsx',
      'xlsm',
      'odt',
      'ods',
      'odp',
    ].includes(ext)
  ) {
    return 'office'
  }
  if (
    [
      'zip',
      'rar',
      '7z',
      'tar',
      'gz',
      'tgz',
      'bz2',
      'xz',
      'exe',
      'dmg',
      'deb',
      'rpm',
      'apk',
      'bin',
      'dat',
      'wasm',
      'iso',
    ].includes(ext)
  ) {
    return 'download'
  }
  // 未单独分类的二进制：统一走下载，避免按文本解码乱码
  return 'download'
}

/** 构建 Blob 的 MIME，供 iframe / img / video / audio 与下载使用 */
export function getArchiveFileMimeForBlob(fileName: string): string {
  const ext = getFileExtension(fileName)
  const map: Record<string, string> = {
    pdf: 'application/pdf',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    bmp: 'image/bmp',
    ico: 'image/x-icon',
    avif: 'image/avif',
    svg: 'image/svg+xml',
    mp4: 'video/mp4',
    webm: 'video/webm',
    ogv: 'video/ogg',
    mov: 'video/quicktime',
    m4v: 'video/x-m4v',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    aac: 'audio/aac',
    flac: 'audio/flac',
    m4a: 'audio/mp4',
    opus: 'audio/opus',
    oga: 'audio/ogg',
    weba: 'audio/webm',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    pps: 'application/vnd.ms-powerpoint',
    ppsx: 'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xlsm: 'application/vnd.ms-excel.sheet.macroEnabled.12',
    odt: 'application/vnd.oasis.opendocument.text',
    ods: 'application/vnd.oasis.opendocument.spreadsheet',
    odp: 'application/vnd.oasis.opendocument.presentation',
    zip: 'application/zip',
    rar: 'application/vnd.rar',
    '7z': 'application/x-7z-compressed',
    gz: 'application/gzip',
    wasm: 'application/wasm',
  }
  return map[ext] ?? 'application/octet-stream'
}

/**
 * 接口 `responseType`：JSON / 文本类 / 其余一律二进制。
 */
export function previewResponseType(fileName: string): 'json' | 'text' | 'arraybuffer' {
  const ext = getFileExtension(fileName)
  if (ext === 'json') return 'json'
  if (TEXT_LIKE_EXTENSIONS.has(ext)) return 'text'
  return 'arraybuffer'
}

export function formatPreviewContent(
  res: SessionArchivesResponse | string | ArrayBuffer,
  fileName: string,
): string {
  if (typeof res === 'string') return res
  if (res instanceof ArrayBuffer) return '[二进制内容，无法以文本预览]'
  if (isSessionArchivesResponse(res)) return JSON.stringify(res, null, 2)
  if (fileName.toLowerCase().endsWith('.json')) return JSON.stringify(res, null, 2)
  return String(res)
}

export function emptyArchive(path: string): SessionArchivesResponse {
  return { path, contents: [] }
}
