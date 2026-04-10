import { Layout } from 'antd'
import type { HeaderType } from '@/routes/types'
import BaseHeader from './BaseHeader'
import BusinessHeader from './BusinessHeader'
import MicroAppHeader from './MicroAppHeader'

const { Header: AntHeader } = Layout

const Header = ({ headerType }: { headerType: HeaderType }) => {
  if (headerType === 'home') {
    return null
  }
  // business 场景不设置 z-index，避免盖住微应用的弹层（toast/notification）
  const zIndexClass = headerType === 'business' ? '' : 'z-[100]'
  return (
    <AntHeader
      className={`h-[52px] bg-white border-b border-gray-200 flex items-center justify-between px-3 ${zIndexClass}`}
    >
      {headerType === 'micro-app' ? (
        <MicroAppHeader />
      ) : headerType === 'business' ? (
        <BusinessHeader />
      ) : (
        <BaseHeader headerType={headerType} />
      )}
    </AntHeader>
  )
}

export default Header
