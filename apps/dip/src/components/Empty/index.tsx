import { memo, useMemo } from 'react'
import empty from '@/assets/images/abnormal/empty.svg'
import loadFailed from '@/assets/images/abnormal/loadFailed.png'
import searchEmpty from '@/assets/images/abnormal/searchEmpty.svg'

/**
 * 空 样式组件
 * @interface IEmpty
 * @param {string} iconSrc 图标路径
 * @param {React.ReactElement} desc 描述文字
 */
interface IEmpty
  extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  iconSrc?: any
  iconHeight?: any
  desc?: React.ReactElement | string
  subDesc?: React.ReactElement | string
  children?: React.ReactElement
  type?: 'empty' | 'search' | 'failed'
}

const Empty: React.FC<IEmpty> = ({
  type = 'empty',
  iconHeight = 144,
  title = '',
  desc = '',
  iconSrc,
  subDesc,
  children,
}) => {
  const icon = useMemo(() => {
    if (iconSrc) {
      return iconSrc
    }
    if (type === 'failed') {
      return loadFailed
    }
    if (type === 'search') {
      return searchEmpty
    }
    return empty
  }, [type, iconSrc])

  return (
    <div className="flex flex-col h-full w-full items-center justify-center gap-y-3">
      <img src={icon} alt="" style={{ height: iconHeight, maxHeight: iconHeight }} />
      {title && <div className="font-medium text-[--dip-text-color-75]">{title}</div>}
      {desc && <div className="font-normal text-[--dip-text-color-75]">{desc}</div>}
      {subDesc && <div className="text-xs font-normal text-[--dip-text-color-75]">{subDesc}</div>}
      {children}
    </div>
  )
}
export default memo(Empty)
