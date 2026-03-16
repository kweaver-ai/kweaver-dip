import { Alert, Button, Empty, Tag } from 'antd'
import { memo } from 'react'
import ScrollBarContainer from '@/components/ScrollBarContainer'

const KnowledgeConfig = () => {
  const knowledgeItems: Array<{
    id: number
    name: string
    type: 'doc' | 'faq' | 'db'
    source: string
    docs: number
    updatedAt: string
  }> = [
    {
      id: 1,
      name: '运营手册知识库',
      type: 'doc',
      source: '知识中心 · 文档库',
      docs: 128,
      updatedAt: '2026-03-10 18:20',
    },
    {
      id: 2,
      name: '常见问题 FAQ',
      type: 'faq',
      source: '客服 FAQ 库',
      docs: 56,
      updatedAt: '2026-03-12 09:15',
    },
  ]

  const hasKnowledge = knowledgeItems.length > 0

  return (
    <div className="h-full flex flex-col gap-y-3">
      <div className="px-4 text-sm font-medium text-[--dip-text-color]">知识配置</div>
      <ScrollBarContainer className="px-4">
        <div className="flex flex-col gap-3 pb-6">
          <Alert
            type="info"
            showIcon
            className="border-[#BAE0FF] bg-[#E6F4FF]"
            message={
              <div className="text-xs text-[--dip-text-color] leading-5">
                数字员工会基于下方配置的知识库回答业务问题。建议将核心业务手册、FAQ 和规章制度等内容统一沉淀到知识库中。
              </div>
            }
          />

          <div className="flex justify-between items-center mt-1">
            <div className="text-xs text-[--dip-text-color-65]">
              已关联
              <span className="mx-1 text-[--dip-text-color] font-medium">{knowledgeItems.length}</span>
              个知识源
            </div>
            <Button type="primary" size="small">
              关联知识库
            </Button>
          </div>

          <div className="rounded-xl border border-[#E3E8EF] bg-white p-3 text-sm text-[--dip-text-color]">
            {!hasKnowledge ? (
              <div className="py-10">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <div className="text-xs text-[--dip-text-color-65]">
                      暂未关联任何知识库，建议先在知识中心创建知识库并完成内容建设。
                    </div>
                  }
                >
                  <Button type="primary" size="small">
                    去创建知识库
                  </Button>
                </Empty>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-[#F2F4F7]">
                {knowledgeItems.map((item) => (
                  <div key={item.id} className="flex items-center py-2.5 gap-3">
                    <div className="flex flex-col flex-1 min-w-0 gap-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-medium text-[--dip-text-color] truncate">
                          {item.name}
                        </span>
                        <Tag className="m-0 text-xs border-[#E3E8EF] text-[--dip-text-color-65]">
                          {item.type === 'doc' && '文档'}
                          {item.type === 'faq' && 'FAQ'}
                          {item.type === 'db' && '数据表'}
                        </Tag>
                      </div>
                      <div className="text-xs text-[--dip-text-color-45] flex flex-wrap gap-3">
                        <span>来源：{item.source}</span>
                        <span>文档数：{item.docs}</span>
                        <span>最近更新：{item.updatedAt}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 text-xs">
                      <Button type="link" size="small">
                        预览
                      </Button>
                      <Button type="link" size="small">
                        替换
                      </Button>
                      <Button type="link" size="small" danger>
                        移除
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </ScrollBarContainer>
    </div>
  )
}

export default memo(KnowledgeConfig)

