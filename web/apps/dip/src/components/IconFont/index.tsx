import { createFromIconfontCN } from '@ant-design/icons'
import type { IconFontProps } from '@ant-design/icons/es/components/IconFont'
import classNames from 'classnames'
import type { CSSProperties } from 'react'
import { forwardRef } from 'react'
import '@/assets/fonts/iconfont.js'
import '@/assets/fonts/color-iconfont.js'
import '@/assets/fonts/dip-studio-iconfont.js'
import '@/assets/fonts/kw-icon.js'
import '@/assets/fonts/kw-color-icon.js'

const IconBaseComponent = createFromIconfontCN({
  scriptUrl: [],
})

export interface IconFontType extends IconFontProps {
  className?: string
  style?: CSSProperties
}

const IconFont = forwardRef<unknown, IconFontType>((props, ref) => {
  const { className, ...restProps } = props
  return (
    <IconBaseComponent
      ref={ref as any}
      className={classNames('text-sm leading-[0px] inline-flex items-center', className)}
      {...restProps}
    />
  )
})

export default IconFont
