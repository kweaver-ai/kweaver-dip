import { Anchor } from 'antd'
import React from 'react'
import __ from '../locale'
import styles from './styles.module.less'

interface IApplyAnchor {
    container?: any
    config?: any[]
}

/**
 * 申请资源锚点
 */
const ApplyAnchor: React.FC<IApplyAnchor> = ({ container, config = [] }) => {
    const { Link } = Anchor

    return (
        <div className={styles.applyAnchor}>
            <Anchor
                targetOffset={16}
                getContainer={() =>
                    (container.current as HTMLElement) || window
                }
                onClick={(e: any) => e.preventDefault()}
                className={styles.anchorWrapper}
            >
                {config.map((item) => (
                    <Link
                        href={`#${item.key}`}
                        title={item.title}
                        key={item.key}
                    />
                ))}
            </Anchor>
        </div>
    )
}
export default ApplyAnchor
