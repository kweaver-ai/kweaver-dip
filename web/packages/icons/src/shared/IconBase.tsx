import React from 'react'

export interface BaseIconProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'children' | 'color'> {
  size?: number | string
  color?: string
  content?: string
  children?: React.ReactNode
  kind?: 'outlined' | 'colored'
}

export interface OutlinedIconProps extends BaseIconProps {
  color?: string
}

export interface ColoredIconProps extends Omit<BaseIconProps, 'color'> {}

export function IconBase({
  size = '1em',
  color,
  content,
  children,
  kind = 'outlined',
  style,
  fill,
  ...restProps
}: BaseIconProps) {
  const mergedStyle =
    kind === 'outlined' && color !== undefined
      ? { ...style, color }
      : style
  const resolvedFill = kind === 'outlined' ? fill ?? 'currentColor' : fill

  return (
    <svg
      width={size}
      height={size}
      aria-hidden={restProps['aria-label'] ? undefined : true}
      {...restProps}
      fill={resolvedFill}
      style={mergedStyle}
      dangerouslySetInnerHTML={content ? { __html: content } : undefined}
    >
      {content ? undefined : children}
    </svg>
  )
}
