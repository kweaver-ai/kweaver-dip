import { Button, message, Spin } from 'antd'
import { useLayoutEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  type CreateDigitalHumanRequest,
  createDigitalHuman,
  type UpdateDigitalHumanRequest,
  updateDigitalHuman,
} from '@/apis/dip-studio/digital-human'
import AppIcon from '@/components/AppIcon'
import DigitalHumanSetting from '@/components/DigitalHumanSetting'
import DeleteModal from '@/components/DigitalHumanSetting/ActionModal/DeleteModal'
import { useDigitalHumanStore } from '@/components/DigitalHumanSetting/digitalHumanStore'
import IconFont from '@/components/IconFont'
import { useUserInfoStore } from '@/stores/userInfoStore'
import { resolveDigitalHumanIconSrc } from '@/utils/digital-human/resolveDigitalHumanIcon'
import { formatTimeSlash } from '@/utils/handle-function/FormatTime'
import { useDigitalHumanPageLoad } from '../useDigitalHumanPageLoad'

type DHSettingParams = {
  digitalHumanId?: string
}

/** 管理员全页配置：新建 `/studio/digital-human/setting`，编辑 `/studio/digital-human/:id/setting?mode=edit` */
const DHSetting = () => {
  const params = useParams<DHSettingParams>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const isAdmin = useUserInfoStore((s) => s.isAdmin)
  const {
    uiMode,
    basic,
    setUiMode,
    digitalHumanId,
    detail,
    bkn,
    skills,
    channel,
    resetAllToDetail,
    frozenDisplayNameForEdit,
  } = useDigitalHumanStore()
  const [, messageContextHolder] = message.useMessage()
  const [publishing, setPublishing] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  // 创建模式进入时生成一个随机头像 ID（整个页面生命周期内保持不变）
  const [createAvatarId] = useState<string>(() => `dh_${Math.floor(Math.random() * 8) + 1}`)

  const routeId = params.digitalHumanId
  const modeFromQuery = searchParams.get('mode')
  const isEditFromUrl = Boolean(routeId && modeFromQuery === 'edit')

  useLayoutEffect(() => {
    if (isAdmin) return
    if (!routeId) {
      navigate(`/studio/digital-human`, { replace: true })
      return
    }
    navigate(`/studio/digital-human/${routeId}`, { replace: true })
  }, [isAdmin, routeId, navigate])

  const loading = useDigitalHumanPageLoad(routeId, 'setting', modeFromQuery, isAdmin)

  const handleBack = () => {
    navigate('/studio/digital-human')
  }

  const handleCancelEdit = () => {
    if (isEditFromUrl) {
      navigate('/studio/digital-human')
      return
    }
    resetAllToDetail()
    setUiMode('view')
  }

  const headerDisplayName =
    uiMode === 'edit' ? (frozenDisplayNameForEdit ?? basic.name).trim() || basic.name : basic.name

  const headerAvatarSrc = resolveDigitalHumanIconSrc(
    uiMode === 'create' ? createAvatarId : detail?.icon_id,
  )

  const handlePublish = async () => {
    const name = basic.name.trim()
    if (!name) {
      message.error('请输入名称')
      return
    }

    setPublishing(true)
    try {
      const creature = basic.creature?.trim() || undefined
      const soul = basic.soul?.trim() || undefined

      const createBody: CreateDigitalHumanRequest = {
        name,
        ...(creature !== undefined ? { creature } : {}),
        ...(soul !== undefined ? { soul } : {}),
        icon_id: createAvatarId,
        skills: skills.map((skill) => skill.name),
        bkn,
        ...(channel !== undefined ? { channel } : {}),
      }

      if (digitalHumanId) {
        const updateBody: UpdateDigitalHumanRequest = {
          name,
          ...(creature !== undefined ? { creature } : {}),
          ...(soul !== undefined ? { soul } : {}),
          skills: skills.map((skill) => skill.name),
          bkn,
          ...(channel !== undefined ? { channel } : {}),
        }
        await updateDigitalHuman(digitalHumanId, updateBody)
        useDigitalHumanStore.setState({ frozenDisplayNameForEdit: name })
        message.success('发布成功')
        handleBack()
      } else {
        await createDigitalHuman(createBody)
        message.success('创建成功')
        navigate(`/studio/digital-human`, { replace: true })
      }
    } catch (err: any) {
      message.error(err?.description || '发布失败')
    } finally {
      setPublishing(false)
    }
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div
      className="h-full flex flex-col bg-[--dip-white] relative"
      id="digital-human-setting-container"
    >
      {messageContextHolder}
      <DeleteModal
        open={deleteModalOpen}
        deleteData={digitalHumanId ? { id: digitalHumanId, name: basic.name } : undefined}
        onCancel={() => setDeleteModalOpen(false)}
        onOk={() => {
          setDeleteModalOpen(false)
          navigate('/studio/digital-human')
        }}
      />
      <div className="flex items-center justify-between h-12 pl-3 pr-6 border-b border-[--dip-border-color] bg-white flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center justify-center w-8 h-8 rounded-md text-[--dip-text-color]"
          >
            <IconFont type="icon-left" />
          </button>
          <div className="flex items-center gap-3">
            {uiMode === 'create' ? (
              <>
                {headerAvatarSrc ? (
                  <img
                    src={headerAvatarSrc}
                    alt={basic.name}
                    className="flex-shrink-0 w-8 h-8 rounded-md overflow-hidden object-cover"
                  />
                ) : (
                  <IconFont
                    type="icon-object-class"
                    className="flex-shrink-0 flex items-center justify-center rounded w-6 h-6 bg-[rgb(var(--dip-primary-color-rgb-space)/10%)] text-[var(--dip-primary-color)]"
                  />
                )}
                <span className="font-medium text-[--dip-text-color]">新建数字员工</span>
              </>
            ) : routeId ? (
              <>
                {headerAvatarSrc ? (
                  <img
                    src={headerAvatarSrc}
                    alt={headerDisplayName}
                    className="w-8 h-8 rounded-md overflow-hidden object-cover"
                  />
                ) : (
                  <AppIcon
                    name={headerDisplayName}
                    size={32}
                    className="w-8 h-8 rounded-md overflow-hidden"
                    shape="square"
                  />
                )}
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-[--dip-text-color]">{headerDisplayName}</span>
                  {detail?.updated_at && (
                    <span className="text-[--dip-text-color-65] text-xs">
                      更新：
                      {formatTimeSlash(new Date(detail.updated_at).getTime())}
                    </span>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {uiMode === 'view' ? (
            <Button type="primary" onClick={() => setUiMode('edit')}>
              编辑
            </Button>
          ) : (
            <>
              {uiMode === 'edit' && <Button onClick={handleCancelEdit}>取消</Button>}
              <Button type="primary" loading={publishing} onClick={() => void handlePublish()}>
                发布
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Spin />
          </div>
        ) : (
          <DigitalHumanSetting readonly={uiMode === 'view'} />
        )}
      </div>
    </div>
  )
}

export default DHSetting
