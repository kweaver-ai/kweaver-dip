import { forwardRef } from 'react'

export const MacScrollbar = forwardRef(({ children, ...props }: any, ref) => (
  <div ref={ref} data-testid="mac-scrollbar" {...props}>
    {children}
  </div>
))

export type MacScrollbarProps = any
