import { Tooltip } from 'antd'
import IconFont from '../../IconFont'
import { UserMenuItem } from './UserMenuItem'

interface SiderFooterUserProps {
  collapsed: boolean
  onCollapse: (collapsed: boolean) => void
}

export const SiderFooterUser = ({ collapsed, onCollapse }: SiderFooterUserProps) => {
  if (collapsed) {
    return (
      <div className="dip-sider-footer-stack shrink-0">
        <div className="dip-sider-footer-row">
          <Tooltip title="展开" placement="right">
            <span className="flex min-w-0 flex-1">
              <button
                type="button"
                className="flex h-10 min-h-10 w-full min-w-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-[var(--dip-text-color)]"
                onClick={() => onCollapse(false)}
              >
                <IconFont type="icon-sidebar" className="text-base leading-none" />
              </button>
            </span>
          </Tooltip>
        </div>
        <div className="dip-sider-footer-row">
          <UserMenuItem collapsed={collapsed} />
        </div>
      </div>
    )
  }

  return (
    <div className="dip-sider-footer-row dip-sider-footer-row-horizontal shrink-0">
      <div className="min-w-0 flex-1">
        <UserMenuItem collapsed={collapsed} />
      </div>
      <Tooltip title="收起" placement="right">
        <button
          type="button"
          className="flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-[var(--dip-text-color)] hover:text-[var(--dip-primary-color)]"
          onClick={() => onCollapse(true)}
        >
          <IconFont type="icon-sidebar" className="text-base leading-none" />
        </button>
      </Tooltip>
    </div>
  )
}
