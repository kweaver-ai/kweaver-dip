import { Mermaid } from '@ant-design/x'
import clsx from 'clsx'
import type React from 'react'
import styles from './index.module.less'
import type { PreviewMermaidProps } from './types'

const PreviewMermaid: React.FC<PreviewMermaidProps> = ({ content }) => {
  return (
    <div className={clsx('PreviewMermaid', styles.root)}>
      <Mermaid>{content}</Mermaid>
    </div>
  )
}

export default PreviewMermaid
