import { ShareAltOutlined } from '@ant-design/icons'
import { Alert, message, Spin } from 'antd'
import { memo, useEffect, useState } from 'react'
import { type AgentInfo, getApplicationsAgents } from '@/apis'
import ScrollBarContainer from '../ScrollBarContainer'

interface AgentConfigProps {
  appId?: number
}

const AgentConfig = ({ appId }: AgentConfigProps) => {
  const [messageApi, messageContextHolder] = message.useMessage()
  const [loading, setLoading] = useState(false)
  const [agents, setAgents] = useState<AgentInfo[]>([])

  useEffect(() => {
    if (appId) {
      loadAgents()
    } else {
      setAgents([])
    }
  }, [appId])

  const loadAgents = async () => {
    if (!appId) return
    setLoading(true)
    try {
      const data = await getApplicationsAgents(appId)
      setAgents(data)
    } catch (error: any) {
      if (error?.description) {
        messageApi.error(error?.description)
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="absolute inset-0 left-40 flex items-center justify-center">
        <Spin />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col gap-y-2">
      {messageContextHolder}
      <div className="px-4 text-sm font-medium text-[--dip-text-color]">智能体配置</div>

      {/* 提示信息框 */}
      <Alert
        title="以下是此应用包含的智能体。您可以点击下方链接查看或调整智能体的详细配置（如知识来源、模型参数等）。"
        type="info"
        showIcon
        className="mx-4 border-[#BAE0FF] bg-[#E6F4FF]"
        styles={{
          root: {
            alignItems: 'flex-start',
          },
          icon: {
            paddingTop: '4px',
          },
        }}
      />

      {/* 智能体列表 */}
      <ScrollBarContainer className="px-4">
        <div className="flex flex-col gap-3">
          {agents.length === 0 ? (
            <div className="text-center text-[--dip-text-color-secondary] py-8">暂无智能体配置</div>
          ) : (
            agents.map((item) => {
              const prompt = ''
              const skills: any[] = []

              return (
                <div
                  key={item.id}
                  className="flex flex-col rounded-lg border border-[#E3E8EF] bg-white p-3"
                >
                  {/* 标题 */}
                  <div className="mb-2 text-xs leading-5 font-medium text-[--dip-text-color]">
                    {item.name || `智能体 #${item.id}`}
                  </div>

                  {/* 描述 */}
                  {item.profile && (
                    <div className="mb-3 text-xs leading-5 text-[--dip-text-color-45]">
                      {item.profile}
                    </div>
                  )}

                  {/* 提示词 */}
                  {prompt && (
                    <div className="mb-3 flex flex-col gap-y-2">
                      <div className="text-xs leading-5 text-[--dip-text-color-65]">提示词</div>
                      <div className="rounded-lg bg-[#F9FAFC] p-3.5 text-xs text-[--dip-text-color] leading-5">
                        {prompt}
                      </div>
                    </div>
                  )}

                  {/* 技能列表 */}
                  {skills.length > 0 && (
                    <div className="mb-3 flex flex-col gap-y-2">
                      <div className="text-xs leading-5 text-[--dip-text-color-65]">技能列表</div>
                      <div className="flex flex-col gap-y-1.5 pl-2">
                        {skills.map((skill: any) => (
                          <div key={skill.tool_id} className="flex items-start gap-3.5">
                            <div className="mt-2 h-1.5 w-1.5 rounded-full bg-[#D9D9D9] flex-shrink-0" />
                            <div className="text-xs text-[--dip-text-color] leading-5">
                              {skill?.tool_name}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 链接 */}
                  <a
                    href={`${window.location.origin}/studio/dataagent/agent-web-space/agent-web-myagents/config?agentId=${item.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-2 text-xs text-[var(--dip-primary-color)] hover:text-[var(--dip-primary-color)] hover:underline"
                  >
                    <ShareAltOutlined />
                    前往ADP平台查看详细配置
                  </a>
                </div>
              )
            })
          )}
        </div>
      </ScrollBarContainer>
    </div>
  )
}

export default memo(AgentConfig)
