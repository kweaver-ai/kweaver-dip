import { Input, Select, Tag } from 'antd'
import { memo, useMemo, useState } from 'react'
import ScrollBarContainer from '@/components/ScrollBarContainer'

const BasicSetting = () => {
  const [name, setName] = useState('运营小助手')
  const [description, setDescription] = useState(
    '帮助运营同学完成日常数据统计、报表生成和用户消息回复等重复性工作。',
  )
  const [scene, setScene] = useState<string | undefined>('operation')
  const [tags, setTags] = useState<string[]>(['运营', '数据分析', '消息回复'])

  const sceneOptions = useMemo(
    () => [
      { label: '运营助理', value: 'operation' },
      { label: '销售助理', value: 'sales' },
      { label: '客服助理', value: 'cs' },
      { label: '通用助手', value: 'general' },
    ],
    [],
  )

  return (
    <div className="h-full flex flex-col gap-y-3">
      <div className="px-4 text-sm font-medium text-[--dip-text-color]">基本设定</div>
      <ScrollBarContainer className="px-4">
        <div className="flex flex-col gap-4 pb-6">
          {/* 顶部：头像 + 概览信息 */}
          <div className="flex gap-4 rounded-xl border border-[#E3E8EF] bg-white p-4 text-sm text-[--dip-text-color]">
            <div className="w-16 h-16 rounded-xl bg-[linear-gradient(135deg,#1C4DFA_0%,#3FA9F5_100%)] flex items-center justify-center text-white text-xl font-semibold shrink-0">
              {name?.[0] ?? '助'}
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-base font-medium text-[--dip-text-color] truncate">{name}</span>
                <Tag color="success" className="m-0 text-xs">
                  运行中
                </Tag>
              </div>
              <div className="text-xs text-[--dip-text-color-65] line-clamp-2">{description}</div>
              <div className="flex flex-wrap gap-2 mt-1">
                {tags.map((tag) => (
                  <Tag key={tag} className="m-0 text-xs border-[#E3E8EF] text-[--dip-text-color-65]">
                    {tag}
                  </Tag>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs text-[--dip-text-color-65] w-52">
              <div className="flex flex-col gap-0.5">
                <span>今日任务数</span>
                <span className="text-base font-medium text-[--dip-text-color]">128</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span>近7日完成率</span>
                <span className="text-base font-medium text-[--dip-success-color]">92%</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span>服务用户数</span>
                <span className="text-base font-medium text-[--dip-text-color]">56</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span>平均响应时长</span>
                <span className="text-base font-medium text-[--dip-text-color]">1.3s</span>
              </div>
            </div>
          </div>

          {/* 基础信息表单区域 */}
          <div className="rounded-xl border border-[#E3E8EF] bg-white p-4 text-sm text-[--dip-text-color]">
            <div className="mb-3 text-sm font-medium text-[--dip-text-color]">基础信息</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-[--dip-text-color-65]">数字员工名称</span>
                <Input
                  placeholder="请输入数字员工名称"
                  maxLength={32}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-[--dip-text-color-65]">使用场景</span>
                <Select
                  placeholder="请选择使用场景"
                  options={sceneOptions}
                  value={scene}
                  onChange={setScene}
                />
              </div>
              <div className="col-span-2 flex flex-col gap-1">
                <span className="text-xs text-[--dip-text-color-65]">简介</span>
                <Input.TextArea
                  placeholder="一句话介绍数字员工擅长做的事情，方便团队快速理解和选择使用"
                  rows={3}
                  maxLength={200}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="col-span-2 flex flex-col gap-1">
                <span className="text-xs text-[--dip-text-color-65]">标签</span>
                <Select
                  mode="tags"
                  placeholder="请输入标签并回车确认，如：运营、数据分析"
                  value={tags}
                  onChange={setTags}
                  tokenSeparators={[',', '，']}
                />
              </div>
            </div>
          </div>
        </div>
      </ScrollBarContainer>
    </div>
  )
}

export default memo(BasicSetting)

