import { PlusOutlined } from '@ant-design/icons'
import { Button, Empty, Steps, Tabs, Tag } from 'antd'
import { memo, useState } from 'react'
import ScrollBarContainer from '@/components/ScrollBarContainer'

const SkillConfig = () => {
  const [activeKey, setActiveKey] = useState<'configured' | 'create'>('configured')
  const [currentStep, setCurrentStep] = useState(0)

  const configuredSkills: Array<{
    id: number
    name: string
    desc: string
    status: 'online' | 'offline'
    calls: number
  }> = [
    {
      id: 1,
      name: '日报生成',
      desc: '根据运营数据自动生成日报和关键指标解读。',
      status: 'online',
      calls: 3254,
    },
    {
      id: 2,
      name: '用户留言整理',
      desc: '自动归类用户反馈和留言，生成结构化列表。',
      status: 'online',
      calls: 1287,
    },
  ]

  const hasConfiguredSkills = configuredSkills.length > 0

  return (
    <div className="h-full flex flex-col gap-y-3">
      <div className="px-4 text-sm font-medium text-[--dip-text-color]">技能配置</div>
      <ScrollBarContainer className="px-4">
        <Tabs
          activeKey={activeKey}
          onChange={(key) => setActiveKey(key as 'configured' | 'create')}
          items={[
            {
              key: 'configured',
              label: '已配置技能',
              children: (
                <div className="pt-3">
                  {!hasConfiguredSkills ? (
                    <div className="py-10">
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                          <div className="text-xs text-[--dip-text-color-65]">
                            暂未配置任何技能，您可以创建第一个技能来拓展数字员工能力。
                          </div>
                        }
                      >
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => setActiveKey('create')}>
                          创建技能
                        </Button>
                      </Empty>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {configuredSkills.map((skill) => (
                        <div
                          key={skill.id}
                          className="flex flex-col gap-2 rounded-lg border border-[#E3E8EF] bg-white p-3 text-sm text-[--dip-text-color]"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xs px-1.5 py-0.5 rounded bg-[#F5F5F5] text-[--dip-text-color-65]">
                                工具技能
                              </span>
                              <span className="font-medium text-sm truncate">{skill.name}</span>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <span className="text-xs text-[--dip-text-color-45]">
                                近7日调用 {skill.calls.toLocaleString()}
                              </span>
                              <Tag
                                color={skill.status === 'online' ? 'success' : 'default'}
                                className="m-0 text-xs"
                              >
                                {skill.status === 'online' ? '已启用' : '已停用'}
                              </Tag>
                            </div>
                          </div>
                          <div className="text-xs text-[--dip-text-color-65] leading-5">{skill.desc}</div>
                          <div className="flex justify-end gap-2 mt-1 text-xs">
                            <Button type="link" size="small">
                              编辑
                            </Button>
                            <Button type="link" size="small" danger>
                              停用
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ),
            },
            {
              key: 'create',
              label: '创建技能',
              children: (
                <div className="pt-3">
                  <div className="rounded-xl border border-[#E3E8EF] bg-white p-4 text-sm text-[--dip-text-color]">
                    <Steps
                      size="small"
                      current={currentStep}
                      className="mb-6"
                      items={[
                        { title: '选择技能模板' },
                        { title: '配置输入输出' },
                        { title: '确认与发布' },
                      ]}
                    />

                    {currentStep === 0 && (
                      <div className="grid grid-cols-3 gap-3">
                        {['日报生成', 'SQL 生成', '埋点分析', 'FAQ 问答'].map((tpl) => (
                          <button
                            key={tpl}
                            type="button"
                            className="flex flex-col gap-1 rounded-lg border border-[#E3E8EF] bg-[#F9FAFC] p-3 text-left hover:border-[--dip-primary-color] hover:bg-white transition-colors"
                          >
                            <span className="text-xs font-medium text-[--dip-text-color]">{tpl}</span>
                            <span className="text-[11px] leading-4 text-[--dip-text-color-65]">
                              选择后自动带入推荐配置，您也可以在后续步骤中调整。
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {currentStep === 1 && (
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-[--dip-text-color-65]">输入参数示例</span>
                          <div className="rounded-lg bg-[#F9FAFC] p-3 text-xs text-[--dip-text-color] leading-5">
                            例如：生成本周运营数据日报，重点关注新增用户数、DAU 和留存率。
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-[--dip-text-color-65]">输出示例</span>
                          <div className="rounded-lg bg-[#F9FAFC] p-3 text-xs text-[--dip-text-color] leading-5">
                            返回结构化 JSON，包括指标表格、图表建议以及自然语言结论摘要。
                          </div>
                        </div>
                      </div>
                    )}

                    {currentStep === 2 && (
                      <div className="flex flex-col gap-3 text-xs text-[--dip-text-color-65]">
                        <div className="rounded-lg bg-[#F9FAFC] p-3 leading-5">
                          请确认技能名称、适用场景和输入输出示例是否正确。发布后，数字员工将在相关任务中自动推荐使用该技能。
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-2 mt-6">
                      <Button
                        disabled={currentStep === 0}
                        onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                      >
                        上一步
                      </Button>
                      <Button
                        type="primary"
                        onClick={() =>
                          setCurrentStep((s) => {
                            if (s >= 2) return 2
                            return s + 1
                          })
                        }
                      >
                        {currentStep >= 2 ? '完成' : '下一步'}
                      </Button>
                    </div>
                  </div>
                </div>
              ),
            },
          ]}
        />
      </ScrollBarContainer>
    </div>
  )
}

export default memo(SkillConfig)

