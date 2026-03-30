import { Tooltip } from 'antd'
import { FC, ReactNode } from 'react'
import styles from './styles.module.less'

interface IMultiLabelDisplay {
    data: Array<string | ReactNode>
    maxDisplayCount: number
}

/**
 * 多标签显示组件
 * @param param0
 * @returns
 */
const MultiLabelDisplay: FC<IMultiLabelDisplay> = ({
    data,
    maxDisplayCount,
}) => {
    const displayData =
        data?.length > maxDisplayCount ? data.slice(0, maxDisplayCount) : data
    return (
        <div className={styles.multiLabelContainer}>
            <Tooltip
                title={
                    data?.length ? (
                        <div className={styles.multiLabelTooltip}>
                            {data?.map((item, index) => (
                                <div className={styles.multiLabelTooltipItem}>
                                    <div className={styles.number}>
                                        {index + 1}
                                    </div>
                                    <div
                                        key={index}
                                        title={
                                            typeof item === 'string' ? item : ''
                                        }
                                    >
                                        {item}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        ''
                    )
                }
                color="#fff"
                overlayStyle={{ maxWidth: 500 }}
                placement="bottom"
            >
                <div className={styles.labelContent}>
                    <div className={styles.labelsWrapper}>
                        {displayData?.map((item, index) => (
                            <div key={index} className={styles.multiLabelItem}>
                                {item}
                            </div>
                        )) || '--'}
                    </div>
                    {data?.length > maxDisplayCount && (
                        <div className={styles.multiCount}>
                            <span>+{data.length - maxDisplayCount}</span>
                        </div>
                    )}
                </div>
            </Tooltip>
        </div>
    )
}

export default MultiLabelDisplay
