import { Button, Checkbox, message, Spin } from 'antd'
import { memo, useEffect, useMemo, useState } from 'react'
import {
  type BuiltInDigitalHuman,
  createBuiltInDigitalHuman,
  getBuiltInDigitalHumanList,
} from '@/apis/dip-studio/digital-human'
import defaultDigitalHumanAvatar from '@/assets/images/bkn-creator.png'
import Empty from '@/components/Empty'
import { resolveDigitalHumanIconSrc } from '@/utils/digital-human/resolveDigitalHumanIcon'

type SelectPresetDigitalHumanStepProps = {
  onSkip: () => void
  onConfirmSuccess: () => void
}

const SelectPresetDigitalHumanStep = ({
  onSkip,
  onConfirmSuccess,
}: SelectPresetDigitalHumanStepProps) => {
  const [selected, setSelected] = useState(true)
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const [templates, setTemplates] = useState<BuiltInDigitalHuman[]>([])
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setListLoading(true)
      setListError(null)
      try {
        const data = await getBuiltInDigitalHumanList()
        if (cancelled) return
        setTemplates(Array.isArray(data) ? data : [])
      } catch (error: any) {
        if (cancelled) return
        setTemplates([])
        setListError(error?.description || '预置模板列表加载失败')
      } finally {
        if (!cancelled) setListLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const first = templates[0]
  const avatarSrc = useMemo(
    () => resolveDigitalHumanIconSrc(first?.icon_id, defaultDigitalHumanAvatar),
    [first?.icon_id],
  )

  const canSubmit = selected && Boolean(first) && !listLoading && listError === null
  const primaryDisabled = !canSubmit

  const handleConfirm = async () => {
    if (!first || primaryDisabled) return
    setCreating(true)
    try {
      await createBuiltInDigitalHuman(first.id)
      onConfirmSuccess()
    } catch (e: unknown) {
      const desc = e && typeof e === 'object' && 'description' in e ? String(e.description) : ''
      message.error(desc || '创建预置数字员工失败')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="w-full flex flex-col">
      <div className="font-bold text-[--dip-text-color] text-[26px]">选择预置数字员工</div>
      <div className="text-black/50 mt-3">数字员工将作为您的第二大脑，协助处理复杂任务</div>

      <div className="flex flex-col items-center justify-center min-h-[208px]">
        {listLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[208px]">
            <Spin />
          </div>
        ) : listError ? (
          <Empty title="加载失败" desc={listError} type="failed" />
        ) : !first ? (
          <Empty title="暂无预置数字员工模板" />
        ) : (
          <div className="self-center">
            <button
              type="button"
              className="flex flex-col items-center justify-center mt-4 w-[264px] bg-black/[0.02] rounded-md px-5 py-4 text-left relative hover:bg-black/[0.03] transition-colors"
              onClick={() => setSelected((v) => !v)}
            >
              <div className="absolute top-3 right-3">
                <Checkbox checked={selected} onChange={(e) => setSelected(e.target.checked)} />
              </div>

              <div className="w-[64px] h-[64px] rounded-full overflow-hidden flex items-center justify-center">
                <img src={avatarSrc} alt={first.name} className="w-full h-full object-cover" />
              </div>

              <div className="text-base font-medium text-[--dip-text-color] mt-1">{first.name}</div>
              <div className="mt-2 text-black/65 leading-6 text-center">
                {first.description?.trim()}
              </div>
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-center gap-3">
        <Button onClick={onSkip} style={{ width: '88px' }}>
          跳过
        </Button>
        <Button
          type="primary"
          onClick={() => void handleConfirm()}
          disabled={primaryDisabled}
          loading={creating}
        >
          立即安装
        </Button>
      </div>
    </div>
  )
}

export default memo(SelectPresetDigitalHumanStep)
