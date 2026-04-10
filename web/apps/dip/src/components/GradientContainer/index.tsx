import classNames from 'classnames'
import React, { type CSSProperties, type ReactNode, useMemo } from 'react'
import bg from '@/assets/images/gradient-container-bg.png'

interface GradientContainerProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
}
const GradientContainer: React.FC<GradientContainerProps> = ({ children, className, style }) => {
  const wrapperStyle = useMemo(() => {
    const temp = {
      backgroundImage: `url(${bg})`,
      // background: 'transparent',
      ...style,
    }
    // if (process.env.NODE_ENV === 'development') {
    //   temp.backgroundColor = 'rgb(243, 248, 254)'
    // }
    return temp
  }, [])
  return (
    <div style={wrapperStyle} className={classNames('bg-no-repeat bg-cover relative', className)}>
      {children}
    </div>
  )
}

export default GradientContainer
