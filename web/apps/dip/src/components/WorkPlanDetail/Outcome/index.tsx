import { FolderOpenOutlined } from '@ant-design/icons'
import { Collapse, Spin } from 'antd'
import classNames from 'classnames'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { SessionArchiveEntry, SessionArchivesResponse } from '@/apis/dip-studio/sessions'
import { getSessionArchiveSubpath, getSessionArchives } from '@/apis/dip-studio/sessions'
import Empty from '@/components/Empty'
import IconFont from '@/components/IconFont'
import ScrollBarContainer from '@/components/ScrollBarContainer'
import styles from './index.module.less'
import { ArchivePreviewDrawer, ArchivePreviewPanel, useArchivePreview } from './Preview'
import {
  mockGetDigitalHumanSessionArchiveSubpath,
  mockGetDigitalHumanSessionArchives,
  RESULTS_PANEL_USE_MOCK,
} from './resultsPanelMock'
import {
  emptyArchive,
  formatDateKeyForDisplay,
  getArchiveEntryDisplayTime,
  getArchiveEntrySortTimestampMs,
  groupArchiveDirectoriesByDate,
  isSessionArchivesResponse,
  sortDateKeysDesc,
} from './utils'

export type ResultsPanelProps = {
  planId?: string
  dhId: string
  sessionId: string
  /** 归档全屏预览抽屉的挂载容器，默认 document.body */
  previewDrawerGetContainer?: HTMLElement | (() => HTMLElement | null | undefined) | null
}

const ResultsPanel = ({
  planId: _planId,
  dhId,
  sessionId,
  previewDrawerGetContainer,
}: ResultsPanelProps) => {
  const [rootLoading, setRootLoading] = useState(false)
  const [root, setRoot] = useState<SessionArchivesResponse | null>(null)
  const [rootError, setRootError] = useState(false)

  const [activeKeys, setActiveKeys] = useState<string[]>([])
  const [folderContents, setFolderContents] = useState<Record<string, SessionArchivesResponse>>({})
  const loadingFolderRef = useRef<Set<string>>(new Set())

  const grouped = useMemo(() => {
    if (!root?.contents?.length) return new Map<string, SessionArchiveEntry[]>()
    return groupArchiveDirectoriesByDate(root.contents)
  }, [root])

  const dateKeys = useMemo(() => sortDateKeysDesc([...grouped.keys()]), [grouped])

  const loadRoot = useCallback(async () => {
    if (!(dhId && sessionId)) return
    setRootLoading(true)
    setRootError(false)
    try {
      const res = RESULTS_PANEL_USE_MOCK
        ? await mockGetDigitalHumanSessionArchives()
        : await getSessionArchives(sessionId)
      setRoot(res)
    } catch {
      setRootError(true)
    } finally {
      setRootLoading(false)
    }
  }, [dhId, sessionId])

  useEffect(() => {
    void loadRoot()
  }, [loadRoot])

  const loadFolder = useCallback(
    async (folderName: string) => {
      if (!(dhId && sessionId)) return
      if (loadingFolderRef.current.has(folderName)) return
      loadingFolderRef.current.add(folderName)
      try {
        const res = RESULTS_PANEL_USE_MOCK
          ? await mockGetDigitalHumanSessionArchiveSubpath(folderName, { responseType: 'json' })
          : await getSessionArchiveSubpath(sessionId, folderName, {
              responseType: 'json',
            })
        if (isSessionArchivesResponse(res)) {
          setFolderContents((prev) => ({ ...prev, [folderName]: res }))
        } else {
          // message.error('目录数据格式异常')
          setFolderContents((prev) => ({ ...prev, [folderName]: emptyArchive(folderName) }))
        }
      } catch {
        // message.error('加载子目录失败')
        setFolderContents((prev) => ({ ...prev, [folderName]: emptyArchive(folderName) }))
      } finally {
        loadingFolderRef.current.delete(folderName)
      }
    },
    [dhId, sessionId],
  )

  useEffect(() => {
    if (!(dhId && sessionId)) return
    for (const dateKey of activeKeys) {
      const dirs = grouped.get(dateKey)
      if (!dirs) continue
      for (const d of dirs) {
        if (folderContents[d.name] !== undefined) continue
        if (loadingFolderRef.current.has(d.name)) continue
        void loadFolder(d.name)
      }
    }
  }, [activeKeys, dhId, sessionId, grouped, folderContents, loadFolder])

  const { preview, openFilePreview, closePreview, downloadFile } = useArchivePreview(
    dhId,
    sessionId,
  )
  const [previewFullscreenOpen, setPreviewFullscreenOpen] = useState(false)

  const resolveDrawerContainer = useCallback((): HTMLElement => {
    if (!previewDrawerGetContainer) return document.body
    const node =
      typeof previewDrawerGetContainer === 'function'
        ? previewDrawerGetContainer()
        : previewDrawerGetContainer
    return node instanceof HTMLElement ? node : document.body
  }, [previewDrawerGetContainer])

  useEffect(() => {
    if (preview === null) setPreviewFullscreenOpen(false)
  }, [preview])

  const collapseItems = useMemo(() => {
    return dateKeys.map((dateKey) => {
      const dirs = grouped.get(dateKey) ?? []
      const expanded = activeKeys.includes(dateKey)
      const allFoldersLoaded =
        dirs.length === 0 || dirs.every((d) => folderContents[d.name] !== undefined)
      const showSpin = expanded && dirs.length > 0 && !allFoldersLoaded

      const fileRows: { dirName: string; file: SessionArchiveEntry }[] = []
      if (allFoldersLoaded) {
        for (const dir of dirs) {
          const loaded = folderContents[dir.name]
          if (!loaded) continue
          for (const e of loaded.contents) {
            if (e.type === 'file') fileRows.push({ dirName: dir.name, file: e })
          }
        }
        fileRows.sort((a, b) => {
          const tb = getArchiveEntrySortTimestampMs(b.file, b.dirName)
          const ta = getArchiveEntrySortTimestampMs(a.file, a.dirName)
          if (tb !== ta) return tb - ta
          return `${b.dirName}/${b.file.name}`.localeCompare(`${a.dirName}/${a.file.name}`)
        })
      }

      return {
        key: dateKey,
        label: (
          <span className="flex items-center gap-2">
            <FolderOpenOutlined className="text-[var(--dip-text-color-45)]" />
            <span className="line-clamp-1">{formatDateKeyForDisplay(dateKey)}</span>
          </span>
        ),
        children: (
          <div className="min-h-[48px]">
            {showSpin ? (
              <div className="flex justify-center py-4">
                <Spin size="small" />
              </div>
            ) : allFoldersLoaded ? (
              <ul className="m-0 box-border flex min-h-[48px] list-none flex-col justify-center divide-y divide-[var(--dip-line-color)] p-0">
                {fileRows.map(({ dirName, file }) => {
                  const subpath = `${dirName}/${file.name}`
                  return (
                    <li key={subpath}>
                      <button
                        type="button"
                        className={classNames(
                          'flex h-10 w-full cursor-pointer items-center justify-between gap-2 px-4 pr-6 pl-[70px] text-left transition-colors hover:bg-[--dip-hover-bg-color]',
                          preview?.subpath === subpath && 'bg-[--dip-hover-bg-color]',
                        )}
                        onClick={() => void openFilePreview(subpath, file.name)}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <IconFont
                            type="icon-document"
                            className="shrink-0 text-[var(--dip-text-color-45)]"
                          />
                          <span className="min-w-0 truncate" title={file.name}>
                            {file.name}
                          </span>
                        </span>
                        <span className="text-left text-xs leading-5 w-36 text-[var(--dip-text-color-45)] flex-shrink-0 tabular-nums">
                          {getArchiveEntryDisplayTime(file, dirName)}
                        </span>
                      </button>
                    </li>
                  )
                })}
                {fileRows.length === 0 ? (
                  <li className="px-4 py-3 text-center text-xs leading-5 text-[var(--dip-text-color-45)]">
                    暂无文件
                  </li>
                ) : null}
              </ul>
            ) : (
              <div className="min-h-[48px]" />
            )}
          </div>
        ),
      }
    })
  }, [dateKeys, grouped, folderContents, activeKeys, openFilePreview, preview?.subpath])

  if (!(dhId && sessionId)) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6">
        <Empty type="failed" title="加载失败" />
      </div>
    )
  }

  if (rootLoading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
        <Spin />
      </div>
    )
  }

  if (rootError || !root) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6">
        <Empty title="暂无数据" />
      </div>
    )
  }

  if (dateKeys.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6">
        <Empty title="暂无数据" />
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-col px-6 py-5">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-[--dip-border-color] bg-[--dip-white]">
            <div className="flex h-10 shrink-0 items-center justify-between gap-4 border-b border-[--dip-border-color] bg-[#F5F5F4] px-6 text-[--dip-text-color-65]">
              <span>文件名称</span>
              <span className="w-36">更新时间</span>
            </div>
            <ScrollBarContainer className="min-h-0 min-w-0 flex-1 overflow-auto">
              <Collapse
                activeKey={activeKeys}
                bordered={false}
                className={classNames('bg-transparent', styles.collapse)}
                items={collapseItems}
                onChange={(keys) => {
                  setActiveKeys(Array.isArray(keys) ? keys : [keys])
                }}
              />
            </ScrollBarContainer>
          </div>
        </div>
      </div>
      {preview !== null && (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col border-l border-[--dip-border-color] bg-[--dip-white]">
          <ArchivePreviewPanel
            preview={preview}
            showHeader
            onClose={closePreview}
            onDownload={() => downloadFile(preview.subpath, preview.title)}
            showInlineDownload={false}
            onEnterPreviewFullscreen={() => setPreviewFullscreenOpen(true)}
          />
        </div>
      )}
      {preview !== null && previewFullscreenOpen && (
        <ArchivePreviewDrawer
          open={previewFullscreenOpen}
          preview={preview}
          getContainer={resolveDrawerContainer}
          isPreviewFullscreen
          showInlineDownload={false}
          onClose={() => {
            setPreviewFullscreenOpen(false)
            closePreview()
          }}
          onExitPreviewFullscreen={() => setPreviewFullscreenOpen(false)}
          onDownload={() => downloadFile(preview.subpath, preview.title)}
        />
      )}
    </div>
  )
}

export default ResultsPanel
