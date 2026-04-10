import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M984.233 112.64H38.349C17.044 112.64 0 126.853 0 142.49v739.02c0 15.637 17.044 29.85 38.349 29.85H985.65c21.305 0 38.349-12.79 38.349-29.844V142.484c-1.418-15.63-18.463-29.844-39.767-29.844m-36.925 220.288H436.019V172.329h511.289zm-511.289 306.98h217.293V851.67H436.014V639.908zm0-59.69V392.623h217.293v189.01H436.014v-1.418zm292.567-187.596h217.298v189.01H728.586V392.617zM359.322 172.324v160.599H75.274V172.329h284.048zM75.274 392.617h284.048v460.472H75.274zm653.312 459.054V639.908h217.298V851.67z\"/>"

export default function DataviewOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
