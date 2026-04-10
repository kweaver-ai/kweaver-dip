import { Button, Flex, Table, Tooltip } from 'antd'
import { memo, useMemo, useState } from 'react'
import type { DigitalHumanSkill } from '@/apis'
import type { AiPromptSubmitPayload } from '@/components/DipChatKit/components/AiPromptInput/types.ts'
import Empty from '@/components/Empty'
import IconFont from '@/components/IconFont'
import ScrollBarContainer from '@/components/ScrollBarContainer'
import { DEFAULT_SKILL_ICON_COLORS, getMatchedColorByName } from '@/utils/handle-function'
import { useDigitalHumanStore } from '../digitalHumanStore'
import AddSkillDrawer from './AddSkillDrawer.tsx'
import styles from './index.module.less'
import SelectSkillModal from './SelectSkillModal'

interface SkillConfigProps {
  readonly?: boolean
}

const SkillConfig = ({ readonly }: SkillConfigProps) => {
  const { skills, deleteSkill, updateSkills, digitalHumanId } = useDigitalHumanStore()
  const [selectSkillModalOpen, setSelectSkillModalOpen] = useState(false)
  const [addSkillDrawerOpen, setAddSkillDrawerOpen] = useState(false)
  const [skillListRefreshToken, setSkillListRefreshToken] = useState(0)
  const [addSkillDrawerPayload, setAddSkillDrawerPayload] = useState<
    AiPromptSubmitPayload | undefined
  >(undefined)
  /** 添加技能 */
  const handleAddSkill = () => {
    setSelectSkillModalOpen(true)
  }

  /** 菜单项处理 */
  const handleMenuItemClick = (key: 'edit' | 'delete', record: DigitalHumanSkill) => {
    switch (key) {
      case 'edit':
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
        width: '28%',
        render: (text: string, record: DigitalHumanSkill) => {
          return (
            <div className="flex items-center truncate gap-x-2">
              <div
                className="flex h-8 w-8 pl-1 pb-0.5 shrink-0 items-end rounded text-[8px] font-semibold leading-tight text-white"
                style={{
                  backgroundColor: getMatchedColorByName(text, DEFAULT_SKILL_ICON_COLORS),
                }}
              >
                skill
              </div>
              <span title={text} className="truncate">
                {text || '--'}
              </span>
              <span className="text-xs text-[#A0A0A9] font-normal flex-shrink-0">
                @{record.built_in ? '内置' : record.type === 'openclaw-managed' ? '自定义' : '官方'}
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
            <Tooltip title={record.built_in ? '数字员工执行时所需的基本技能，不可移除' : '移除'}>
              <Button
                type="text"
                disabled={record.built_in}
                onClick={(e) => {
                  e.stopPropagation()
                  handleMenuItemClick('delete', record)
                }}
                icon={<IconFont type="icon-remove" />}
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
            <Button
              color="primary"
              icon={<IconFont type="icon-add" />}
              variant="outlined"
              onClick={handleAddSkill}
            >
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
        scroll={{ y: 'max(246px, calc(100vh - 299px))' }}
        locale={{
          emptyText: (
            <Empty type="empty" title="暂无技能">
              {readonly ? undefined : (
                <Button
                  icon={<IconFont type="icon-add" />}
                  color="primary"
                  variant="outlined"
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
        digitalHumanId={digitalHumanId}
        refreshToken={skillListRefreshToken}
        onOk={(result) => {
          updateSkills(result || [])
        }}
        onSubmit={(payload) => {
          setAddSkillDrawerPayload(payload)
          setAddSkillDrawerOpen(true)
          setSelectSkillModalOpen(false)
        }}
        onCancel={() => setSelectSkillModalOpen(false)}
        defaultSelectedSkills={skills}
      />
      <AddSkillDrawer
        open={addSkillDrawerOpen}
        payload={addSkillDrawerPayload ?? undefined}
        onClose={() => {
          setAddSkillDrawerOpen(false)
          setAddSkillDrawerPayload(undefined)
          setSkillListRefreshToken((prev) => prev + 1)
          setSelectSkillModalOpen(true)
        }}
      />
    </ScrollBarContainer>
  )
}

export default memo(SkillConfig)
