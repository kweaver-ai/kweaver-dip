import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M192 64a128 128 0 0 1 123.968 96H384a160 160 0 0 1 159.68 149.504L544 320v384a96 96 0 0 0 86.784 95.552L640 800h68.032a128 128 0 1 1 0 64.064L640 864a160 160 0 0 1-159.68-149.504L480 704V320a96 96 0 0 0-86.784-95.552L384 224l-68.032.064A128 128 0 1 1 192 64m640 704a64 64 0 1 0 0 128 64 64 0 0 0 0-128M192 128a64 64 0 1 0 0 128 64 64 0 0 0 0-128M191.936 568.32 64.192 915.328l-8.704 23.616 46.528 17.728 8.704-23.616 26.88-72.832h155.776l26.88 72.832 8.768 23.68 46.464-17.792-8.768-23.68L238.4 568.256h-46.464zm82.752 241.344H156.16l59.072-160.512z\"/>"

export default function AutolineOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
