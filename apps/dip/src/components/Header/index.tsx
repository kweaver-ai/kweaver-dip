import { Layout } from 'antd'
import type { HeaderType } from '@/routes/types'
import BaseHeader from './BaseHeader'
import MicroAppHeader from './MicroAppHeader'

const { Header: AntHeader } = Layout

const Header = ({ headerType }: { headerType: HeaderType }) => {
  return (
    <AntHeader className="h-[52px] bg-white border-b border-gray-200 flex items-center justify-between px-3 z-[100]">
      {headerType === 'micro-app' ? <MicroAppHeader /> : <BaseHeader headerType={headerType} />}
    </AntHeader>
  )
}

export default Header
