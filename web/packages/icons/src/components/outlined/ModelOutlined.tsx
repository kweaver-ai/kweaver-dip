import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"m546.505 53.493 336.373 194.195c24.802 14.278 40.555 41.56 40.555 70.117v388.39c0 28.623-15.753 55.839-40.555 70.117L546.505 970.507c-24.802 14.278-55.838 14.278-81.11 0L129.023 776.312a81.78 81.78 0 0 1-40.555-70.117v-388.39c0-29.092 15.752-55.839 40.555-70.117L465.395 53.493c24.802-14.278 55.839-14.278 81.11 0m-396.032 287.84v364.393c0 6.703 3.821 12.87 9.586 16.691L484.902 909.91V534.59zm710.887 11.798L546.907 534.925V898.38l304.934-175.962a19.24 19.24 0 0 0 9.52-16.758zM496.364 106.45 182.18 287.774 516.14 480.83l323.702-187.157L515.47 106.449a19.44 19.44 0 0 0-19.105 0\"/>"

export default function ModelOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
