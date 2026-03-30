import { DownOutlined } from '@ant-design/icons'
import classnames from 'classnames'
import { ReactNode, useEffect, useState } from 'react'
import { FontIcon } from '@/icons'
import styles from './styles.module.less'

interface GroupContainerProps {
    data: any
    defaultExpand: boolean
    children: ReactNode
    key?: string
}
const GroupContainer = ({
    data,
    defaultExpand,
    children,
    key,
}: GroupContainerProps) => {
    const [expandStatus, setExpandStatus] = useState(false)

    useEffect(() => {
        setExpandStatus(defaultExpand)
    }, [defaultExpand])

    return (
        <div key={key || data?.id} className={styles.groupContainer}>
            <div className={styles.itemParentNode}>
                <DownOutlined
                    onClick={() => setExpandStatus(!expandStatus)}
                    className={classnames(styles.icon, {
                        [styles.iconExpanded]: expandStatus,
                        [styles.iconUnexpanded]: !expandStatus,
                    })}
                />
                <div className={styles.itemNodeText}>
                    <FontIcon
                        name="icon-luojishiti"
                        style={{
                            fontSize: 20,
                            color: 'rgba(39, 162, 254, 1)',
                            flexShrink: 0,
                        }}
                    />
                    <span
                        className={styles.itemNodeTextName}
                        title={data?.name}
                    >
                        {data?.name}
                    </span>
                </div>
            </div>
            {expandStatus && children}
        </div>
    )
}

export default GroupContainer
