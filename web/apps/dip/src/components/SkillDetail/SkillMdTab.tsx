import { memo, useEffect, useState } from 'react'
import { getSkillFileContent } from '@/apis'
import Empty from '@/components/Empty'
import {
  ArchivePreviewPanel,
  type ArchivePreviewState,
} from '@/components/WorkPlanDetail/Outcome/Preview'
import { mockFetchSkillFileContent, SKILL_DETAIL_USE_MOCK } from './mockSkillDetail'
import { SkillTabStateShell } from './SkillTabStateShell'

export interface SkillMdTabProps {
  skillName: string
}

const SKILL_PREVIEW_TITLE = 'SKILL.md'
const SKILL_PREVIEW_SUBPATH = 'SKILL.md'

const SkillMdTab = ({ skillName }: SkillMdTabProps) => {
  const [preview, setPreview] = useState<ArchivePreviewState>({
    title: SKILL_PREVIEW_TITLE,
    subpath: SKILL_PREVIEW_SUBPATH,
    body: '',
    loading: true,
    viewer: 'markdown',
    error: null,
  })
  const [truncated, setTruncated] = useState(false)

  useEffect(() => {
    if (!skillName.trim()) return

    let cancelled = false

    const base: ArchivePreviewState = {
      title: SKILL_PREVIEW_TITLE,
      subpath: SKILL_PREVIEW_SUBPATH,
      body: '',
      loading: true,
      viewer: 'markdown',
      error: null,
    }
    setPreview(base)
    setTruncated(false)

    const load = async () => {
      try {
        const res = SKILL_DETAIL_USE_MOCK
          ? await mockFetchSkillFileContent(skillName, { path: 'SKILL.md' })
          : await getSkillFileContent(skillName)
        if (cancelled) return
        setPreview({
          ...base,
          body: res.content ?? '',
          loading: false,
          error: null,
        })
        setTruncated(res.truncated)
      } catch {
        if (cancelled) return
        setPreview({
          ...base,
          body: '',
          loading: false,
          error: 'SKILL.md 加载失败',
        })
        setTruncated(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [skillName])

  if (!skillName.trim()) {
    return (
      <SkillTabStateShell>
        <Empty type="empty" title="暂无技能" />
      </SkillTabStateShell>
    )
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#FAFAF9]">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <ArchivePreviewPanel preview={preview} />
      </div>
      {truncated ? (
        <p className="m-0 shrink-0 border-t border-[--dip-border-color] bg-[#FAFBFC] px-4 py-2 text-xs leading-5 text-[--dip-text-color-45]">
          （内容已截断）
        </p>
      ) : null}
    </div>
  )
}

export default memo(SkillMdTab)
