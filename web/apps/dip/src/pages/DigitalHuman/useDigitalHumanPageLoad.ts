import { message } from 'antd'
import { useEffect, useState } from 'react'
import { getDigitalHumanDetail, getDigitalHumanSkills } from '@/apis'
import {
  type DigitalHumanUiMode,
  useDigitalHumanStore,
} from '@/components/DigitalHumanSetting/digitalHumanStore'
import { useBreadcrumbDetailStore } from '@/stores'
import { useGlobalLayoutStore } from '@/stores/globalLayoutStore'

export type DigitalHumanPageVariant = 'detail' | 'setting'

/**
 * 数字员工数据加载
 * - `detail`：非管理员详情，始终只读 view（无新建/编辑）
 * - `setting`：管理员全页；无 id 新建；有 id 时 `mode=edit` 为编辑否则只读
 */
export function useDigitalHumanPageLoad(
  digitalHumanId: string | undefined,
  variant: DigitalHumanPageVariant,
  modeFromQuery: string | null,
  enabled: boolean = true,
): boolean {
  const { bindDigitalHuman, reset, setUiMode } = useDigitalHumanStore()
  const basicName = useDigitalHumanStore((s) => s.basic.name)
  const uiMode = useDigitalHumanStore((s) => s.uiMode)
  const frozenDisplayNameForEdit = useDigitalHumanStore((s) => s.frozenDisplayNameForEdit)
  const storeDigitalHumanId = useDigitalHumanStore((s) => s.digitalHumanId)
  const setDetailBreadcrumb = useBreadcrumbDetailStore((s) => s.setDetailBreadcrumb)
  const { setCollapsed } = useGlobalLayoutStore()
  const [loading, setLoading] = useState(enabled)

  useEffect(() => {
    if (!enabled) {
      setDetailBreadcrumb(null)
      return
    }
    if (!digitalHumanId) {
      setDetailBreadcrumb(null)
      return
    }
    if (storeDigitalHumanId !== digitalHumanId) {
      setDetailBreadcrumb(null)
      return
    }
    const routeKey = variant === 'detail' ? 'digital-human-detail' : 'digital-human-setting-item'
    const title =
      variant === 'setting' && uiMode === 'edit'
        ? (frozenDisplayNameForEdit ?? basicName)?.trim()
        : basicName?.trim()
    if (title) {
      setDetailBreadcrumb({ routeKey, title })
    } else {
      setDetailBreadcrumb(null)
    }
    return () => setDetailBreadcrumb(null)
  }, [
    basicName,
    digitalHumanId,
    enabled,
    frozenDisplayNameForEdit,
    setDetailBreadcrumb,
    storeDigitalHumanId,
    uiMode,
    variant,
  ])

  useEffect(() => {
    // setCollapsed(true)
  }, [setCollapsed])

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }

    let cancelled = false

    const resolveMode = (): DigitalHumanUiMode => {
      if (variant === 'detail') return 'view'
      if (!digitalHumanId) return 'create'
      if (modeFromQuery === 'edit') return 'edit'
      return 'view'
    }

    const run = async () => {
      if (!digitalHumanId) {
        if (variant === 'setting') {
          setUiMode('create')
          if (!cancelled) {
            reset()
            setLoading(false)
          }
          return
        }
        if (!cancelled) setLoading(false)
        return
      }

      setUiMode(resolveMode())
      if (!cancelled) setLoading(true)
      try {
        const [detail, agentSkills] = await Promise.all([
          getDigitalHumanDetail(digitalHumanId),
          getDigitalHumanSkills(digitalHumanId),
        ])
        if (cancelled) return
        bindDigitalHuman(detail, agentSkills)
      } catch (err: unknown) {
        if (cancelled) return
        const desc =
          err !== null &&
          typeof err === 'object' &&
          'description' in err &&
          typeof (err as { description?: unknown }).description === 'string'
            ? (err as { description: string }).description
            : undefined
        message.error(desc || '获取数字员工详情失败')
        setUiMode('view')
        reset()
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [digitalHumanId, variant, modeFromQuery, enabled, bindDigitalHuman, reset, setUiMode])

  return loading
}
