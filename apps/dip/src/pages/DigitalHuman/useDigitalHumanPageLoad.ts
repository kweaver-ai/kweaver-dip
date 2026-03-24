import { message } from 'antd'
import { useEffect, useState } from 'react'
import { getDigitalHumanDetail, getDigitalHumanSkills } from '@/apis'
import {
  type DigitalHumanUiMode,
  useDigitalHumanStore,
} from '@/components/DigitalHumanSetting/digitalHumanStore'
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
  const { setCollapsed } = useGlobalLayoutStore()
  const [loading, setLoading] = useState(enabled)

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
        // const result: any = {
        //   id: digitalHumanId,
        //   name: '测试数字员工',
        //   creature: '测试岗位',
        //   soul: '测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂测试灵魂\n测试灵魂测试灵魂测试灵魂',
        //   skills: [
        //     { name: '技能1', description: '技能1描述' },
        //     { name: '技能2', description: '技能2描述' },
        //     { name: '技能3', description: '技能3描述' },
        //   ],
        //   bkn: [
        //     { name: '知识源1', url: '知识源1' },
        //     { name: '知识源2', url: '知识源2' },
        //     { name: '知识源3', url: '知识源3' },
        //   ],
        //   channel: { type: 'feishu', appId: '1234567890', appSecret: '1234567890' },
        //   updated_at: new Date().toISOString(),
        //   updated_by: '张三',
        // }
        // bindDigitalHuman(result)
        if (cancelled) return
        bindDigitalHuman({
          ...detail,
          skills: agentSkills,
        })
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
