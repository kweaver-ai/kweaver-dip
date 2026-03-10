import { createFromIconfontCN } from '@ant-design/icons'
import type { IconFontProps } from '@ant-design/icons/es/components/IconFont'
import classNames from 'classnames'
import type React from 'react'
import type { CSSProperties } from 'react'
import '@/assets/fonts/iconfont.js'
import '@/assets/fonts/color-iconfont.js'
import '@/assets/fonts/dip-studio-iconfont.js'

const IconBaseComponent = createFromIconfontCN({
  scriptUrl: [],
})

export interface IconFontType extends IconFontProps {
  className?: string
  style?: CSSProperties
}

const IconFont: React.FC<IconFontType> = (props) => {
  const { className, ...restProps } = props
  return (
    <IconBaseComponent
      className={classNames('text-sm leading-[0px] inline-flex items-center', className)}
      {...restProps}
    />
  )
}

export default IconFont
