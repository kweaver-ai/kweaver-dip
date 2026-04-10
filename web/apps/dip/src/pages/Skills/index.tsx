import { ExclamationCircleFilled } from '@ant-design/icons'
import { Button, Modal, message, Spin, Tooltip } from 'antd'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { DigitalHumanSkill, GetEnabledSkillsParams } from '@/apis'
import { getEnabledSkills, uninstallSkill } from '@/apis'
import AddSkillDrawer from '@/components/DigitalHumanSetting/SkillConfig/AddSkillDrawer'
import UploadSkill from '@/components/DigitalHumanSetting/SkillConfig/UploadSkill'
import type { AiPromptSubmitPayload } from '@/components/DipChatKit/components/AiPromptInput/types'
import Empty from '@/components/Empty'
import IconFont from '@/components/IconFont'
import SearchInput from '@/components/SearchInput'
import SkillList from '@/components/SkillList'
import { useListService } from '@/hooks/useListService'
import { SkillManagementActionEnum } from './types'
import { getSkillManagementMenuItems } from './utils'

const SkillsManagement = () => {
  const navigate = useNavigate()
  const [messageApi, messageContextHolder] = message.useMessage()
  const [modal, modalContextHolder] = Modal.useModal()
  const [hasLoadedData, setHasLoadedData] = useState(false)
  const hasEverHadDataRef = useRef(false)
  const prevSearchValueRef = useRef('')
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [addSkillDrawerOpen, setAddSkillDrawerOpen] = useState(false)
  const [addSkillDrawerPayload, setAddSkillDrawerPayload] = useState<
    AiPromptSubmitPayload | undefined
  >(undefined)

  const getFetchArgs = useCallback((searchValue: string): [GetEnabledSkillsParams?] => {
    const trimmed = searchValue.trim()
    const params: GetEnabledSkillsParams | undefined = trimmed ? { name: trimmed } : undefined
    return [params]
  }, [])

  const {
    items: skills,
    loading,
    error,
    searchValue,
    handleSearch,
    handleRefresh,
  } = useListService<DigitalHumanSkill, [GetEnabledSkillsParams?]>({
    fetchFn: getEnabledSkills,
    getFetchArgs,
  })

  useEffect(() => {
    const wasSearching = prevSearchValueRef.current !== ''

    if (!loading) {
      if (skills.length > 0) {
        setHasLoadedData(true)
        hasEverHadDataRef.current = true
      } else if (!searchValue && hasEverHadDataRef.current) {
        if (!wasSearching) {
          setHasLoadedData(false)
          hasEverHadDataRef.current = false
        }
      }
    }

    prevSearchValueRef.current = searchValue
  }, [loading, skills.length, searchValue])

  const handleMenuClick = (key: SkillManagementActionEnum, skill: DigitalHumanSkill) => {
    switch (key) {
      case SkillManagementActionEnum.Delete:
        modal.confirm({
          title: '删除技能',
          icon: <ExclamationCircleFilled />,
          content: '删除后，技能的相关配置和数据将被清除，且无法被数字员工再次调用，请谨慎操作。',
          okText: '确定',
          okType: 'primary',
          okButtonProps: { danger: true },
          cancelText: '取消',
          footer: (_, { OkBtn, CancelBtn }) => (
            <>
              <OkBtn />
              <CancelBtn />
            </>
          ),
          onOk: async () => {
            try {
              await uninstallSkill(skill.name)
              messageApi.success('删除成功')
              handleRefresh()
            } catch (err: any) {
              if (err?.description) {
                messageApi.error(err.description)
                return
              }
            }
          },
        })
        break
    }
  }

  const renderStateContent = () => {
    if (loading && !skills.length) {
      return <Spin />
    }

    if (error) {
      return (
        <Empty type="failed" title="技能列表加载失败">
          <Button type="primary" onClick={handleRefresh}>
            重试
          </Button>
        </Empty>
      )
    }

    if (skills.length === 0) {
      if (searchValue) {
        return <Empty type="search" desc="抱歉，没有找到相关内容" />
      }
      return (
        <Empty title="暂无技能" subDesc="当前没有可用技能，可点击下方按钮导入或会话创建技能。">
          <div className="flex items-center gap-x-2 mt-2">
            <Button
              type="primary"
              icon={<IconFont type="icon-add" />}
              onClick={() => setUploadModalOpen(true)}
            >
              导入创建
            </Button>
            <Button
              type="primary"
              icon={<IconFont type="icon-newchat" />}
              onClick={() => {
                setAddSkillDrawerPayload(undefined)
                setAddSkillDrawerOpen(true)
              }}
            >
              会话创建
            </Button>
          </div>
        </Empty>
      )
    }

    return null
  }

  const renderContent = () => {
    const stateContent = renderStateContent()

    if (stateContent) {
      return <div className="absolute inset-0 flex items-center justify-center">{stateContent}</div>
    }

    return (
      <SkillList
        skills={skills}
        menuItems={(skill) =>
          skill.type === 'openclaw-managed'
            ? getSkillManagementMenuItems((key) => handleMenuClick(key, skill))
            : undefined
        }
        onCardClick={(skill) => {
          navigate(`/studio/skills/${encodeURIComponent(skill.name)}`)
        }}
      />
    )
  }

  return (
    <div
      id="skills-management-container"
      className="h-full p-6 pb-0 flex flex-col relative bg-[#F8FAFC]"
    >
      <AddSkillDrawer
        open={addSkillDrawerOpen}
        payload={addSkillDrawerPayload}
        getContainer={() => document.getElementById('skills-management-container') as HTMLElement}
        onClose={() => {
          setAddSkillDrawerOpen(false)
          setAddSkillDrawerPayload(undefined)
          void handleRefresh()
        }}
      />
      <UploadSkill
        open={uploadModalOpen}
        onCancel={() => setUploadModalOpen(false)}
        onSuccess={() => void handleRefresh()}
        onDetail={(data) => navigate(`/studio/skills/${encodeURIComponent(data?.name)}`)}
      />
      {messageContextHolder}
      {modalContextHolder}
      <div className="flex justify-between items-center mb-4 flex-shrink-0 z-20">
        <span className="font-bold text-lg text-[--dip-text-color]">全部技能</span>
        {(hasLoadedData || searchValue) && (
          <div className="flex items-center gap-x-3">
            <SearchInput onSearch={handleSearch} placeholder="搜索技能" />
            <Button onClick={() => setUploadModalOpen(true)}>导入创建</Button>
            <Button
              type="primary"
              icon={
                <div className="w-4 h-5">
                  <IconFont type="icon-newchat" className="!text-xl" />
                </div>
              }
              onClick={() => {
                setAddSkillDrawerPayload(undefined)
                setAddSkillDrawerOpen(true)
              }}
            >
              会话创建
            </Button>
            <Tooltip title="刷新">
              <Button type="text" icon={<IconFont type="icon-refresh" />} onClick={handleRefresh} />
            </Tooltip>
          </div>
        )}
      </div>
      {renderContent()}
    </div>
  )
}

export default memo(SkillsManagement)
