export interface MaskIconProps {
  url: string
  background: string
  className?: string
}

export const MaskIcon = ({ url, background, className }: MaskIconProps) => {
  return (
    <span
      className={className ?? 'w-4 h-4'}
      style={{
        background,
        WebkitMaskImage: `url(${url})`,
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        WebkitMaskSize: 'contain',
        maskImage: `url(${url})`,
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
        maskSize: 'contain',
      }}
    />
  )
}

export interface GradientMaskIconProps {
  url: string
  className?: string
}

/** 渐变遮罩图标 */
export const GradientMaskIcon = ({ url, className }: GradientMaskIconProps) => {
  return (
    <MaskIcon
      url={url}
      className={className}
      background="linear-gradient(210deg, #1C4DFA 0%, #3FA9F5 100%)"
    />
  )
}
