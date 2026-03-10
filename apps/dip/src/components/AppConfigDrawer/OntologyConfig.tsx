import { CheckCircleOutlined, InfoCircleOutlined, ShareAltOutlined } from '@ant-design/icons'
import { Alert, message, Spin, Tag } from 'antd'
import { memo, useEffect, useState } from 'react'
import { getApplicationsOntologies, type OntologyInfo } from '@/apis'
import ScrollBarContainer from '../ScrollBarContainer'

interface OntologyConfigProps {
  appId?: number
}

const OntologyConfig = ({ appId }: OntologyConfigProps) => {
  const [messageApi, messageContextHolder] = message.useMessage()
  const [loading, setLoading] = useState(false)
  const [ontologies, setOntologies] = useState<OntologyInfo[]>([])

  useEffect(() => {
    if (appId) {
      loadOntologies()
    } else {
      setOntologies([])
    }
  }, [appId])

  const loadOntologies = async () => {
    if (!appId) return
    setLoading(true)
    try {
      const data = await getApplicationsOntologies(appId)
      setOntologies(data)
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
      <div className="px-4 text-sm font-medium text-[--dip-text-color]">业务知识网络</div>

      {/* 提示信息框 */}
      <Alert
        title="此应用依赖以下业务知识网络。请前往 ADP 平台完成数据视图映射，以确保应用能获取数据。"
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

      {/* 业务知识网络列表 */}
      <ScrollBarContainer className="px-4">
        <div className="flex flex-col gap-y-3">
          {ontologies.length === 0 ? (
            <div className="text-center text-[--dip-text-color-secondary] py-8">
              暂无业务知识网络配置
            </div>
          ) : (
            ontologies.map((item) => {
              // const isConfigured = item?.is_config ?? false

              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-y-2 rounded-lg border border-[#E3E8EF] bg-white p-3"
                >
                  {/* 标题和状态标签 */}
                  <div className="flex items-center justify-between">
                    <div
                      className="text-xs font-medium text-[--dip-text-color] truncate flex-1"
                      title={item.name}
                    >
                      {item.name || `业务知识网络 #${item.id}`}
                    </div>
                    {/* <Tag
                      icon={isConfigured ? <CheckCircleOutlined /> : <InfoCircleOutlined />}
                      color={isConfigured ? 'success' : 'warning'}
                      className="m-0 rounded border flex-shrink-0"
                      style={{
                        fontSize: '12px',
                        lineHeight: '20px',
                        backgroundColor: isConfigured ? '#F6FFED' : '#FFFBE6',
                        borderColor: isConfigured ? '#D9F7BE' : '#FFF1B8',
                        color: isConfigured ? '#52C41A' : '#FAAD14',
                      }}
                    >
                      {isConfigured ? '已配置' : '待配置'}
                    </Tag> */}
                  </div>

                  {/* 描述 */}
                  {item.comment && (
                    <div className="text-xs text-[rgba(0,0,0,0.45)] flex-1 leading-5">
                      {item.comment}
                    </div>
                  )}

                  {/* 链接 */}
                  <a
                    href={`${window.location.origin}/studio/ontology/ontology-manage/main/overview?id=${item.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-2 text-xs text-[--dip-primary-color] hover:text-[var(--dip-primary-color)] hover:underline"
                  >
                    <ShareAltOutlined />
                    前往ADP平台配置数据视图映射
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

export default memo(OntologyConfig)
