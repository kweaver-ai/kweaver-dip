import { message, Spin, Tabs } from 'antd'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { DigitalHumanSkill } from '@/apis'
import { downloadSkillFile, getEnabledSkills, getSkillFileContent } from '@/apis'
import IconFont from '@/components/IconFont'
import {
  mockFetchEnabledSkills,
  mockFetchSkillFileContent,
  SKILL_DETAIL_USE_MOCK,
} from '@/components/SkillDetail/mockSkillDetail'
import SkillFilesTab from '@/components/SkillDetail/SkillFilesTab'
import SkillMdTab from '@/components/SkillDetail/SkillMdTab'
import type { SkillDetailTabKey } from '@/components/SkillDetail/types'
import {
  ArchivePreviewDrawer,
  type ArchivePreviewState,
} from '@/components/WorkPlanDetail/Outcome/Preview'
import {
  getArchiveFileMimeForBlob,
  getArchiveTextPreviewViewer,
} from '@/components/WorkPlanDetail/Outcome/utils'
import { useBreadcrumbDetailStore } from '@/stores'
import { DEFAULT_SKILL_ICON_COLORS, getMatchedColorByName } from '@/utils/handle-function'
import styles from './index.module.less'

function decodeSkillNameParam(raw: string | undefined): string {
  if (!raw) return ''
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

function fileNameFromPath(path: string): string {
  const i = path.lastIndexOf('/')
  return i >= 0 ? path.slice(i + 1) : path
}

const SkillsDetailPage = () => {
  const { skillName: skillNameParam } = useParams<{ skillName: string }>()
  const navigate = useNavigate()
  const [messageApi, messageContextHolder] = message.useMessage()
  const setDetailBreadcrumb = useBreadcrumbDetailStore((s) => s.setDetailBreadcrumb)
  const containerRef = useRef<HTMLDivElement>(null)
  const decodedName = useMemo(() => decodeSkillNameParam(skillNameParam), [skillNameParam])

  const [pageLoading, setPageLoading] = useState(true)
  const [skillMeta, setSkillMeta] = useState<DigitalHumanSkill | null>(null)

  const [activeTab, setActiveTab] = useState<SkillDetailTabKey>('skill-md')

  const [filePreview, setFilePreview] = useState<ArchivePreviewState | null>(null)

  const handleBack = useCallback(() => {
    navigate('/studio/skills')
  }, [navigate])

  const tabItems = useMemo(
    () => [
      {
        key: 'skill-md',
        label: (
          <span className="inline-flex items-center gap-1">
            <IconFont type="icon-document" />
            SKILL.md
          </span>
        ),
      },
      {
        key: 'files',
        label: (
          <span className="inline-flex items-center gap-1">
            <IconFont type="icon-doclib" />
            文件列表
          </span>
        ),
      },
    ],
    [],
  )

  const handleTabChange = (key: string) => {
    setActiveTab(key as SkillDetailTabKey)
  }

  useEffect(() => {
    if (!decodedName) {
      navigate('/studio/skills', { replace: true })
    }
  }, [decodedName, navigate])

  useEffect(() => {
    return () => setDetailBreadcrumb(null)
  }, [setDetailBreadcrumb])

  useEffect(() => {
    const title = skillMeta?.name?.trim() || decodedName
    setDetailBreadcrumb(title && decodedName ? { routeKey: 'skill-item', title } : null)
  }, [skillMeta, decodedName, setDetailBreadcrumb])

  useEffect(() => {
    if (!decodedName) return

    let cancelled = false

    const load = async () => {
      setPageLoading(true)
      let list: DigitalHumanSkill[] = []
      try {
        list = SKILL_DETAIL_USE_MOCK
          ? await mockFetchEnabledSkills(decodedName)
          : await getEnabledSkills()
      } catch {
        list = []
      }
      if (cancelled) return

      const found = list.find((s) => s.name === decodedName)
      if (!found) {
        messageApi.error('技能不存在')
        navigate('/studio/skills', { replace: true })
        return
      }

      setSkillMeta(found)
      if (!cancelled) setPageLoading(false)
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [decodedName, messageApi, navigate])

  const handleFileClick = useCallback(
    (path: string) => {
      if (!decodedName) return
      const title = fileNameFromPath(path)
      setFilePreview({
        title,
        subpath: path,
        body: '',
        loading: true,
        viewer: getArchiveTextPreviewViewer(title),
        error: null,
      })

      void (async () => {
        try {
          const res = SKILL_DETAIL_USE_MOCK
            ? await mockFetchSkillFileContent(decodedName, { path })
            : await getSkillFileContent(decodedName, { path })
          const body = res.content + (res.truncated ? '\n\n（预览已截断，服务端可能限制长度）' : '')
          setFilePreview((p) =>
            p
              ? {
                  ...p,
                  body,
                  loading: false,
                  viewer: getArchiveTextPreviewViewer(title),
                  error: null,
                }
              : null,
          )
        } catch {
          setFilePreview((p) =>
            p
              ? {
                  ...p,
                  body: '',
                  loading: false,
                  viewer: 'text',
                  error: '文件内容加载失败',
                }
              : null,
          )
        }
      })()
    },
    [decodedName],
  )

  const closePreview = useCallback(() => {
    setFilePreview(null)
  }, [])

  const handleDownload = useCallback(async () => {
    if (!decodedName) return
    const subpath = filePreview?.subpath
    if (!subpath) return
    const name = fileNameFromPath(subpath)
    try {
      const res = await downloadSkillFile(decodedName, { path: subpath })
      if (!(res instanceof ArrayBuffer)) {
        messageApi.error('文件数据格式异常')
        return
      }
      const blob = new Blob([res], { type: getArchiveFileMimeForBlob(name) })
      const blobUrl = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = blobUrl
      anchor.download = name || 'download'
      anchor.style.display = 'none'
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(blobUrl)
    } catch {
      messageApi.error('下载失败')
    }
  }, [decodedName, filePreview, messageApi])

  if (!decodedName) {
    return null
  }

  if (pageLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-[--dip-white]">
        <Spin />
      </div>
    )
  }

  const title = skillMeta?.name ?? decodedName
  const description = skillMeta?.description

  return (
    <div
      className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[--dip-white]"
      ref={containerRef}
    >
      {messageContextHolder}
      <div className="grid h-12 flex-shrink-0 grid-cols-3 items-center gap-2 border-b border-[--dip-border-color] pl-3 pr-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[--dip-text-color]"
          >
            <IconFont type="icon-left" />
          </button>
          <div
            className="flex h-9 w-9 shrink-0 items-end overflow-hidden rounded-md pb-0.5 pl-1"
            style={{
              backgroundColor: getMatchedColorByName(title, DEFAULT_SKILL_ICON_COLORS),
            }}
          >
            <span className="text-[8px] text-white">skill</span>
          </div>
          <div className="flex flex-col gap-1 truncate">
            <span className="block truncate font-medium text-[--dip-text-color]" title={title}>
              {title}
            </span>
            <span className="block truncate text-xs text-[--dip-text-color-65]" title={description}>
              {description}
            </span>
          </div>
        </div>
        <div className="flex min-w-0 justify-center self-end">
          <Tabs
            indicator={{ size: 0 }}
            size="small"
            activeKey={activeTab}
            onChange={handleTabChange}
            items={tabItems}
            className={styles.tabs}
            styles={{
              header: { padding: '0', margin: '0' },
              indicator: { backgroundColor: 'var(--dip-text-color)' },
            }}
          />
        </div>
        <div className="min-w-0" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {activeTab === 'skill-md' && (
          <div className="flex min-h-0 flex-1 flex-col">
            <SkillMdTab skillName={decodedName} />
          </div>
        )}
        {activeTab === 'files' && (
          <div className="flex min-h-0 flex-1 flex-col px-6 pb-6 pt-4">
            <SkillFilesTab
              skillName={decodedName}
              onFileClick={handleFileClick}
              selectedPath={filePreview?.subpath}
            />
          </div>
        )}
      </div>

      <ArchivePreviewDrawer
        open={filePreview !== null}
        preview={filePreview}
        onClose={closePreview}
        onDownload={handleDownload}
        getContainer={() => containerRef.current ?? document.body}
      />
    </div>
  )
}

export default memo(SkillsDetailPage)
