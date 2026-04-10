import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"m864 117.333.021 474.752A223.6 223.6 0 0 1 949.333 768c0 123.712-100.288 224-224 224-61.013 0-116.352-24.405-156.757-64H160V117.333zM725.333 608a160 160 0 1 0 0 320 160 160 0 0 0 0-320M800 181.333H224V864h298.88a223.15 223.15 0 0 1-21.547-96c0-123.712 100.288-224 224-224 26.176 0 51.307 4.48 74.667 12.757zm-74.667 480 31.36 63.51 70.08 10.197-50.709 49.45 11.947 69.803-62.678-32.96-62.698 32.96 11.968-69.802-50.71-49.451 70.102-10.197zm-256-85.333v64H320v-64zM704 426.667v64H320v-64zm0-149.334v64H320v-64z\"/>"

export default function ContractOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
