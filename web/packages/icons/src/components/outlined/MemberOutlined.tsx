import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"m514.703 198.359 196.11 251a15.99 15.99 0 0 0 19.746 4.457l114.918-57.479-52.282 406.61H236.162l-52.293-406.61 114.918 57.48a15.99 15.99 0 0 0 19.746-4.457zm0-80.943a15.9 15.9 0 0 0-12.6 6.146l-4.458 5.746L294.64 389.123l-152.811-76.346a15.989 15.989 0 0 0-22.984 16.338l64.504 501.893a31.98 31.98 0 0 0 31.718 27.9h599.272a31.98 31.98 0 0 0 31.718-27.9l64.534-501.923a15.989 15.989 0 0 0-22.984-16.338l-152.82 76.396L531.78 129.328l-4.477-5.726a15.9 15.9 0 0 0-12.6-6.146z\"/><path d=\"M466.737 523.167a47.966 47.966 0 1 0 95.932 0 47.966 47.966 0 1 0-95.932 0\"/>"

export default function MemberOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
