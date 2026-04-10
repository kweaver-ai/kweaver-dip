import { MacScrollbar, type MacScrollbarProps } from 'mac-scrollbar'
import { forwardRef, type PropsWithChildren } from 'react'
import 'mac-scrollbar/dist/mac-scrollbar.css'
import './index.less'

const ScrollBarContainer = forwardRef<any, PropsWithChildren<MacScrollbarProps>>(
  ({ children, ...restProps }, ref) => {
    return (
      <MacScrollbar ref={ref} {...restProps}>
        {children}
      </MacScrollbar>
    )
  },
)

export default ScrollBarContainer
