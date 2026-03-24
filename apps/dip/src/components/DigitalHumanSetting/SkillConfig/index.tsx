import { Button, Flex, Table, Tooltip } from 'antd'
import { memo, useMemo, useState } from 'react'
import type { DigitalHumanSkill } from '@/apis'
import type { AiPromptSubmitPayload } from '@/components/DipChatKit/components/AiPromptInput/types.ts'
import Empty from '@/components/Empty'
import IconFont from '@/components/IconFont'
import ScrollBarContainer from '@/components/ScrollBarContainer'
import { useDigitalHumanStore } from '../digitalHumanStore'
import AddSkillDrawer from './AddSkillDrawer.tsx'
import styles from './index.module.less'
import SelectSkillModal from './SelectSkillModal.tsx.tsx'

interface SkillConfigProps {
  readonly?: boolean
}

const SkillConfig = ({ readonly }: SkillConfigProps) => {
  const { skills, deleteSkill, updateSkills, digitalHumanId } = useDigitalHumanStore()
  const [selectSkillModalOpen, setSelectSkillModalOpen] = useState(false)
  const [addSkillDrawerOpen, setAddSkillDrawerOpen] = useState(false)
  const [skillListRefreshToken, setSkillListRefreshToken] = useState(0)
  const [addSkillDrawerPayload, setAddSkillDrawerPayload] = useState<AiPromptSubmitPayload | null>(
    null,
  )
  /** 添加技能 */
  const handleAddSkill = () => {
    setSelectSkillModalOpen(true)
  }

  /** 菜单项处理 */
  const handleMenuItemClick = (key: 'edit' | 'delete', record: DigitalHumanSkill) => {
    switch (key) {
      case 'edit':
        console.log('edit', record)
        break

      case 'delete':
        deleteSkill(record.name)
        break

      default:
        break
    }
  }

  // 技能表格列定义
  const skillColumns = useMemo(() => {
    const columns = [
      {
        title: '技能名称',
        dataIndex: 'name',
        key: 'name',
        width: '40%',
        render: (text: string) => {
          return (
            <div className="flex items-center gap-2 truncate">
              <IconFont
                type="icon-dip-deep-thinking"
                className="text-[--dip-primary-color] text-xl h-6 w-6 shrink-0"
              />
              <span title={text} className="truncate">
                {text || '--'}
              </span>
            </div>
          )
        },
      },
      {
        title: '功能描述',
        dataIndex: 'description',
        key: 'description',
        ellipsis: true,
        render: (text: string) => text || '--',
      },
      {
        title: '操作',
        key: 'action',
        width: 80,
        render: (_: unknown, record: DigitalHumanSkill) => (
          <Flex align="center">
            {/* <Tooltip title="编辑">
              <Button
                type="text"
                onClick={(e) => {
                  e.stopPropagation()
                  handleMenuItemClick('edit', record)
                }}
                icon={<IconFont type="icon-dip-shezhi" />}
              />
            </Tooltip> */}
            <Tooltip title="删除">
              <Button
                type="text"
                onClick={(e) => {
                  e.stopPropagation()
                  handleMenuItemClick('delete', record)
                }}
                icon={<IconFont type="icon-dip-trash" />}
              />
            </Tooltip>
          </Flex>
        ),
      },
    ]
    return readonly ? columns.slice(0, 2) : columns
  }, [readonly])

  return (
    <ScrollBarContainer className="h-full flex flex-col p-6">
      <div className="flex justify-between mb-4">
        <div className="flex flex-col gap-y-1">
          <div className="font-medium text-[--dip-text-color]">技能配置</div>
          <div className="text-[--dip-text-color-45]">
            选择该数字员工需要具备的技能，也可通过自然语言创建新技能。
          </div>
        </div>
        {skills.length > 0 && !readonly && (
          <div className="flex items-end gap-x-3">
            {/* <SearchInput onSearch={handleSearch} placeholder="搜索技能" variant="outlined" /> */}
            <Button type="primary" icon={<IconFont type="icon-dip-add" />} onClick={handleAddSkill}>
              技能
            </Button>
          </div>
        )}
      </div>
      <Table<DigitalHumanSkill>
        dataSource={skills}
        columns={skillColumns}
        pagination={false}
        className={styles['skills-table']}
        rowKey={(record) => record.name}
        bordered={false}
        size="small"
        scroll={{ y: 'max(246px, calc(100vh - 326px))' }}
        locale={{
          emptyText: (
            <Empty type="empty" title="暂无技能">
              {readonly ? undefined : (
                <Button
                  icon={<IconFont type="icon-dip-add" />}
                  type="primary"
                  onClick={handleAddSkill}
                >
                  技能
                </Button>
              )}
            </Empty>
          ),
        }}
      />
      <SelectSkillModal
        open={selectSkillModalOpen}
        showMask={!addSkillDrawerOpen}
        digitalHumanId={digitalHumanId}
        refreshToken={skillListRefreshToken}
        onOk={(result) => {
          updateSkills(result || [])
          setSelectSkillModalOpen(false)
        }}
        onSubmit={(payload) => {
          console.log('payload', payload)
          setAddSkillDrawerPayload(payload)
          setAddSkillDrawerOpen(true)
        }}
        onCancel={() => setSelectSkillModalOpen(false)}
        defaultSelectedSkills={skills}
      />
      <AddSkillDrawer
        open={addSkillDrawerOpen}
        payload={addSkillDrawerPayload ?? undefined}
        onClose={() => {
          setAddSkillDrawerOpen(false)
          setAddSkillDrawerPayload(null)
          setSkillListRefreshToken((prev) => prev + 1)
        }}
      />
    </ScrollBarContainer>
  )
}

export default memo(SkillConfig)
