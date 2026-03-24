import { Drawer } from 'antd'
import DipChatKit from '@/components/DipChatKit'
import type { AiPromptSubmitPayload } from '@/components/DipChatKit/components/AiPromptInput/types'
import IconFont from '@/components/IconFont'
export interface AddSkillDrawerProps {
  open: boolean
  onClose: () => void
  payload?: AiPromptSubmitPayload
}

const AddSkillDrawer = ({ open, onClose, payload }: AddSkillDrawerProps) => {
  return (
    <Drawer
      title={
        <div className="flex items-center min-w-0 max-w-full">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-md text-[--dip-text-color]"
          >
            <IconFont type="icon-dip-left" />
          </button>
          <span
            className="flex-1 min-w-0 font-medium text-[--dip-text-color] truncate"
            title={payload?.content ?? '新建技能'}
          >
            {payload?.content ?? '新建技能'}
          </span>
        </div>
      }
      // extra={
      //   <div className="flex items-center gap-2 ml-2">
      //     <Button onClick={onClose}>取消</Button>
      //     <Button type="primary" onClick={handlePublish}>
      //       发布
      //     </Button>
      //   </div>
      // }
      open={open}
      zIndex={1100}
      onClose={onClose}
      closable={false}
      mask={false}
      destroyOnHidden
      rootStyle={{ position: 'absolute' }}
      styles={{
        wrapper: { width: '100%', minWidth: 0, overflow: 'hidden' },
        header: {
          minHeight: 48,
          padding: '10px 24px 10px 8px',
          borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
        },
        title: {
          margin: 0,
          minWidth: 0,
          overflow: 'hidden',
          maxWidth: '100%',
          fontSize: 14,
          lineHeight: '28px',
          fontWeight: 400,
          color: 'rgba(0, 0, 0, 0.85)',
        },
        body: { padding: 0 },
      }}
      getContainer={() => document.getElementById('digital-human-setting-container') as HTMLElement}
    >
      <div className="flex flex-col h-full min-h-0">
        <div className="flex flex-1 min-h-0">
          <DipChatKit
            showHeader={false}
            initialSubmitPayload={payload}
            assignEmployeeValue="__internal_skill_agent__"
          />
        </div>
      </div>
    </Drawer>
  )
}

export default AddSkillDrawer
