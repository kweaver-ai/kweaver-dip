import {
  AudioOutlined,
  FileExcelOutlined,
  FileImageOutlined,
  FileMarkdownOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  FileUnknownOutlined,
  FileWordOutlined,
  FileZipOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons'
import { Drawer, Spin } from 'antd'
import { memo, useEffect, useState } from 'react'
import {
  getSessionArchiveSubpath,
  getSessionArchives,
  type SessionArchiveEntry,
  type SessionArchivesResponse,
} from '@/apis/dip-studio/sessions'
import Empty from '@/components/Empty'
import { ArchivePreviewPanel, useArchivePreview } from '@/components/WorkPlanDetail/Outcome/Preview'
import {
  mockGetDigitalHumanSessionArchiveSubpath,
  mockGetDigitalHumanSessionArchives,
  RESULTS_PANEL_USE_MOCK,
} from '../../Outcome/resultsPanelMock'

export type TaskOutcomeListProps = {
  digitalHumanId?: string
  sessionId?: string
}

type SessionArchiveFileItem = {
  path: string
  name: string
  type: SessionArchiveEntry['type']
}

function getFileExt(fileName: string): string {
  const index = fileName.lastIndexOf('.')
  if (index < 0) return ''
  return fileName.slice(index + 1).toLowerCase()
}

function renderFileTypeMeta(fileName: string) {
  const ext = getFileExt(fileName)
  const iconClassName = 'text-[--dip-text-color-45]'

  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'ico', 'avif'].includes(ext)) {
    return { icon: <FileImageOutlined className={iconClassName} />, label: '图片' }
  }
  if (ext === 'pdf') {
    return { icon: <FilePdfOutlined className={iconClassName} />, label: 'PDF' }
  }
  if (['doc', 'docx'].includes(ext)) {
    return { icon: <FileWordOutlined className={iconClassName} />, label: 'Word' }
  }
  if (['xls', 'xlsx', 'csv'].includes(ext)) {
    return { icon: <FileExcelOutlined className={iconClassName} />, label: 'Excel' }
  }
  if (['zip', 'rar', '7z', 'tar', 'gz', 'tgz'].includes(ext)) {
    return { icon: <FileZipOutlined className={iconClassName} />, label: '压缩包' }
  }
  if (['mp4', 'webm', 'mov', 'm4v', 'ogv'].includes(ext)) {
    return { icon: <VideoCameraOutlined className={iconClassName} />, label: '视频' }
  }
  if (['mp3', 'wav', 'aac', 'flac', 'm4a', 'opus', 'oga', 'weba'].includes(ext)) {
    return { icon: <AudioOutlined className={iconClassName} />, label: '音频' }
  }
  if (['md', 'mdx', 'markdown'].includes(ext)) {
    return { icon: <FileMarkdownOutlined className={iconClassName} />, label: 'Markdown' }
  }
  if (
    [
      'txt',
      'json',
      'xml',
      'yml',
      'yaml',
      'log',
      'ts',
      'tsx',
      'js',
      'jsx',
      'css',
      'less',
      'html',
    ].includes(ext)
  ) {
    return {
      icon: <FileTextOutlined className={iconClassName} />,
      label: ext ? ext.toUpperCase() : '文本',
    }
  }

  return {
    icon: <FileUnknownOutlined className={iconClassName} />,
    label: ext ? ext.toUpperCase() : '未知',
  }
}

async function resolveFilesInDirectory(
  dhId: string,
  sessionId: string,
  currentPath: string,
): Promise<SessionArchiveFileItem[]> {
  const res = (
    RESULTS_PANEL_USE_MOCK
      ? await mockGetDigitalHumanSessionArchiveSubpath(currentPath, { responseType: 'json' })
      : await getSessionArchiveSubpath(sessionId, currentPath, { responseType: 'json' })
  ) as SessionArchivesResponse

  const items = res.contents ?? []
  const nested = await Promise.all(
    items.map(async (item) => {
      const fullPath = currentPath ? `${currentPath}/${item.name}` : item.name
      if (item.type === 'directory') {
        return resolveFilesInDirectory(dhId, sessionId, fullPath)
      }
      return [{ path: fullPath, name: item.name, type: item.type }]
    }),
  )
  return nested.flat()
}

function TaskOutcomeListInner({ digitalHumanId, sessionId }: TaskOutcomeListProps) {
  const dhId = digitalHumanId?.trim() || 'mock-dh-id'
  const sessionIdTrimmed = sessionId?.trim() || 'mock-session-id'
  const canFetch = Boolean(dhId && sessionIdTrimmed)

  const [entries, setEntries] = useState<SessionArchiveFileItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { preview, openFilePreview, closePreview, downloadFile } = useArchivePreview(
    dhId ?? '',
    sessionIdTrimmed ?? '',
  )

  useEffect(() => {
    setEntries([])
    setError('')
  }, [dhId, sessionIdTrimmed])

  useEffect(() => {
    if (!(dhId && sessionIdTrimmed)) return
    let cancelled = false
    const load = async () => {
      try {
        setLoading(true)
        setError('')

        // 1) 先拉目录级（root）产物
        const root = RESULTS_PANEL_USE_MOCK
          ? await mockGetDigitalHumanSessionArchives()
          : await getSessionArchives(sessionIdTrimmed)
        const rootItems = root.contents ?? []

        // 2) 再通过 subpath 拉文件级产物，并汇总为文件列表
        const nested = await Promise.all(
          rootItems.map(async (item) => {
            if (item.type === 'directory') {
              return resolveFilesInDirectory(dhId, sessionIdTrimmed, item.name)
            }
            return [{ path: item.name, name: item.name, type: item.type }]
          }),
        )
        if (!cancelled) setEntries(nested.flat())
      } catch (error: any) {
        if (!cancelled) setError(error?.description ?? '归档产物拉取失败')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [dhId, sessionIdTrimmed])

  if (!canFetch) {
    return <Empty title="暂无产物" />
  }
  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spin />
      </div>
    )
  }
  if (error) {
    return <Empty type="failed" title="加载失败" desc={error} />
  }
  if (entries.length === 0) {
    return <Empty title="暂无产物" />
  }
  return (
    <>
      <ul className="space-y-2 px-4">
        {entries.map((item) => {
          const fileTypeMeta = renderFileTypeMeta(item.name)
          return (
            <li key={`${item.type}-${item.path}`}>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-md border border-[--dip-border-color] bg-[--dip-white] px-3 py-2 text-left transition-colors hover:border-[--dip-primary-color] hover:bg-[--dip-hover-bg-color]"
                onClick={() => {
                  setDrawerOpen(true)
                  void openFilePreview(item.path, item.name)
                }}
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-[--dip-text-color]" title={item.name}>
                    {item.name}
                  </div>
                  <div className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-[--dip-text-color-45]">
                    {fileTypeMeta.icon}
                    <span>{fileTypeMeta.label}</span>
                  </div>
                </div>
              </button>
            </li>
          )
        })}
      </ul>

      <Drawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false)
          closePreview()
        }}
        size="60%"
        closable={false}
        mask={{ closable: true }}
        destroyOnHidden
        styles={{ body: { padding: 0, overflow: 'hidden' } }}
      >
        <div className="flex h-full min-h-0 flex-col overflow-hidden">
          {preview ? (
            <ArchivePreviewPanel
              preview={preview}
              showHeader
              onDownload={() => downloadFile(preview.subpath, preview.title)}
              onClose={() => {
                setDrawerOpen(false)
                closePreview()
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center p-6">
              <Empty title="暂无预览内容" />
            </div>
          )}
        </div>
      </Drawer>
    </>
  )
}

const TaskOutcomeList = memo(TaskOutcomeListInner)
export default TaskOutcomeList
